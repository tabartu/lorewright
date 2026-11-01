import { AIError } from '../errors'
import { endpoint, request, requestJson } from '../lib/http'
import { readEvents } from '../lib/sse'
import type { AIProvider, GenerateRequest, ProviderConfig } from '../types'

const headers = (cfg: ProviderConfig) => ({ 'Content-Type': 'application/json', 'x-goog-api-key': cfg.apiKey ?? '' })
const modelPath = (model: string) => (model.startsWith('models/') ? model : `models/${model}`)

async function* stream(cfg: ProviderConfig, req: GenerateRequest, signal?: AbortSignal) {
  const res = await request(cfg, endpoint(cfg, `${modelPath(req.model)}:streamGenerateContent?alt=sse`), {
    method: 'POST',
    headers: headers(cfg),
    signal,
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: req.system }] },
      contents: req.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: req.maxTokens, temperature: req.temperature },
    }),
  })
  if (!res.body) throw new AIError('empty_response')
  for await (const data of readEvents(res.body, signal)) {
    let json: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } }
    try {
      json = JSON.parse(data)
    } catch {
      continue
    }
    if (json.error) throw new AIError('server_error', json.error.message)
    for (const part of json.candidates?.[0]?.content?.parts ?? []) if (part.text) yield part.text
  }
}

const gemini: AIProvider = {
  id: 'gemini',
  defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  needsKey: true,
  browserFriendly: true,
  async listModels(cfg, signal) {
    const json = await requestJson<{ models?: Array<{ name: string; supportedGenerationMethods?: string[] }> }>(cfg, endpoint(cfg, 'models?pageSize=200'), { headers: headers(cfg), signal })
    return (json.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => m.name.replace(/^models\//, ''))
  },
  stream,
  async testConnection(cfg, model) {
    if (!cfg.apiKey) throw new AIError('invalid_key', 'No API key')
    if (!model) {
      await gemini.listModels(cfg)
      return
    }
    for await (const _piece of stream(cfg, { model, system: 'Reply with OK.', messages: [{ role: 'user', content: 'OK?' }], maxTokens: 5 })) return
  },
}

export default gemini
