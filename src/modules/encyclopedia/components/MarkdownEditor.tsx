import { autocompletion, closeBrackets, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, placeholder as placeholderExt } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { useEffect, useRef } from 'react'
import styles from './MarkdownEditor.module.css'

export interface TitleOption {
  title: string
  detail?: string
}

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  titles: TitleOption[]
  lang: string
  label: string
  placeholder: string
  onSave?: () => void
}

const highlight = HighlightStyle.define([
  { tag: tags.heading, fontWeight: '800', color: 'var(--ink)' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.link, color: 'var(--ink-2)', textDecoration: 'underline' },
  { tag: tags.url, color: 'var(--ink-3)' },
  { tag: tags.quote, color: 'var(--ink-2)', fontStyle: 'italic' },
  { tag: tags.monospace, fontFamily: 'ui-monospace, Menlo, Consolas, monospace' },
  { tag: [tags.processingInstruction, tags.meta], color: 'var(--ink-3)' },
])

const theme = EditorView.theme({
  '&': { backgroundColor: 'var(--paper)', color: 'var(--ink)', fontSize: 'var(--fs-body)' },
  '.cm-content': {
    fontFamily: 'var(--font-read)',
    lineHeight: '1.7',
    padding: 'var(--s-4) 0',
    caretColor: 'var(--focus)',
  },
  '.cm-line': { padding: '0 var(--s-4)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-cursor': { borderInlineStartColor: 'var(--focus)', borderInlineStartWidth: '2px' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'color-mix(in oklab, var(--focus) 24%, var(--paper)) !important',
  },
  '.cm-placeholder': { color: 'var(--ink-3)', fontStyle: 'italic' },
  '.cm-tooltip': {
    border: '1px solid var(--rule-strong)',
    backgroundColor: 'var(--paper)',
    boxShadow: 'var(--shadow-pop)',
    borderRadius: 'var(--radius)',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--font-ui)', maxHeight: '16rem' },
  '.cm-tooltip-autocomplete > ul > li': { padding: '0.35rem 0.6rem' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--ink)',
    color: 'var(--paper)',
  },
  '.cm-completionDetail': { color: 'inherit', opacity: '0.65', marginInlineStart: '0.75rem', fontStyle: 'normal' },
})

/** `[[` autocomplete with the world's page titles. */
function wikiCompletion(getTitles: () => TitleOption[]) {
  return (ctx: CompletionContext): CompletionResult | null => {
    const before = ctx.matchBefore(/\[\[[^[\]|\n]*$/)
    if (!before) return null
    const from = before.from + 2
    return {
      from,
      options: getTitles().map((t) => ({
        label: t.title,
        detail: t.detail,
        type: 'text',
        // Insert the title, close the link if needed, and put the caret after "]]".
        apply: (view: EditorView, _completion: unknown, applyFrom: number, applyTo: number) => {
          const hasClosing = view.state.sliceDoc(applyTo, applyTo + 2) === ']]'
          const insert = t.title + (hasClosing ? '' : ']]')
          view.dispatch({
            changes: { from: applyFrom, to: applyTo, insert },
            selection: { anchor: applyFrom + t.title.length + 2 },
            userEvent: 'input.complete',
          })
        },
      })),
      validFor: /^[^[\]|\n]*$/,
    }
  }
}

/** CodeMirror 6 Markdown editor, keyboard-first, themed from design tokens. */
export function MarkdownEditor({ value, onChange, titles, lang, label, placeholder, onSave }: MarkdownEditorProps) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const latest = useRef({ onChange, titles, onSave })
  latest.current = { onChange, titles, onSave }

  useEffect(() => {
    if (!host.current) return
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          closeBrackets(),
          markdown(),
          syntaxHighlighting(highlight),
          theme,
          EditorView.lineWrapping,
          placeholderExt(placeholder),
          autocompletion({ override: [wikiCompletion(() => latest.current.titles)], icons: false }),
          keymap.of([
            {
              key: 'Mod-s',
              preventDefault: true,
              run: () => {
                latest.current.onSave?.()
                return true
              },
            },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.contentAttributes.of({ lang, spellcheck: 'true', 'aria-label': label, 'aria-multiline': 'true' }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) latest.current.onChange(u.state.doc.toString())
          }),
        ],
      }),
    })
    view.current = v
    return () => {
      v.destroy()
      view.current = null
    }
    // The editor is created once per language/label; value changes are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, label, placeholder])

  useEffect(() => {
    const v = view.current
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } })
    }
  }, [value])

  return <div ref={host} className={styles.editor} />
}
