import type { AnalysisResponse } from '../api'
import { buildBottleneckInsight } from '../insights'
import './InsightPanel.css'

interface InsightPanelProps {
  analysis: AnalysisResponse
  bridgeWeight: number
}

export function InsightPanel({ analysis, bridgeWeight }: InsightPanelProps) {
  const insight = buildBottleneckInsight({
    bridgeWeight,
    spectrum: analysis.spectrum,
    diagnostics: analysis.diagnostics,
  })

  return (
    <section className="project-intent insight-panel" aria-labelledby="insight-title">
      <p className="section-index">02 / Computed reading</p>
      <div className="insight-panel-content">
        <p className="insight-kicker">Current analysis · bridge {bridgeWeight.toFixed(2)}</p>
        <h2 id="insight-title">{insight.headline}</h2>
        <dl className="insight-grid">
          <div>
            <dt>Observation</dt>
            <dd>{insight.observation}</dd>
          </div>
          <div>
            <dt>Mathematical interpretation</dt>
            <dd>{insight.interpretation}</dd>
          </div>
          <div>
            <dt>Numerical check</dt>
            <dd>{insight.verification}</dd>
          </div>
        </dl>
        <p className="insight-limitation">
          <strong>Scope</strong>
          {insight.limitation}
        </p>
        <p className="insight-provenance">Python computes. D3 makes it visible.</p>
      </div>
    </section>
  )
}
