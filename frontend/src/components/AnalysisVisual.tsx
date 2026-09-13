import { useState } from 'react'
import type { ExperimentId } from '../experiments'
import type { AnalysisState } from '../useAnalysis'
import type { NetworkMode } from './ModeToggle'
import { SimulationView } from './SimulationView'

interface AnalysisVisualProps {
  state: AnalysisState
  experimentId: ExperimentId
  simulationKey: string
  positions: Record<string, { x: number; y: number }>
}

export function AnalysisVisual({
  state,
  experimentId,
  simulationKey,
  positions,
}: AnalysisVisualProps) {
  const [networkMode, setNetworkMode] = useState<NetworkMode>('heat')

  if (state.status === 'success') {
    return (
      <SimulationView
        key={simulationKey}
        analysis={state.data}
        experimentId={experimentId}
        positions={positions}
        mode={networkMode}
        onModeChange={setNetworkMode}
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
