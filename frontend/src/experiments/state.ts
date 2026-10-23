import type { AnalysisRequest, AnalysisResponse } from '../api'
import { EXPERIMENTS, type ExperimentId } from './index'
import type { BottleneckParameters } from './bottleneck'
import type { PathCompleteParameters } from './pathComplete'
import type { StarParameters } from './star'

export type ActiveExperimentState =
  | { id: 'bottleneck'; parameters: BottleneckParameters }
  | { id: 'path-complete'; parameters: PathCompleteParameters }
  | { id: 'star'; parameters: StarParameters }

export function createDefaultExperimentState(
  id: ExperimentId,
): ActiveExperimentState {
  switch (id) {
    case 'bottleneck':
      return { id, parameters: { ...EXPERIMENTS.bottleneck.defaultParameters } }
    case 'path-complete':
      return { id, parameters: { ...EXPERIMENTS['path-complete'].defaultParameters } }
    case 'star':
      return { id, parameters: { ...EXPERIMENTS.star.defaultParameters } }
  }
}

export function createExperimentRequest(
  state: ActiveExperimentState,
): AnalysisRequest {
  switch (state.id) {
    case 'bottleneck':
      return EXPERIMENTS.bottleneck.createRequest(state.parameters)
    case 'path-complete':
      return EXPERIMENTS['path-complete'].createRequest(state.parameters)
    case 'star':
      return EXPERIMENTS.star.createRequest(state.parameters)
  }
}

// A stale result may be shown during recomputation only when it describes the
// same node set as the active experiment's layout.
export function analysisFitsLayout(
  analysis: Pick<AnalysisResponse, 'nodeOrder'> | undefined,
  positions: Record<string, unknown>,
): analysis is AnalysisResponse {
  return analysis !== undefined
    && analysis.nodeOrder.length === Object.keys(positions).length
    && analysis.nodeOrder.every((nodeId) => nodeId in positions)
}

// A new key restarts playback. Bridge weight is deliberately excluded so a visitor
// can pause at any time and watch heat redistribute while dragging the bridge.
export function createSimulationKey(state: ActiveExperimentState): string {
  switch (state.id) {
    case 'bottleneck':
      return `${state.id}:${state.parameters.heatSource}`
    case 'path-complete':
      return `${state.id}:${state.parameters.heatSource}:${state.parameters.topology}`
    case 'star':
      return `${state.id}:${state.parameters.heatSource}`
  }
}
