import type { ChoiceControl } from '../experiments/types'
import './ChoiceControls.css'

interface ChoiceControlsProps<Value extends string> {
  value: Value
  fixedLabel: string
  fixedValue: string
  control: ChoiceControl<Value, string>
  onChange: (value: Value) => void
  onReset: () => void
}

export function ChoiceControls<Value extends string>({
  value,
  fixedLabel,
  fixedValue,
  control,
  onChange,
  onReset,
}: ChoiceControlsProps<Value>) {
  return (
    <section className="choice-controls" aria-label="Experiment controls">
      <p className="choice-context" aria-label={`${fixedLabel} ${fixedValue}`}>
        <span>{fixedLabel}</span>
        <strong>{fixedValue}</strong>
      </p>
      <div className="choice-control">
        <span>{control.label}</span>
        <div role="group" aria-label={control.label}>
          {control.options.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={option.value === value}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <button
        className="choice-reset"
        type="button"
        disabled={value === control.defaultValue}
        onClick={onReset}
      >
        Reset experiment
      </button>
    </section>
  )
}
