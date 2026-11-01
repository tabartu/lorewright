/**
 * Provider-agnostic AI contract. The rest of the app only talks to
 * `AIProvider` through the registry; it never knows which vendor runs.
 */
export type ProviderType = 'anthropic' | 'openai' | 'gemini' | 'openrouter' | 'ollama' | 'lmstudio' | 'openai-compatible'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface GenerateRequest {
  model: string
  system: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
}

/** Connection settings for one call. `proxy` routes requests through the optional local proxy. */
export interface ProviderConfig {
  baseUrl: string
  apiKey?: string
  proxy?: string
}

export interface AIProvider {
  id: ProviderType
  /** Default API base URL shown in settings. */
  defaultBaseUrl: string
  /** Whether an API key is required (local servers need none). */
  needsKey: boolean
  /** Runs on the user's computer (Ollama, LM Studio). */
  local?: boolean
  /** Whether browsers can call it directly; false means the proxy is likely needed. */
  browserFriendly: boolean
  listModels(cfg: ProviderConfig, signal?: AbortSignal): Promise<string[]>
  stream(cfg: ProviderConfig, req: GenerateRequest, signal?: AbortSignal): AsyncIterable<string>
  testConnection(cfg: ProviderConfig, model?: string): Promise<void>
}

/** A saved provider profile (lives only in the secrets database). */
export interface ProviderProfile {
  id: string
  type: ProviderType
  label: string
  baseUrl: string
  apiKey?: string
  model: string
  useProxy?: boolean
}

export type AITask = 'expand' | 'fillMissing' | 'consistency'
export const AI_TASKS: AITask[] = ['expand', 'fillMissing', 'consistency']

export interface TaskAssignment {
  profileId?: string
  /** Overrides the profile's default model for this task. */
  model?: string
}
