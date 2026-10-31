import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'onCover'
type Size = 'md' | 'sm'

function cls(variant: Variant, size: Size, extra?: string) {
  return [styles.button, styles[variant], size === 'sm' ? styles.sm : '', extra].filter(Boolean).join(' ')
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  busy?: boolean
}

export function Button({ variant = 'secondary', size = 'md', icon, busy, className, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cls(variant, size, className)}
      aria-busy={busy || undefined}
      disabled={rest.disabled || busy}
    >
      {icon}
      {children && <span>{children}</span>}
    </button>
  )
}

export interface ButtonLinkProps extends LinkProps {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

export function ButtonLink({ variant = 'secondary', size = 'md', icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link {...rest} className={cls(variant, size, className)}>
      {icon}
      {children && <span>{children as ReactNode}</span>}
    </Link>
  )
}
