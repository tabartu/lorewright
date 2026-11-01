import { endpoint, requestJson } from '../lib/http'
import { openAICompatible } from '../lib/openaiCompatible'

/**
 * Ollama on this computer. Chat uses its OpenAI-compatible /v1 API; models
 * come from /api/tags. Start it with OLLAMA_ORIGINS set so browsers may call it.
 */
export default openAICompatible({
  id: 'ollama',
  defaultBaseUrl: 'http://localhost:11434',
  needsKey: false,
  local: true,
  browserFriendly: true,
  chatBase: (cfg) => ({ ...cfg, baseUrl: `${cfg.baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '')}/v1` }),
  async listModels(cfg, signal) {
    const base = { ...cfg, baseUrl: cfg.baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '') }
    const json = await requestJson<{ models?: Array<{ name: string }> }>(base, endpoint(base, 'api/tags'), { signal })
    return (json.models ?? []).map((m) => m.name).sort()
  },
})
