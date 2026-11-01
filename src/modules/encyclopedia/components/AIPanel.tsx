import { AlertTriangle, Eye, PenLine, RotateCcw, ScanSearch, Sparkles, Square, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { buildContext } from '../../../core/ai/context'
import { AIError } from '../../../core/ai/errors'
import { consistencyPrompt, expandPrompt, fillMissingPrompt, parseFindings, systemPrompt, type Finding } from '../../../core/ai/prompts'
import { describeTarget, runTask } from '../../../core/ai/run'
import { useAISettings } from '../../../core/ai/secrets'
import type { AITask } from '../../../core/ai/types'
import { useResolveKeys } from '../../../core/lore/api'
import { categoryName } from '../../../core/lore/categories'
import { foldKey } from '../../../core/lore/normalize'
import type { Category, World } from '../../../core/lore/types'
import { Button } from '../../../ui/Button'
import styles from './AIPanel.module.css'
import { MarkdownView } from './MarkdownView'
import { WikiRef } from './WikiRef'

export interface AIRequest {
  task: AITask
  /** Title of the page the task is about (existing page or a red link). */
  title: string
  pageId?: string
  /** Default chapter when drafting a missing page. */
  categoryId?: string
  /** The caller already chooses the chapter (e.g. the editor), so the panel doesn't ask. */
  categoryLocked?: boolean
}

interface AIPanelProps {
  request: AIRequest | null
  world: World
  categories: Category[]
  onClose: () => void
  /** Called with the reviewed text. Nothing is saved before this. */
  onAccept?: (text: string, extra: { categoryId?: string }) => Promise<void> | void
  acceptLabel?: string
}

type Status = 'idle' | 'running' | 'done' | 'stopped' | 'error'

/** Streams an AI answer, then lets the user edit, accept or discard it. Never saves on its own. */
export function AIPanel({ request, world, categories, onClose, onAccept, acceptLabel }: AIPanelProps) {
  const { t } = useTranslation()
  const settings = useAISettings()
  const dialog = useRef<HTMLDialogElement>(null)
  const abort = useRef<AbortController | null>(null)
  const partial = useRef('')
  const [status, setStatus] = useState<Status>('idle')
  const [text, setText] = useState('')
  const [error, setError] = useState<AIError | null>(null)
  const [view, setView] = useState<'edit' | 'preview'>('edit')
  const [categoryId, setCategoryId] = useState<string | undefined>(request?.categoryId)
  const [saving, setSaving] = useState(false)
  /** The last text the model produced, to tell whether the user has edited it. */
  const [generated, setGenerated] = useState('')
  const [contextCount, setContextCount] = useState(0)
  const [confirming, setConfirming] = useState<null | 'retry' | 'close'>(null)
  const open = !!request

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const start = useCallback(async () => {
    if (!request || !settings) return
    abort.current?.abort()
    const ctrl = new AbortController()
    abort.current = ctrl
    setText('')
    setGenerated('')
    setError(null)
    setConfirming(null)
    setStatus('running')
    setView('edit')
    try {
      const ctx = await buildContext(world, request.pageId ? { pageId: request.pageId } : { title: request.title }, {
        rings: request.task === 'consistency' ? 2 : 1,
      })
      setContextCount(ctx.titles.length)
      const prompt =
        request.task === 'expand'
          ? expandPrompt(request.title, ctx.text)
          : request.task === 'fillMissing'
            ? fillMissingPrompt(request.title, ctx.text)
            : consistencyPrompt(request.title, ctx.text)
      let acc = ''
      partial.current = ''
      for await (const piece of runTask(settings, request.task, {
        system: systemPrompt(world),
        messages: [{ role: 'user', content: prompt }],
        maxTokens: request.task === 'consistency' ? 2000 : 1500,
        temperature: request.task === 'consistency' ? 0.2 : 0.8,
      }, ctrl.signal)) {
        acc += piece
        partial.current = acc
        setText(acc)
      }
      setText(acc.trim())
      setGenerated(acc.trim())
      setStatus('done')
    } catch (err) {
      if (ctrl.signal.aborted) {
        // Keep what arrived, clearly marked as partial.
        setText(partial.current.trim())
        setGenerated(partial.current.trim())
        setStatus((s) => (s === 'running' ? 'stopped' : s))
        return
      }
      setError(err instanceof AIError ? err : new AIError('unknown', String(err)))
      setStatus('error')
    }
  }, [request, settings, world])

  // Start once per request, as soon as settings have loaded.
  const startedFor = useRef<AIRequest | null>(null)
  useEffect(() => {
    if (request && settings && startedFor.current !== request) {
      startedFor.current = request
      setCategoryId(request.categoryId ?? categories[0]?.id)
      if (settings.profiles.length) void start()
      else setStatus('idle')
    }
    if (!request) {
      startedFor.current = null
      abort.current?.abort()
      setStatus('idle')
      setText('')
    }
  }, [request, settings, start, categories])

  const stop = () => abort.current?.abort()
  const edited = text.trim() !== generated.trim() && (status === 'done' || status === 'stopped')
  const close = (force = false) => {
    if (edited && !force) {
      setConfirming('close')
      return
    }
    abort.current?.abort()
    setConfirming(null)
    onClose()
  }
  const retry = (force = false) => {
    if (edited && !force) {
      setConfirming('retry')
      return
    }
    void start()
  }

  const findings = useMemo(() => (request?.task === 'consistency' && status === 'done' ? parseFindings(text) : null), [request, status, text])
  const target = settings && request ? describeTarget(settings, request.task) : null
  const configured = !!settings?.profiles.length

  return (
    <dialog ref={dialog} className={styles.panel} onCancel={(e) => { e.preventDefault(); close() }} aria-labelledby="ai-panel-title" data-task={request?.task}>
      {request && (
        <div className={styles.inner}>
          <header className={styles.head}>
            {request.task === 'consistency' ? <ScanSearch aria-hidden="true" className={styles.headIcon} /> : <Sparkles aria-hidden="true" className={styles.headIcon} />}
            <div className={styles.headText}>
              <h2 id="ai-panel-title" className={styles.title}>{t(`ai:task.${request.task}.name`)}</h2>
              <p className={styles.subject} lang={world.contentLanguage}>{request.title}</p>
            </div>
            <button type="button" className={styles.close} onClick={() => close()} aria-label={t('common:action.close')}>
              <X aria-hidden="true" />
            </button>
          </header>

          {!configured ? (
            <div className={styles.body}>
              <p className={styles.message}>{t('ai:panel.notConfigured')}</p>
              <p className={styles.note}>{t('ai:panel.optional')}</p>
              <Link to="/settings#ai" className={styles.settingsLink} onClick={() => close(true)}>{t('ai:panel.openSettings')}</Link>
            </div>
          ) : (
            <>
              <p className={styles.meta}>
                {target && t('ai:panel.using', { target })}
                {' · '}
                {t('ai:panel.languageNote', { language: new Intl.DisplayNames([world.contentLanguage], { type: 'language' }).of(world.contentLanguage) })}
              </p>

              <div className={styles.body} aria-busy={status === 'running'}>
                {status === 'error' && error && (
                  <div className={styles.errorBox} role="alert">
                    <AlertTriangle aria-hidden="true" />
                    <div>
                      <p className={styles.errorTitle}>{t(`errors:ai.${error.code}`)}</p>
                      <p className={styles.errorHint}>{t(`ai:hint.${error.code}`, { defaultValue: '' })}</p>
                      {error.detail && <p className={styles.errorDetail}>{error.detail}</p>}
                      <Link to="/settings#ai" onClick={() => close(true)}>{t('ai:panel.openSettings')}</Link>
                    </div>
                  </div>
                )}

                {request.task === 'consistency' && status === 'running' ? (
                  <div className={styles.checking}>
                    <p className={styles.checkingTitle}>{t('ai:panel.checking', { count: contextCount })}</p>
                    <p className={styles.note}>{t('ai:panel.checkingWhat')}</p>
                    <p className={styles.note}>{t('ai:panel.foundSoFar', { count: (text.match(/"explanation"/g) ?? []).length })}</p>
                  </div>
                ) : request.task === 'consistency' && status === 'stopped' ? (
                  <p className={styles.message}>{t('ai:panel.checkStopped')}</p>
                ) : request.task === 'consistency' && status === 'done' ? (
                  findings ? (
                    <Findings findings={findings} world={world} />
                  ) : (
                    <>
                      <p className={styles.note}>{t('ai:panel.unparsed')}</p>
                      <MarkdownView markdown={text} worldId={world.id} lang={world.contentLanguage} />
                    </>
                  )
                ) : status === 'running' ? (
                  <div className={styles.stream} lang={world.contentLanguage} aria-live="off">
                    {text || <span className={styles.waiting}>{t('ai:panel.thinking')}</span>}
                    <span className={styles.caret} aria-hidden="true" />
                  </div>
                ) : status === 'done' || status === 'stopped' ? (
                  <>
                    {status === 'stopped' && <p className={styles.stoppedMark}>{t('ai:panel.stoppedPartial')}</p>}
                    <div className={styles.viewSwitch} role="group" aria-label={t('encyclopedia:editor.viewMode')}>
                      <button type="button" aria-pressed={view === 'edit'} onClick={() => setView('edit')}><PenLine aria-hidden="true" />{t('ai:panel.edit')}</button>
                      <button type="button" aria-pressed={view === 'preview'} onClick={() => setView('preview')}><Eye aria-hidden="true" />{t('encyclopedia:editor.preview')}</button>
                    </div>
                    {view === 'edit' ? (
                      <textarea className={styles.textarea} value={text} onChange={(e) => setText(e.target.value)} lang={world.contentLanguage}
                        aria-label={t('ai:panel.reviewLabel')} rows={16} />
                    ) : (
                      <div className={styles.preview}><MarkdownView markdown={text} worldId={world.id} lang={world.contentLanguage} /></div>
                    )}
                    <p className={styles.note}>{t('ai:panel.reviewNote')}</p>
                  </>
                ) : null}
                <p className="visually-hidden" role="status">
                  {status === 'done' ? t('ai:panel.finished') : status === 'stopped' ? t('ai:panel.stoppedPartial') : status === 'running' ? t('ai:panel.thinking') : ''}
                </p>
              </div>

              {confirming && (
                <div className={styles.confirm} role="alertdialog" aria-labelledby="ai-confirm">
                  <p id="ai-confirm">{t('ai:panel.discardEdits')}</p>
                  <div className={styles.actions}>
                    <Button size="sm" onClick={() => setConfirming(null)} autoFocus>{t('ai:panel.keepEditing')}</Button>
                    <Button size="sm" variant="danger" onClick={() => (confirming === 'close' ? close(true) : retry(true))}>{t('ai:panel.discardConfirm')}</Button>
                  </div>
                </div>
              )}
              <footer className={styles.foot}>
                {request.task === 'fillMissing' && (status === 'done' || status === 'stopped') && onAccept && !request.categoryLocked && (
                  <label className={styles.category}>
                    <span>{t('encyclopedia:page.category')}</span>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                      {categories.map((c) => <option key={c.id} value={c.id}>{categoryName(c, t)}</option>)}
                    </select>
                  </label>
                )}
                <div className={styles.actions}>
                  {status === 'running' && <Button icon={<Square aria-hidden="true" />} onClick={stop}>{t('ai:panel.stop')}</Button>}
                  {(status === 'done' || status === 'stopped' || status === 'error') && <Button icon={<RotateCcw aria-hidden="true" />} onClick={() => retry()}>{t('ai:panel.regenerate')}</Button>}
                  <Button onClick={() => close()}>{request.task === 'consistency' ? t('common:action.close') : t('ai:panel.discard')}</Button>
                  {request.task !== 'consistency' && onAccept && (
                    <Button variant="primary" disabled={(status !== 'done' && status !== 'stopped') || !text.trim()} busy={saving}
                      onClick={async () => {
                        setSaving(true)
                        try {
                          await onAccept(text.trim(), { categoryId })
                          onClose()
                        } finally {
                          setSaving(false)
                        }
                      }}>
                      {acceptLabel ?? t('ai:panel.accept')}
                    </Button>
                  )}
                </div>
              </footer>
            </>
          )}
        </div>
      )}
    </dialog>
  )
}

function Findings({ findings, world }: { findings: Finding[]; world: World }) {
  const { t } = useTranslation()
  const keys = useMemo(() => findings.flatMap((f) => f.pages.map(foldKey)), [findings])
  const resolved = useResolveKeys(world.id, keys)
  if (findings.length === 0) return <p className={styles.clean}>{t('ai:panel.noFindings')}</p>
  return (
    <ol className={styles.findings} lang={world.contentLanguage}>
      {findings.map((f, i) => (
        <li key={i} className={styles.finding} data-severity={f.severity}>
          <p className={styles.findingHead}>
            <span className={styles.severity} lang={undefined}>{t(`ai:severity.${f.severity}`)}</span>
            <strong>{f.title}</strong>
          </p>
          <p className={styles.findingText}>{f.explanation}</p>
          {f.pages.length > 0 && (
            <p className={styles.findingPages}>
              {f.pages.map((title, j) => (
                <span key={title}>
                  {j > 0 && ', '}
                  <WikiRef title={title} worldId={world.id} target={resolved?.get(foldKey(title))} />
                </span>
              ))}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}
