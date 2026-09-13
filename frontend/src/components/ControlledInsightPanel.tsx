interface ControlledInsight {
  headline: string
  observation: string
  interpretation: string
  verification: string
  limitation: string
}

interface ControlledInsightPanelProps {
  sectionIndex: string
  kicker: string
  titleId: string
  insight: ControlledInsight
  takeaway: string
}

export function ControlledInsightPanel({
  sectionIndex,
  kicker,
  titleId,
  insight,
  takeaway,
}: ControlledInsightPanelProps) {
  return (
    <section className="project-intent insight-panel" aria-labelledby={titleId}>
      <p className="section-index">{sectionIndex}</p>
      <div className="insight-panel-content">
        <p className="insight-kicker">{kicker}</p>
        <h2 id={titleId}>{insight.headline}</h2>
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
