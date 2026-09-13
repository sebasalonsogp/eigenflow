import type { AnalysisRequest } from '../api'
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

export function createSimulationKey(state: ActiveExperimentState): string {
  switch (state.id) {
    case 'bottleneck':
      return `${state.id}:${state.parameters.heatSource}:${state.parameters.bridgeWeight}`
    case 'path-complete':
      return `${state.id}:${state.parameters.heatSource}:${state.parameters.topology}`
    case 'star':
      return `${state.id}:${state.parameters.heatSource}`
  }
}
