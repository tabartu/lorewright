/** Normalized, translatable AI errors (`errors:ai.<code>`). */
export type AIErrorCode =
  | 'not_configured'
  | 'invalid_key'
  | 'quota_exceeded'
  | 'rate_limited'
  | 'model_not_found'
  | 'local_unreachable'
  | 'cors_or_network'
  | 'context_too_long'
  | 'bad_request'
  | 'server_error'
  | 'aborted'
  | 'empty_response'
  | 'unknown'

export class AIError extends Error {
  readonly code: AIErrorCode
  readonly status?: number
  readonly detail?: string
  constructor(code: AIErrorCode, detail?: string, status?: number) {
    super(detail ? `${code}: ${detail}` : code)
    this.name = 'AIError'
    this.code = code
    this.status = status
    this.detail = detail
  }
}

/** Map an HTTP error response to an AIError. */
export function fromHttp(status: number, body: string): AIError {
  const text = body.toLowerCase()
  const detail = extractMessage(body)
  if (status === 401 || status === 403) return new AIError('invalid_key', detail, status)
  if (status === 404 || /model.*(not found|does not exist|not_found)|unknown model|no such model/.test(text)) return new AIError('model_not_found', detail, status)
  if (status === 402 || /insufficient_quota|quota|credit|billing|balance/.test(text)) return new AIError('quota_exceeded', detail, status)
  if (status === 429) return new AIError('rate_limited', detail, status)
  if (status === 413 || /context.{0,20}(length|window)|too many tokens|maximum context|prompt is too long/.test(text)) return new AIError('context_too_long', detail, status)
  if (status >= 500) return new AIError('server_error', detail, status)
  if (status >= 400) return new AIError('bad_request', detail, status)
  return new AIError('unknown', detail, status)
}

/** Map a thrown fetch error (no HTTP response at all). */
export function fromFetch(err: unknown, local: boolean): AIError {
  if (err instanceof AIError) return err
  if (err instanceof DOMException && err.name === 'AbortError') return new AIError('aborted')
  // Browsers report CORS refusals and unreachable hosts the same way: a TypeError.
  return new AIError(local ? 'local_unreachable' : 'cors_or_network', err instanceof Error ? err.message : String(err))
}

function extractMessage(body: string): string | undefined {
  try {
    const json = JSON.parse(body)
    const msg = json?.error?.message ?? json?.message ?? json?.error ?? json?.detail
    return typeof msg === 'string' ? msg.slice(0, 300) : undefined
  } catch {
    return body ? body.slice(0, 300) : undefined
  }
}
