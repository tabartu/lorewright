import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import styles from './Menu.module.css'

interface MenuProps {
  label: string
  trigger: ReactNode
  triggerClassName?: string
  children: (close: () => void) => ReactNode
}

/** Small disclosure panel anchored to its trigger. Closes on Escape and outside click. */
export function Menu({ label, trigger, triggerClassName, children }: MenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div className={styles.root} ref={ref}>
      <button
        type="button"
        className={triggerClassName}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </button>
      {open && (
        <div className={styles.panel} id={id}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.options}>{children}</div>
    </section>
  )
}

export function MenuOption({
  selected,
  onSelect,
  children,
  lang,
}: {
  selected?: boolean
  onSelect: () => void
  children: ReactNode
  lang?: string
}) {
  return (
    <button type="button" className={styles.option} aria-pressed={selected} onClick={onSelect} lang={lang}>
      {children}
    </button>
  )
}
