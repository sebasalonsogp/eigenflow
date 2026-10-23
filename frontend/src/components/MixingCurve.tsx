import './MixingCurve.css'

interface CurveSeries {
  times: number[]
  values: number[]
}

interface MixingCurveProps extends CurveSeries {
  currentTime: number
  currentValue: number
  // κλ₂: the asymptotic decay rate of the distance from equilibrium.
  decayRate?: number
  comparison?: CurveSeries & { label: string }
}

const WIDTH = 1000
const HEIGHT = 100
const MAXIMUM_DECADES = 3

export function MixingCurve({
  times,
  values,
  currentTime,
  currentValue,
  decayRate,
  comparison,
}: MixingCurveProps) {
  const startTime = times[0] ?? 0
  const endTime = times.at(-1) ?? startTime
  const span = Math.max(endTime - startTime, Number.EPSILON)
  // Fit the log axis to the decades actually reached so slow mixing stays legible.
  const lowest = Math.min(...values, ...(comparison?.values ?? []))
  const decades = Math.min(
    Math.max(Math.ceil(-Math.log10(Math.max(lowest, 10 ** -MAXIMUM_DECADES))), 1),
    MAXIMUM_DECADES,
  )
  const x = (time: number) => ((time - startTime) / span) * WIDTH
  const y = (value: number) => (Math.min(-Math.log10(Math.max(value, 1e-12)), decades) / decades)
    * HEIGHT
  const linePath = (series: CurveSeries) => series.times
    .map((time, index) => `${index === 0 ? 'M' : 'L'}${x(time).toFixed(1)},${y(series.values[index]).toFixed(1)}`)
    .join('')
  const curve = linePath({ times, values })
  const guide = asymptoteGuide(times, values, decayRate, decades)
  const finalValue = values.at(-1) ?? 0
  const playheadX = x(Math.min(Math.max(currentTime, startTime), endTime))

  return (
    <div className="mixing-curve">
      <div className="mixing-curve-labels" aria-hidden="true">
        <span>Distance from equilibrium ‖x − x̄‖ · log, {decades} decade{decades > 1 ? 's' : ''}</span>
        <span>
          {guide && <span className="mixing-curve-key mixing-curve-key--guide">slope −κλ₂</span>}
          {comparison && (
            <span className="mixing-curve-key mixing-curve-key--ghost">{comparison.label}</span>
          )}
        </span>
      </div>
      <div className="mixing-curve-plot">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
          <path className="mixing-curve-area" d={`${curve}L${WIDTH},${HEIGHT}L0,${HEIGHT}Z`} />
          {comparison && (
            <path className="mixing-curve-ghost" d={linePath(comparison)} />
          )}
          {guide && (
            <line
              className="mixing-curve-guide"
              x1={x(guide.startTime)}
              y1={y(guide.startValue)}
              x2={x(guide.endTime)}
              y2={y(guide.endValue)}
            />
          )}
          <path className="mixing-curve-line" d={curve} />
          <line
            className="mixing-curve-cursor"
            x1={playheadX}
            x2={playheadX}
            y1="0"
            y2={HEIGHT}
          />
        </svg>
        <span
          className="mixing-curve-playhead"
          aria-hidden="true"
          style={{
            left: `${(playheadX / WIDTH) * 100}%`,
            top: `${(y(currentValue) / HEIGHT) * 100}%`,
          }}
        />
      </div>
      <p className="visually-hidden">
        Distance from equilibrium falls from 100% to {formatPercent(finalValue)} by
        {' '}t = {endTime.toFixed(1)}; it is {formatPercent(currentValue)} now.
      </p>
    </div>
  )
}

// A straight line on the log axis through the last well-resolved sample, with the
// slope the spectrum predicts. Late-time agreement is the visible proof of λ₂.
function asymptoteGuide(
  times: number[],
  values: number[],
  decayRate: number | undefined,
  decades: number,
) {
  if (!decayRate || decayRate <= 0) return undefined
  const floor = 10 ** -(decades - 0.25)
  const anchorIndex = values.findLastIndex((value) => value > floor)
  if (anchorIndex <= 0) return undefined

  const anchorTime = times[anchorIndex]
  const anchorValue = values[anchorIndex]
  const startTime = Math.max(times[0], anchorTime + Math.log(anchorValue) / decayRate)
  return {
    startTime,
    startValue: anchorValue * Math.exp(decayRate * (anchorTime - startTime)),
    endTime: anchorTime,
    endValue: anchorValue,
  }
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(value < 0.01 ? 2 : 1)}%`
}
