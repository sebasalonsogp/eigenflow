import { useMemo, useState } from 'react'
import {
  DEFAULT_EXPERIMENT_ID,
  EXPERIMENTS,
  getExperiment,
  type ExperimentId,
} from '../experiments'
import {
  createDefaultExperimentState,
  createExperimentRequest,
  createSimulationKey,
  type ActiveExperimentState,
} from '../experiments/state'
import { useAnalysis } from '../useAnalysis'
import { ActiveExperimentControls } from './ActiveExperimentControls'
import { AnalysisVisual } from './AnalysisVisual'
import { ExperimentNarrative } from './ExperimentNarrative'
import { ExperimentPicker } from './ExperimentPicker'

const EXPERIMENT_OPTIONS = (Object.keys(EXPERIMENTS) as ExperimentId[]).map((id) => ({
  id,
  sequence: EXPERIMENTS[id].sequence,
  label: EXPERIMENTS[id].label,
  question: EXPERIMENTS[id].question,
}))

export function ExperimentExperience() {
  const [experimentState, setExperimentState] = useState<ActiveExperimentState>(
    () => createDefaultExperimentState(DEFAULT_EXPERIMENT_ID),
  )
  const activeExperiment = getExperiment(experimentState.id)
  const request = useMemo(
    () => createExperimentRequest(experimentState),
    [experimentState],
  )
  const analysis = useAnalysis(request, 120)

  return (
    <>
      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Spectral graph diffusion</p>
          <h1 id="hero-title">Structure shapes how signals move.</h1>
          <p className="hero-summary">
            An interactive study of heat flow, bottlenecks, and the Laplacian
            eigenmodes that make a network’s hidden geometry visible.
          </p>
          <div className="formula" aria-label="x of t equals e to the negative L t times x of zero">
            x(t) = e<sup>−Lt</sup>x(0)
          </div>
        </div>

        <div className="experiment-panel">
          <ExperimentPicker
            experiments={EXPERIMENT_OPTIONS}
            activeId={experimentState.id}
            onSelect={(id) => setExperimentState(createDefaultExperimentState(id))}
          />
          <div className="experiment-label">
            <span>
              Experiment {activeExperiment.sequence} · {activeExperiment.label}
            </span>
            <span>Live simulation</span>
          </div>
          <ActiveExperimentControls
            state={experimentState}
            request={request}
            onChange={setExperimentState}
          />
          <AnalysisVisual
            key={experimentState.id}
            state={analysis}
            simulationKey={createSimulationKey(experimentState)}
            positions={activeExperiment.positions}
          />
        </div>
      </section>

      {analysis.status === 'success' ? (
        <ExperimentNarrative analysis={analysis.data} state={experimentState} />
      ) : (
        <ProjectIntent />
      )}
    </>
  )
}

function ProjectIntent() {
  return (
    <section className="project-intent" aria-labelledby="intent-title">
      <p className="section-index">01 / Working model</p>
      <div>
        <h2 id="intent-title">Python computes. D3 makes it visible.</h2>
        <p>
          The numerical engine validates the graph, constructs its Laplacian,
          decomposes the spectrum, and solves heat flow. The network above is the
          first view driven by that single aligned result—not a decorative sketch.
        </p>
      </div>
    </section>
  )
}
