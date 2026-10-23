import './LiveReadout.css'

interface LiveReadoutProps {
  algebraicConnectivity: number | null
  zeroModes: number
  mixingTime?: number
  endTime: number
  distance: number
}

export function LiveReadout({
  algebraicConnectivity,
  zeroModes,
  mixingTime,
  endTime,
  distance,
}: LiveReadoutProps) {
  const lambdaTwo = algebraicConnectivity === null
    ? 'undefined'
    : zeroModes > 1 ? '0 · disconnected' : algebraicConnectivity.toFixed(3)
  const remaining = Math.min(Math.max(distance, 0), 1)

  return (
    <section className="live-readout" aria-label="Live readout">
      <dl>
        <div className="live-readout-primary">
          <dt>Algebraic connectivity</dt>
          <dd><output>λ₂ = {lambdaTwo}</output></dd>
        </div>
        <div>
          <dt>Mixed to 1%</dt>
          <dd>
            <output>
              {mixingTime === undefined ? `beyond t = ${endTime.toFixed(0)}` : `t ≈ ${mixingTime.toFixed(1)}`}
            </output>
          </dd>
        </div>
        <div>
          <dt>From equilibrium now</dt>
          <dd>
            <output>{(remaining * 100).toFixed(1)}%</output>
            <span className="live-readout-meter" aria-hidden="true">
              <span style={{ transform: `scaleX(${remaining})` }} />
            </span>
          </dd>
        </div>
      </dl>
    </section>
  )
}
