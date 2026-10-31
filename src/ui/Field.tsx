import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import styles from './Field.module.css'

interface FieldShellProps {
  label: string
  hint?: ReactNode
  error?: string
  children: (id: string, describedBy: string | undefined) => ReactNode
}

export function FieldShell({ label, hint, error, children }: FieldShellProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className={styles.field} data-invalid={error ? '' : undefined}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children(id, describedBy)}
      {hint && (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

type Common = { label: string; hint?: ReactNode; error?: string }

export function TextField({ label, hint, error, className, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={[styles.input, className].filter(Boolean).join(' ')}
          {...rest}
        />
      )}
    </FieldShell>
  )
}

export function TextAreaField({ label, hint, error, className, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={[styles.input, styles.textarea, className].filter(Boolean).join(' ')}
          {...rest}
        />
      )}
    </FieldShell>
  )
}

export function SelectField({ label, hint, error, className, children, ...rest }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={[styles.input, styles.select, className].filter(Boolean).join(' ')}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldShell>
  )
}
