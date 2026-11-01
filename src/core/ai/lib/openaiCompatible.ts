import { AIError } from '../errors'
import type { AIProvider, GenerateRequest, ProviderConfig, ProviderType } from '../types'
import { endpoint, request, requestJson } from './http'
import { readEvents } from './sse'

interface Options {
  id: ProviderType
  defaultBaseUrl: string
  needsKey: boolean
  local?: boolean
  browserFriendly: boolean
  headers?: () => Record<string, string>
  /** Override model listing (e.g. Ollama's /api/tags). */
  listModels?: (cfg: ProviderConfig, signal?: AbortSignal) => Promise<string[]>
  /** Base for chat calls if it differs from the configured base (e.g. Ollama adds /v1). */
  chatBase?: (cfg: ProviderConfig) => ProviderConfig
}

/** Any API that speaks OpenAI's /models and /chat/completions. */
export function openAICompatible(o: Options): AIProvider {
  const headers = (cfg: ProviderConfig): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
    ...(o.headers?.() ?? {}),
  })
  const chat = (cfg: ProviderConfig) => (o.chatBase ? o.chatBase(cfg) : cfg)

  async function listModels(cfg: ProviderConfig, signal?: AbortSignal) {
    if (o.listModels) return o.listModels(cfg, signal)
    const c = chat(cfg)
    const json = await requestJson<{ data?: Array<{ id: string }> }>(c, endpoint(c, 'models'), { headers: headers(cfg), signal })
    return (json.data ?? []).map((m) => m.id).sort()
  }

  async function* stream(cfg: ProviderConfig, req: GenerateRequest, signal?: AbortSignal) {
    const c = chat(cfg)
    const res = await request(c, endpoint(c, 'chat/completions'), {
      method: 'POST',
      headers: headers(cfg),
      signal,
      body: JSON.stringify({
        model: req.model,
        stream: true,
        max_tokens: req.maxTokens,
        temperature: req.temperature,
        messages: [{ role: 'system', content: req.system }, ...req.messages],
      }),
    })
    if (!res.body) throw new AIError('empty_response')
    for await (const data of readEvents(res.body, signal)) {
      if (data === '[DONE]') return
      let json: { choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>; error?: { message?: string } }
      try {
        json = JSON.parse(data)
      } catch {
        continue
      }
      if (json.error) throw new AIError('server_error', json.error.message)
      const piece = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content
      if (piece) yield piece
    }
  }

  return {
    id: o.id,
    defaultBaseUrl: o.defaultBaseUrl,
    needsKey: o.needsKey,
    local: o.local,
    browserFriendly: o.browserFriendly,
    listModels,
    stream,
    async testConnection(cfg, model) {
      if (o.needsKey && !cfg.apiKey) throw new AIError('invalid_key', 'No API key')
      if (!model) {
        await listModels(cfg)
        return
      }
      for await (const _piece of stream(cfg, { model, system: 'Reply with OK.', messages: [{ role: 'user', content: 'OK?' }], maxTokens: 5 })) {
        return
      }
    },
  }
}
