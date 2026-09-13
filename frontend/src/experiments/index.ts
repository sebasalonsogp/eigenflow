import { BOTTLENECK_EXPERIMENT } from './bottleneck'

export const EXPERIMENTS = {
  bottleneck: BOTTLENECK_EXPERIMENT,
} as const

export type ExperimentId = keyof typeof EXPERIMENTS

export const DEFAULT_EXPERIMENT_ID: ExperimentId = 'bottleneck'

export function getExperiment(id: ExperimentId) {
  return EXPERIMENTS[id]
}
