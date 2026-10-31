/**
 * Resolve a CSS colour (including oklch() custom properties) to an RGB hex
 * string that canvas-based libraries such as Cytoscape understand.
 */
const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
canvas && (canvas.width = canvas.height = 1)
const ctx = canvas?.getContext('2d', { willReadFrequently: true }) ?? null

export function resolveColor(cssColor: string, fallback = '#888888'): string {
  if (!ctx || !cssColor) return fallback
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = fallback
  ctx.fillStyle = cssColor
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** Read a design-token custom property from the document and resolve it. */
export function tokenColor(name: string, fallback?: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return resolveColor(raw, fallback)
}
