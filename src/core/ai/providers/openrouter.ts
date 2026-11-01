import { openAICompatible } from '../lib/openaiCompatible'

/** One key, many models. OpenRouter asks apps to identify themselves. */
export default openAICompatible({
  id: 'openrouter',
  defaultBaseUrl: 'https://openrouter.ai/api/v1',
  needsKey: true,
  browserFriendly: true,
  headers: () => ({ 'HTTP-Referer': location.origin, 'X-Title': 'Worldledger' }),
})
