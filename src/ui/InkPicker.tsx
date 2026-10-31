import { useId } from 'react'
import styles from './InkPicker.module.css'

interface InkPickerProps<T extends string> {
  legend: string
  inks: readonly T[]
  value: T
  onChange: (ink: T) => void
  /** 'cover' uses world cover inks, 'chapter' uses chapter inks. */
  kind: 'cover' | 'chapter'
  labelFor: (ink: T) => string
}

/** Radio group of ink swatches, labelled for screen readers. */
export function InkPicker<T extends string>({ legend, inks, value, onChange, kind, labelFor }: InkPickerProps<T>) {
  const name = useId()
  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.swatches}>
        {inks.map((ink) => (
          <label key={ink} className={styles.swatch} title={labelFor(ink)}>
            <input
              type="radio"
              name={name}
              value={ink}
              checked={value === ink}
              onChange={() => onChange(ink)}
              className="visually-hidden"
            />
            <span
              className={styles.chip}
              {...(kind === 'cover' ? { 'data-cover': ink } : { 'data-ink': ink })}
              data-kind={kind}
              aria-hidden="true"
            />
            <span className={styles.name}>{labelFor(ink)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
