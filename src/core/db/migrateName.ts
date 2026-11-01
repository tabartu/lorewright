import Dexie from 'dexie'
import { db } from './db'
import { secrets } from '../ai/secrets'

/**
 * One-time move from the app's former name (Lorewright) to Worldledger.
 * Copies the old IndexedDB databases and localStorage preferences into the
 * new names, then removes the old ones. Safe to run on every start.
 */
const OLD_MAIN = 'lorewright'
const OLD_SECRETS = 'lorewright-secrets'
const OLD_KEYS: Array<[string, string]> = [
  ['lorewright.theme', 'worldledger.theme'],
  ['lorewright.language', 'worldledger.language'],
]

export async function migrateFromOldName(): Promise<void> {
  try {
    for (const [from, to] of OLD_KEYS) {
      const v = localStorage.getItem(from)
      if (v !== null && localStorage.getItem(to) === null) localStorage.setItem(to, v)
      localStorage.removeItem(from)
    }
  } catch {
    /* storage unavailable */
  }
  if (!('databases' in indexedDB)) return
  const names = new Set((await indexedDB.databases()).map((d) => d.name))
  if (names.has(OLD_MAIN)) await copyDatabase(OLD_MAIN, db)
  if (names.has(OLD_SECRETS)) await copyDatabase(OLD_SECRETS, secrets)
}

async function copyDatabase(oldName: string, target: Dexie) {
  const old = new Dexie(oldName)
  try {
    await old.open()
    await target.open()
    for (const table of old.tables) {
      const dest = target.tables.find((t) => t.name === table.name)
      if (!dest) continue
      // Never overwrite data that already exists under the new name.
      if ((await dest.count()) > 0) continue
      const rows = await table.toArray()
      if (rows.length) await dest.bulkPut(rows)
    }
    old.close()
    await Dexie.delete(oldName)
  } catch (err) {
    console.warn(`Could not move data from ${oldName}`, err)
    old.close()
  }
}
