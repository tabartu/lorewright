/** Domain errors carry a code; the UI translates it via `errors:lore.<code>`. */
export type LoreErrorCode = 'title_required' | 'title_taken' | 'not_found' | 'category_not_empty'

export class LoreError extends Error {
  readonly code: LoreErrorCode
  constructor(code: LoreErrorCode, message?: string) {
    super(message ?? code)
    this.code = code
    this.name = 'LoreError'
  }
}
