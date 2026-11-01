/**
 * Provider-agnostic prompt templates. Written in English; every prompt tells
 * the model to answer in the world's content language.
 */
import type { World } from '../../lore/types'

export function languageName(tag: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(tag) ?? tag
  } catch {
    return tag
  }
}

export function systemPrompt(world: World): string {
  const lang = languageName(world.contentLanguage)
  const lines: Array<string | false | undefined> = [
    `You are a lore editor helping a game developer build the world "${world.name}".`,
    world.genre && `Genre: ${world.genre}.`,
    world.tone && `Tone: ${world.tone}.`,
    world.summary && `World summary: ${world.summary}`,
    world.calendar.yearLabel && `Years are counted ${world.calendar.yearLabel}${world.calendar.yearAbbr ? ` (abbreviated ${world.calendar.yearAbbr})` : ''}.`,
    '',
    `Always write in ${lang} (language code "${world.contentLanguage}"), whatever language these instructions or the user use.`,
    'Stay consistent with the established lore you are given. Never contradict it; if something is unknown, leave it open rather than inventing a conflicting fact.',
    'Write in Markdown. Refer to other pages with wiki links in double square brackets, e.g. [[Page Title]], using exact titles of pages you were given; only link a new name if the page clearly deserves to exist.',
    'Do not add commentary about yourself or the task.',
  ]
  return lines.filter((x): x is string => typeof x === 'string' && x !== '').join('\n')
}

export function expandPrompt(title: string, context: string): string {
  return `Here is the current lore. The page to expand is "${title}".

${context}

Write new material for the page "${title}" that fits everything above: deepen what is already there, add concrete details a game developer can use (places, motives, history, consequences), and connect it to related pages with [[links]].
Return only the new Markdown to append to the page. Do not repeat existing text. Use headings (##) only if they help. Aim for 150 to 400 words.`
}

export function fillMissingPrompt(title: string, context: string): string {
  return `The page "${title}" is linked from other pages but has not been written yet. Here is everything that mentions it, plus related lore:

${context}

Write a first draft of the page "${title}". Use only what the lore implies, and fill gaps with details that fit and do not contradict anything above.
Start directly with the text (no title heading). Use [[links]] to related pages. Aim for 120 to 300 words.`
}

export function consistencyPrompt(title: string, context: string): string {
  return `Check this lore for contradictions, focusing on "${title}" and the pages around it.

${context}

Look for: dates that do not fit (someone acting before birth or after death, events in the wrong order, eras that disagree), dead characters appearing later, places or factions described in incompatible ways, conflicting facts between a page's text and its stat block, and names used inconsistently.

Answer with JSON only, no prose before or after, in exactly this shape:
{"findings":[{"title":"short summary","explanation":"what conflicts and why","pages":["Exact Page Title","Other Page"],"severity":"high"|"medium"|"low"}]}
Write "title" and "explanation" in the world's content language. Use exact page titles from the lore above in "pages". If you find nothing, return {"findings":[]}.`
}

export interface Finding {
  title: string
  explanation: string
  pages: string[]
  severity: 'high' | 'medium' | 'low'
}

/** Parse the consistency JSON, tolerating code fences and stray text. */
export function parseFindings(text: string): Finding[] | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    const json = JSON.parse(text.slice(start, end + 1)) as { findings?: unknown }
    if (!Array.isArray(json.findings)) return null
    return json.findings
      .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
      .map((f) => ({
        title: String(f.title ?? ''),
        explanation: String(f.explanation ?? ''),
        pages: Array.isArray(f.pages) ? f.pages.map(String) : [],
        severity: f.severity === 'high' || f.severity === 'low' ? f.severity : 'medium',
      }))
  } catch {
    return null
  }
}
