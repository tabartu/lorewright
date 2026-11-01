import { AIError } from '../errors'
import { endpoint, request, requestJson } from '../lib/http'
import { readEvents } from '../lib/sse'
import type { AIProvider, GenerateRequest, ProviderConfig } from '../types'

const headers = (cfg: ProviderConfig) => ({
  'Content-Type': 'application/json',
  'x-api-key': cfg.apiKey ?? '',
  'anthropic-version': '2023-06-01',
  // Required for calls straight from a browser; the key never leaves this device otherwise.
  'anthropic-dangerous-direct-browser-access': 'true',
})

async function* stream(cfg: ProviderConfig, req: GenerateRequest, signal?: AbortSignal) {
  const res = await request(cfg, endpoint(cfg, 'v1/messages'), {
    method: 'POST',
    headers: headers(cfg),
    signal,
    body: JSON.stringify({
      model: req.model,
      system: req.system,
      messages: req.messages,
      max_tokens: req.maxTokens ?? 2048,
      temperature: req.temperature,
      stream: true,
    }),
  })
  if (!res.body) throw new AIError('empty_response')
  for await (const data of readEvents(res.body, signal)) {
    let json: { type?: string; delta?: { type?: string; text?: string }; error?: { message?: string } }
    try {
      json = JSON.parse(data)
    } catch {
      continue
    }
    if (json.type === 'error') throw new AIError('server_error', json.error?.message)
    if (json.type === 'content_block_delta' && json.delta?.text) yield json.delta.text
    if (json.type === 'message_stop') return
  }
}

const anthropic: AIProvider = {
  id: 'anthropic',
  defaultBaseUrl: 'https://api.anthropic.com',
  needsKey: true,
  browserFriendly: true,
  async listModels(cfg, signal) {
    const json = await requestJson<{ data?: Array<{ id: string }> }>(cfg, endpoint(cfg, 'v1/models?limit=100'), { headers: headers(cfg), signal })
    return (json.data ?? []).map((m) => m.id)
  },
  stream,
  async testConnection(cfg, model) {
    if (!cfg.apiKey) throw new AIError('invalid_key', 'No API key')
    if (!model) {
      await anthropic.listModels(cfg)
      return
    }
    for await (const _piece of stream(cfg, { model, system: 'Reply with OK.', messages: [{ role: 'user', content: 'OK?' }], maxTokens: 5 })) return
  },
}

export default anthropic
