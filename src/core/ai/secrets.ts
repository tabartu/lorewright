import Dexie, { type EntityTable } from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import { newId } from '../lore/normalize'
import type { AITask, ProviderProfile, TaskAssignment } from './types'

interface SettingRow {
  key: string
  value: unknown
}

/**
 * API keys and AI settings. A separate IndexedDB database that is never
 * exported, backed up or sent anywhere except to the provider itself.
 */
class SecretsDB extends Dexie {
  profiles!: EntityTable<ProviderProfile, 'id'>
  settings!: EntityTable<SettingRow, 'key'>
  constructor() {
    super('worldledger-secrets')
    this.version(1).stores({ profiles: 'id', settings: 'key' })
  }
}

export const secrets = new SecretsDB()

export const DEFAULT_PROXY = 'http://localhost:8787'

export async function saveProfile(p: Omit<ProviderProfile, 'id'> & { id?: string }): Promise<ProviderProfile> {
  const profile = { ...p, id: p.id ?? newId() } as ProviderProfile
  await secrets.profiles.put(profile)
  const active = await secrets.settings.get('activeProfileId')
  if (!active?.value) await secrets.settings.put({ key: 'activeProfileId', value: profile.id })
  return profile
}

export async function deleteProfile(id: string) {
  await secrets.transaction('rw', secrets.profiles, secrets.settings, async () => {
    await secrets.profiles.delete(id)
    const active = await secrets.settings.get('activeProfileId')
    if (active?.value === id) {
      const next = await secrets.profiles.toCollection().first()
      await secrets.settings.put({ key: 'activeProfileId', value: next?.id ?? null })
    }
  })
}

export async function setActiveProfile(id: string) {
  await secrets.settings.put({ key: 'activeProfileId', value: id })
}

export async function setTaskAssignment(task: AITask, assignment: TaskAssignment) {
  const row = await secrets.settings.get('tasks')
  const tasks = { ...((row?.value as Record<AITask, TaskAssignment>) ?? {}), [task]: assignment }
  await secrets.settings.put({ key: 'tasks', value: tasks })
}

export async function setProxyUrl(url: string) {
  await secrets.settings.put({ key: 'proxyUrl', value: url.trim() || DEFAULT_PROXY })
}

export interface AISettings {
  profiles: ProviderProfile[]
  activeProfileId?: string
  tasks: Partial<Record<AITask, TaskAssignment>>
  proxyUrl: string
}

export function useAISettings(): AISettings | undefined {
  return useLiveQuery(async () => {
    const [profiles, active, tasks, proxy] = await Promise.all([
      secrets.profiles.toArray(),
      secrets.settings.get('activeProfileId'),
      secrets.settings.get('tasks'),
      secrets.settings.get('proxyUrl'),
    ])
    return {
      profiles,
      activeProfileId: (active?.value as string | undefined) ?? profiles[0]?.id,
      tasks: (tasks?.value as AISettings['tasks']) ?? {},
      proxyUrl: (proxy?.value as string | undefined) ?? DEFAULT_PROXY,
    }
  }, [])
}

/** Which profile and model a task runs on: its own assignment, else the active profile. */
export function resolveTask(settings: AISettings, task: AITask): { profile: ProviderProfile; model: string } | null {
  const a = settings.tasks[task]
  const profile = settings.profiles.find((p) => p.id === a?.profileId) ?? settings.profiles.find((p) => p.id === settings.activeProfileId) ?? settings.profiles[0]
  if (!profile) return null
  return { profile, model: a?.model?.trim() || profile.model }
}
