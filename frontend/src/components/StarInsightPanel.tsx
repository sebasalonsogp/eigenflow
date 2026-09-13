import type { AnalysisResponse } from '../api'
import type { StarHeatSource } from '../experiments/star'
import { buildStarInsight } from '../insights'
import { ControlledInsightPanel } from './ControlledInsightPanel'
import './InsightPanel.css'

interface StarInsightPanelProps {
  analysis: AnalysisResponse
  heatSource: StarHeatSource
  takeaway: string
}

export function StarInsightPanel({
  analysis,
  heatSource,
  takeaway,
}: StarInsightPanelProps) {
  const insight = buildStarInsight({
    heatSource,
    spectrum: analysis.spectrum,
    diagnostics: analysis.diagnostics,
  })
  const sourceLabel = heatSource === 'hub' ? 'hub' : 'leaf'

  return (
    <ControlledInsightPanel
      sectionIndex="04 / Initial condition"
      kicker={`Current source · ${sourceLabel}`}
      titleId="star-insight-title"
      insight={insight}
      takeaway={takeaway}
    />
  )
}
