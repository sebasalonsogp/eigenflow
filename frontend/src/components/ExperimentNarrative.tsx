import type { AnalysisResponse } from '../api'
import { EXPERIMENTS } from '../experiments'
import type { ActiveExperimentState } from '../experiments/state'
import { ComparisonInsightPanel } from './ComparisonInsightPanel'
import { InsightPanel } from './InsightPanel'
import { StarInsightPanel } from './StarInsightPanel'

interface ExperimentNarrativeProps {
  analysis: AnalysisResponse
  state: ActiveExperimentState
}

export function ExperimentNarrative({
  analysis,
  state,
}: ExperimentNarrativeProps) {
  switch (state.id) {
    case 'bottleneck':
      return (
        <InsightPanel
          analysis={analysis}
          bridgeWeight={state.parameters.bridgeWeight}
        />
      )
    case 'path-complete':
      return (
        <ComparisonInsightPanel
          analysis={analysis}
          topology={state.parameters.topology}
          takeaway={EXPERIMENTS['path-complete'].takeaway}
        />
      )
    case 'star':
      return (
        <StarInsightPanel
          analysis={analysis}
          heatSource={state.parameters.heatSource}
          takeaway={EXPERIMENTS.star.takeaway}
        />
      )
  }
}
