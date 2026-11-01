import { openAICompatible } from '../lib/openaiCompatible'

/**
 * Any service with an OpenAI-style API: Groq, Mistral, DeepSeek, Together…
 * Many of them block browser requests; the optional local proxy fixes that.
 */
export default openAICompatible({ id: 'openai-compatible', defaultBaseUrl: '', needsKey: true, browserFriendly: false })
