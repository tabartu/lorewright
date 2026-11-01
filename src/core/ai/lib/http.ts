import { AIError, fromFetch, fromHttp } from '../errors'
import type { ProviderConfig } from '../types'

/** Join a base URL and a path, then route it through the local proxy if configured. */
export function endpoint(cfg: ProviderConfig, path: string): string {
  const url = `${cfg.baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
  return cfg.proxy ? `${cfg.proxy.replace(/\/+$/, '')}/${url}` : url
}

export function isLocalUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.local')
  } catch {
    return false
  }
}

/** fetch() that turns every failure into an AIError. */
export async function request(cfg: ProviderConfig, url: string, init: RequestInit): Promise<Response> {
  let res: Response
  try {
    res = await fetch(url, init)
  } catch (err) {
    throw fromFetch(err, !cfg.proxy && isLocalUrl(cfg.baseUrl))
  }
  if (!res.ok) throw fromHttp(res.status, await res.text().catch(() => ''))
  return res
}

export async function requestJson<T>(cfg: ProviderConfig, url: string, init: RequestInit): Promise<T> {
  const res = await request(cfg, url, init)
  try {
    return (await res.json()) as T
  } catch {
    throw new AIError('bad_request', 'Response was not JSON')
  }
}
