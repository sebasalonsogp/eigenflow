import type { ExperimentId } from '../experiments'
import './ExperimentPicker.css'

interface ExperimentOption {
  id: ExperimentId
  sequence: string
  label: string
  question: string
}

interface ExperimentPickerProps {
  experiments: readonly ExperimentOption[]
  activeId: ExperimentId
  onSelect: (id: ExperimentId) => void
}

export function ExperimentPicker({
  experiments,
  activeId,
  onSelect,
}: ExperimentPickerProps) {
  const activeExperiment = experiments.find((experiment) => experiment.id === activeId)
  if (!activeExperiment) {
    throw new Error(`Experiment ${activeId} is not registered`)
  }

  return (
    <nav className="experiment-picker" aria-label="Choose experiment">
      <div className="experiment-picker-tabs" role="group" aria-label="Experiments">
        {experiments.map((experiment) => (
          <button
            key={experiment.id}
            type="button"
            aria-label={`${experiment.sequence} ${experiment.label}`}
            aria-pressed={experiment.id === activeId}
            onClick={() => onSelect(experiment.id)}
          >
            <span>{experiment.sequence}</span>
            {experiment.label}
          </button>
        ))}
      </div>
      <p className="experiment-question">
        <span>Question</span>
        {activeExperiment.question}
      </p>
    </nav>
  )
}
