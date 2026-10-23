import { useState } from 'react'
import type { AnalysisResponse } from '../api'
import type { ExperimentId } from '../experiments'
import { analysisFitsLayout } from '../experiments/state'
import type { AnalysisState } from '../useAnalysis'
import type { NetworkMode } from './ModeToggle'
import { SimulationView } from './SimulationView'

interface AnalysisVisualProps {
  state: AnalysisState
  experimentId: ExperimentId
  title: string
  simulationKey: string
  positions: Record<string, { x: number; y: number }>
  onSelectSource?: (nodeId: string) => void
}

interface AnalysisHistory {
  current?: AnalysisResponse
  previous?: AnalysisResponse
}

export function AnalysisVisual({
  state,
  experimentId,
  title,
  simulationKey,
  positions,
  onSelectSource,
}: AnalysisVisualProps) {
  const [networkMode, setNetworkMode] = useState<NetworkMode>('heat')
  const [history, setHistory] = useState<AnalysisHistory>({})
  const stale = state.status === 'loading' ? state.previous : undefined
  const drawable = state.status === 'success'
    ? state.data
    : analysisFitsLayout(stale, positions) ? stale : undefined

  // Remember the configuration being replaced so the mixing curve can compare them.
  if (state.status === 'success' && state.data !== history.current) {
    setHistory({ current: state.data, previous: history.current })
  }

  if (drawable) {
    return (
      <SimulationView
        key={simulationKey}
        analysis={drawable}
        comparison={history.previous}
        experimentId={experimentId}
        title={title}
        positions={positions}
        mode={networkMode}
        updating={state.status === 'loading'}
        onModeChange={setNetworkMode}
        onSelectSource={onSelectSource}
      />
    )
  }

  if (state.status === 'loading') {
    return (
      <div className="analysis-state" role="status" aria-busy="true">
        <span className="analysis-state-mark" aria-hidden="true">λ</span>
        <strong>Solving the Laplacian system</strong>
        <span>Validating graph · decomposing spectrum · sampling heat</span>
      </div>
    )
  }

  if (state.status === 'validation-error') {
    return (
      <div className="analysis-state analysis-state--error" role="alert">
        <span className="analysis-state-mark" aria-hidden="true">!</span>
        <strong>Analysis request rejected</strong>
        <span>{state.message}</span>
      </div>
    )
  }

  return (
    <div className="analysis-state analysis-state--error" role="alert">
      <span className="analysis-state-mark" aria-hidden="true">!</span>
      <strong>Analysis unavailable</strong>
      <span>Start the Python API and reload to compute the experiment.</span>
    </div>
  )
}
