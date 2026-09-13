import type { AnalysisResponse } from '../api'
import type { ComparisonTopology } from '../experiments/pathComplete'
import { buildTopologyComparisonInsight } from '../insights'
import { ControlledInsightPanel } from './ControlledInsightPanel'
import './InsightPanel.css'

interface ComparisonInsightPanelProps {
  analysis: AnalysisResponse
  topology: ComparisonTopology
  takeaway: string
}

export function ComparisonInsightPanel({
  analysis,
  topology,
  takeaway,
}: ComparisonInsightPanelProps) {
  const insight = buildTopologyComparisonInsight({
    topology,
    spectrum: analysis.spectrum,
    diagnostics: analysis.diagnostics,
  })

  return (
    <ControlledInsightPanel
      sectionIndex="03 / Controlled comparison"
      kicker={`Current topology · ${topology}`}
      titleId="comparison-insight-title"
      insight={insight}
      takeaway={takeaway}
    />
  )
}
