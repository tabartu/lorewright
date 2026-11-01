import type { AIProvider, ProviderType } from './types'

/**
 * Every file in ./providers registers itself by default-exporting an
 * AIProvider. Adding a provider means adding one file there.
 */
const ORDER: ProviderType[] = ['anthropic', 'openai', 'gemini', 'openrouter', 'ollama', 'lmstudio', 'openai-compatible']

const modules = import.meta.glob<{ default: AIProvider }>('./providers/*.ts', { eager: true })

export const PROVIDERS: AIProvider[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id))

export function getProvider(id: ProviderType): AIProvider {
  const p = PROVIDERS.find((x) => x.id === id)
  if (!p) throw new Error(`Unknown AI provider: ${id}`)
  return p
}
