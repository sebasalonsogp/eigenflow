import { useMemo, useState } from 'react'
import type { AnalysisResponse } from '../api'
import {
  DEFAULT_EXPERIMENT_ID,
  EXPERIMENTS,
  getExperiment,
  type ExperimentId,
} from '../experiments'
import {
  analysisFitsLayout,
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

  // The narrative mixes parameters with computed values, so while a new result
  // loads it keeps the last pair that actually belong together.
  const [settled, setSettled] = useState<{
    analysis: AnalysisResponse
    state: ActiveExperimentState
  }>()
  if (analysis.status === 'success' && settled?.analysis !== analysis.data) {
    setSettled({ analysis: analysis.data, state: experimentState })
  }
  const narrative = analysis.status === 'success'
    ? { analysis: analysis.data, state: experimentState }
    : analysis.status === 'loading'
      && settled?.state.id === experimentState.id
      && analysisFitsLayout(settled.analysis, activeExperiment.positions)
      ? settled
      : undefined

  return (
    <>
      <section className="intro" id="top" aria-labelledby="hero-title">
        <div>
          <p className="eyebrow">Spectral graph diffusion lab</p>
          <h1 id="hero-title">
            Structure shapes how <span className="hero-accent">signals move.</span>
          </h1>
          <p className="intro-summary">
            Inject heat, reshape the network, and watch the Laplacian eigenmodes
            explain what moves—and what stalls.
          </p>
        </div>
        <p className="formula" aria-label="x of t equals e to the negative kappa L t times x of zero">
          <var>x</var>(<var>t</var>) = <var>e</var>
          <sup>−<var>κ</var><var>L</var><var>t</var></sup>
          <var>x</var>(0)
        </p>
      </section>

      <section
        className="lab"
        id="experiment-workspace"
        aria-label="Interactive experiment"
        tabIndex={-1}
      >
        <ExperimentPicker
          experiments={EXPERIMENT_OPTIONS}
          activeId={experimentState.id}
          onSelect={(id) => {
            if (id !== experimentState.id) {
              setExperimentState(createDefaultExperimentState(id))
            }
          }}
        />
        <div className="lab-grid">
          <ActiveExperimentControls
            state={experimentState}
            request={request}
            onChange={setExperimentState}
          />
          <AnalysisVisual
            key={experimentState.id}
            state={analysis}
            experimentId={experimentState.id}
            title={`Experiment ${activeExperiment.sequence} · ${activeExperiment.label}`}
            simulationKey={createSimulationKey(experimentState)}
            positions={activeExperiment.positions}
            onSelectSource={experimentState.id === 'bottleneck'
              ? (heatSource) => setExperimentState({
                ...experimentState,
                parameters: { ...experimentState.parameters, heatSource },
              })
              : undefined}
          />
        </div>
      </section>

      {narrative ? (
        <ExperimentNarrative analysis={narrative.analysis} state={narrative.state} />
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
