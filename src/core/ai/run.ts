import { AIError } from './errors'
import { getProvider } from './registry'
import { resolveTask, type AISettings } from './secrets'
import type { AITask, GenerateRequest } from './types'

/** Stream a task through whichever provider and model the settings assign to it. */
export async function* runTask(
  settings: AISettings,
  task: AITask,
  req: Omit<GenerateRequest, 'model'>,
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  const target = resolveTask(settings, task)
  if (!target) throw new AIError('not_configured')
  const { profile, model } = target
  if (!model) throw new AIError('model_not_found', 'No model selected')
  const provider = getProvider(profile.type)
  const cfg = {
    baseUrl: profile.baseUrl || provider.defaultBaseUrl,
    apiKey: profile.apiKey,
    proxy: profile.useProxy ? settings.proxyUrl : undefined,
  }
  let any = false
  for await (const piece of provider.stream(cfg, { ...req, model }, signal)) {
    any = true
    yield piece
  }
  if (!any) throw new AIError('empty_response')
}

export function describeTarget(settings: AISettings, task: AITask): string | null {
  const t = resolveTask(settings, task)
  return t ? `${t.profile.label} · ${t.model}` : null
}
