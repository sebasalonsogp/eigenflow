import type { ComparisonTopology } from '../experiments/pathComplete'
import type { ChoiceControl } from '../experiments/types'
import './PathCompleteControls.css'

interface PathCompleteControlsProps {
  topology: ComparisonTopology
  heatSource: string
  control: ChoiceControl<ComparisonTopology>
  onTopologyChange: (topology: ComparisonTopology) => void
  onReset: () => void
}

export function PathCompleteControls({
  topology,
  heatSource,
  control,
  onTopologyChange,
  onReset,
}: PathCompleteControlsProps) {
  return (
    <section className="path-complete-controls" aria-label="Experiment controls">
      <p className="fixed-source" aria-label={`Fixed source ${heatSource}`}>
        <span>Fixed source</span>
        <strong>{heatSource}</strong>
      </p>
      <div className="topology-control">
        <span>{control.label}</span>
        <div role="group" aria-label={control.label}>
          {control.options.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={option.value === topology}
              onClick={() => onTopologyChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <button
        className="path-complete-reset"
        type="button"
        disabled={topology === control.defaultValue}
        onClick={onReset}
      >
        Reset experiment
      </button>
    </section>
  )
}
