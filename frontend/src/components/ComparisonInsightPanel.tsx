import type { AnalysisResponse } from '../api'
import type { ComparisonTopology } from '../experiments/pathComplete'
import { buildTopologyComparisonInsight } from '../insights'
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
    <section
      className="project-intent insight-panel"
      aria-labelledby="comparison-insight-title"
    >
      <p className="section-index">03 / Controlled comparison</p>
      <div className="insight-panel-content">
        <p className="insight-kicker">Current topology · {topology}</p>
        <h2 id="comparison-insight-title">{insight.headline}</h2>
        <dl className="insight-grid">
          <div>
            <dt>Current observation</dt>
            <dd>{insight.observation}</dd>
          </div>
          <div>
            <dt>Spectral interpretation</dt>
            <dd>{insight.interpretation}</dd>
          </div>
          <div>
            <dt>Controlled takeaway</dt>
            <dd>{takeaway}</dd>
          </div>
        </dl>
        <p className="insight-limitation">
          <strong>Scope</strong>
          {insight.limitation}
        </p>
        <p className="insight-provenance">{insight.verification}</p>
      </div>
    </section>
  )
}
