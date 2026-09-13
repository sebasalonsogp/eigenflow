import { BOTTLENECK_EXPERIMENT } from './bottleneck'
import { PATH_COMPLETE_EXPERIMENT } from './pathComplete'

export const EXPERIMENTS = {
  bottleneck: BOTTLENECK_EXPERIMENT,
  'path-complete': PATH_COMPLETE_EXPERIMENT,
} as const

export type ExperimentId = keyof typeof EXPERIMENTS

export const DEFAULT_EXPERIMENT_ID = 'bottleneck' satisfies ExperimentId

export function getExperiment<Id extends ExperimentId>(id: Id): (typeof EXPERIMENTS)[Id] {
  return EXPERIMENTS[id]
}
