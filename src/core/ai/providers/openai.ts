import { openAICompatible } from '../lib/openaiCompatible'

export default openAICompatible({ id: 'openai', defaultBaseUrl: 'https://api.openai.com/v1', needsKey: true, browserFriendly: true })
