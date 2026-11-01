import { CheckCircle2, KeyRound, Pencil, Plus, Trash2, XCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AIError } from '../../core/ai/errors'
import { getProvider, PROVIDERS } from '../../core/ai/registry'
import { deleteProfile, saveProfile, setActiveProfile, setProxyUrl, setTaskAssignment, useAISettings, type AISettings as Settings } from '../../core/ai/secrets'
import { AI_TASKS, type ProviderProfile, type ProviderType } from '../../core/ai/types'
import { Button } from '../../ui/Button'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { SelectField, TextField } from '../../ui/Field'
import layout from '../../ui/layout.module.css'
import styles from './AISettings.module.css'

/** Providers, keys, models and per-task model choice. Everything here stays in this browser. */
export function AISettings() {
  const { t } = useTranslation()
  const settings = useAISettings()
  const [editing, setEditing] = useState<ProviderProfile | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<ProviderProfile | null>(null)
  if (!settings) return null

  return (
    <section id="ai" className={styles.section} aria-labelledby="ai-title">
      <h2 id="ai-title" className={styles.title}>{t('ai:settings.title')}</h2>
      <p className={styles.help}>{t('ai:settings.lede')}</p>
      <p className={styles.privacy}>
        <KeyRound aria-hidden="true" />
        {t('ai:settings.privacy')}
      </p>

      {settings.profiles.length > 0 && (
        <ul role="list" className={styles.profiles}>
          {settings.profiles.map((p) => (
            <li key={p.id} className={styles.profile}>
              <label className={styles.defaultRadio}>
                <input type="radio" name="active-profile" checked={settings.activeProfileId === p.id} onChange={() => void setActiveProfile(p.id)} />
                <span className="visually-hidden">{t('ai:settings.useByDefault', { label: p.label })}</span>
              </label>
              <div className={styles.profileMain}>
                <span className={styles.profileLabel}>{p.label}</span>
                <span className={styles.profileMeta}>
                  {t(`ai:provider.${p.type}.name`)} · {p.model || t('ai:settings.noModel')}
                  {p.useProxy && ` · ${t('ai:settings.viaProxy')}`}
                  {settings.activeProfileId === p.id && <strong className={styles.badge}>{t('ai:settings.default')}</strong>}
                </span>
              </div>
              <Button size="sm" variant="quiet" icon={<Pencil aria-hidden="true" />} onClick={() => setEditing(p)}>{t('common:action.edit')}</Button>
              <Button size="sm" variant="quiet" icon={<Trash2 aria-hidden="true" />} onClick={() => setToDelete(p)} aria-label={t('ai:settings.delete', { label: p.label })} />
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <ProfileForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} proxyUrl={settings.proxyUrl} onDone={() => setEditing(null)} />
      ) : (
        <Button icon={<Plus aria-hidden="true" />} variant={settings.profiles.length ? 'secondary' : 'primary'} onClick={() => setEditing('new')}>
          {t('ai:settings.add')}
        </Button>
      )}

      {settings.profiles.length > 0 && <TaskModels settings={settings} />}
      <ProxySettings url={settings.proxyUrl} />

      <ConfirmDialog
        open={!!toDelete}
        danger
        title={t('ai:settings.deleteConfirm', { label: toDelete?.label ?? '' })}
        confirmLabel={t('common:action.delete')}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await deleteProfile(toDelete.id)
          setToDelete(null)
        }}
      >
        {t('ai:settings.deleteBody')}
      </ConfirmDialog>
    </section>
  )
}

type TestState = { state: 'idle' } | { state: 'running' } | { state: 'ok' } | { state: 'error'; code: string; detail?: string }

function ProfileForm({ initial, proxyUrl, onDone }: { initial?: ProviderProfile; proxyUrl: string; onDone: () => void }) {
  const { t } = useTranslation()
  const [type, setType] = useState<ProviderType>(initial?.type ?? 'anthropic')
  const provider = getProvider(type)
  const [label, setLabel] = useState(initial?.label ?? '')
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? '')
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? '')
  const [showKey, setShowKey] = useState(false)
  const [model, setModel] = useState(initial?.model ?? '')
  const [useProxy, setUseProxy] = useState(initial?.useProxy ?? false)
  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [test, setTest] = useState<TestState>({ state: 'idle' })
  const [error, setError] = useState<string>()

  const cfg = () => ({ baseUrl: baseUrl.trim() || provider.defaultBaseUrl, apiKey: apiKey.trim() || undefined, proxy: useProxy ? proxyUrl : undefined })
  const toState = (err: unknown): TestState =>
    err instanceof AIError ? { state: 'error', code: err.code, detail: err.detail } : { state: 'error', code: 'unknown', detail: String(err) }

  async function loadModels() {
    setLoadingModels(true)
    setTest({ state: 'idle' })
    try {
      const list = await provider.listModels(cfg())
      setModels(list)
      if (!model && list[0]) setModel(list[0])
    } catch (err) {
      setTest(toState(err))
    } finally {
      setLoadingModels(false)
    }
  }

  async function runTest() {
    setTest({ state: 'running' })
    try {
      await provider.testConnection(cfg(), model.trim() || undefined)
      setTest({ state: 'ok' })
    } catch (err) {
      setTest(toState(err))
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!provider.defaultBaseUrl && !baseUrl.trim()) return setError(t('ai:settings.baseUrlRequired'))
    if (!model.trim()) return setError(t('ai:settings.modelRequired'))
    await saveProfile({
      id: initial?.id,
      type,
      label: label.trim() || t(`ai:provider.${type}.name`),
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim() || undefined,
      model: model.trim(),
      useProxy,
    })
    onDone()
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h3 className={styles.formTitle}>{initial ? t('ai:settings.editTitle') : t('ai:settings.addTitle')}</h3>
      <SelectField label={t('ai:settings.provider')} value={type} onChange={(e) => { setType(e.target.value as ProviderType); setModels([]); setTest({ state: 'idle' }) }}>
        {PROVIDERS.map((p) => (
          <option key={p.id} value={p.id}>{t(`ai:provider.${p.id}.name`)}</option>
        ))}
      </SelectField>
      <p className={styles.providerHelp}>{t(`ai:provider.${type}.help`)}</p>
      {type === 'ollama' && <pre className={styles.code}>{t('ai:provider.ollama.command')}</pre>}

      <div className={layout.row}>
        <TextField label={t('ai:settings.label')} value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t(`ai:provider.${type}.name`)} maxLength={60} />
        <TextField label={t('ai:settings.baseUrl')} value={baseUrl} onChange={(e) => { setBaseUrl(e.target.value); setError(undefined) }}
          placeholder={provider.defaultBaseUrl || t('ai:settings.baseUrlExample')} hint={provider.defaultBaseUrl ? t('ai:settings.baseUrlHint') : undefined}
          inputMode="url" autoComplete="off" spellCheck={false} />
      </div>

      {(provider.needsKey || type === 'openai-compatible') && (
        <div className={styles.keyRow}>
          <TextField label={t('ai:settings.apiKey')} type={showKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off" spellCheck={false} hint={t('ai:settings.apiKeyHint')} />
          <Button size="sm" variant="quiet" onClick={() => setShowKey((s) => !s)}>{showKey ? t('ai:settings.hideKey') : t('ai:settings.showKey')}</Button>
        </div>
      )}

      <div className={styles.modelRow}>
        <TextField label={t('ai:settings.model')} value={model} onChange={(e) => { setModel(e.target.value); setError(undefined) }}
          list="ai-models" autoComplete="off" spellCheck={false} placeholder={t('ai:settings.modelPlaceholder')} hint={t('ai:settings.modelHint')} />
        <datalist id="ai-models">{models.map((m) => <option key={m} value={m} />)}</datalist>
        <Button onClick={() => void loadModels()} busy={loadingModels}>{t('ai:settings.loadModels')}</Button>
      </div>
      {models.length > 0 && <p className={styles.note}>{t('ai:settings.modelsLoaded', { count: models.length })}</p>}

      <label className={styles.check}>
        <input type="checkbox" checked={useProxy} onChange={(e) => setUseProxy(e.target.checked)} />
        <span>
          {t('ai:settings.useProxy')}
          <span className={styles.checkHint}>{t('ai:settings.useProxyHint', { url: proxyUrl })}</span>
        </span>
      </label>

      <div className={styles.testRow}>
        <Button onClick={() => void runTest()} busy={test.state === 'running'}>{t('ai:settings.test')}</Button>
        <p className={styles.testResult} role="status" data-state={test.state}>
          {test.state === 'ok' && (<><CheckCircle2 aria-hidden="true" />{t('ai:settings.testOk')}</>)}
          {test.state === 'error' && (<><XCircle aria-hidden="true" /><span>{t(`errors:ai.${test.code}`)}<span className={styles.detail}> {t(`ai:hint.${test.code}`, { defaultValue: '' })}</span>{test.detail && <span className={styles.rawDetail}>{test.detail}</span>}</span></>)}
        </p>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={layout.formActions}>
        <Button type="submit" variant="primary">{t('common:action.save')}</Button>
        <Button onClick={onDone}>{t('common:action.cancel')}</Button>
      </div>
    </form>
  )
}

function TaskModels({ settings }: { settings: Settings }) {
  const { t } = useTranslation()
  return (
    <fieldset className={styles.tasks}>
      <legend className={styles.subTitle}>{t('ai:settings.tasksTitle')}</legend>
      <p className={styles.help}>{t('ai:settings.tasksHelp')}</p>
      {AI_TASKS.map((task) => {
        const a = settings.tasks[task] ?? {}
        return (
          <div key={task} className={styles.taskRow}>
            <span className={styles.taskName}>{t(`ai:task.${task}.name`)}</span>
            <label className={styles.inline}>
              <span className="visually-hidden">{t('ai:settings.taskProfile', { task: t(`ai:task.${task}.name`) })}</span>
              <select value={a.profileId ?? ''} onChange={(e) => void setTaskAssignment(task, { ...a, profileId: e.target.value || undefined })}>
                <option value="">{t('ai:settings.useDefaultProfile')}</option>
                {settings.profiles.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </label>
            <label className={styles.inline}>
              <span className="visually-hidden">{t('ai:settings.taskModel', { task: t(`ai:task.${task}.name`) })}</span>
              <input defaultValue={a.model ?? ''} placeholder={t('ai:settings.taskModelPlaceholder')} spellCheck={false}
                onBlur={(e) => void setTaskAssignment(task, { ...a, model: e.target.value.trim() || undefined })} />
            </label>
          </div>
        )
      })}
    </fieldset>
  )
}

function ProxySettings({ url }: { url: string }) {
  const { t } = useTranslation()
  return (
    <details className={styles.proxy}>
      <summary>{t('ai:settings.proxyTitle')}</summary>
      <p className={styles.help}>{t('ai:settings.proxyHelp')}</p>
      <pre className={styles.code}>{t('ai:settings.proxyCommand')}</pre>
      <TextField label={t('ai:settings.proxyUrl')} defaultValue={url} onBlur={(e) => void setProxyUrl(e.target.value)} spellCheck={false} inputMode="url" />
    </details>
  )
}
