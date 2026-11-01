import { openAICompatible } from '../lib/openaiCompatible'

/** LM Studio's local server ("Developer" tab). Enable CORS in its server settings. */
export default openAICompatible({ id: 'lmstudio', defaultBaseUrl: 'http://localhost:1234/v1', needsKey: false, local: true, browserFriendly: true })
