import { scaleLinear } from 'd3'
import { useId } from 'react'
import type { AnalysisResponse } from '../api'
import './SpectrumView.css'

interface SpectrumViewProps {
  spectrum: AnalysisResponse['spectrum']
}

const VIEWBOX_WIDTH = 520
const VIEWBOX_HEIGHT = 128
const BASELINE_Y = 100

export function SpectrumView({ spectrum }: SpectrumViewProps) {
  const titleId = `${useId().replaceAll(':', '')}-spectrum-title`
  const descriptionId = `${titleId}-description`
  const maximumEigenvalue = Math.max(...spectrum.eigenvalues, 1)
  const xPosition = scaleLinear()
    .domain([0, Math.max(spectrum.eigenvalues.length - 1, 1)])
    .range([32, VIEWBOX_WIDTH - 32])
  const yPosition = scaleLinear()
    .domain([0, maximumEigenvalue])
    .range([BASELINE_Y, 18])
  const hasMeaningfulLambdaTwo = spectrum.eigenvalues.length > 1
    && spectrum.zeroEigenvalueMultiplicity === 1
    && spectrum.algebraicConnectivity !== null
    && spectrum.algebraicConnectivity > spectrum.tolerance

  return (
    <section className="spectrum-view" aria-labelledby={titleId}>
      <header className="spectrum-header">
        <div>
          <p className="spectrum-kicker">Why it moves this way</p>
          <h2 id={titleId}>Laplacian spectrum</h2>
          <p className="spectrum-context">
            Fixed during playback · changes when the graph changes
          </p>
        </div>
        <p className="spectrum-status">{spectrumStatus(spectrum)}</p>
      </header>

      {spectrum.eigenvalues.length === 0 ? (
        <p className="spectrum-empty" role="status">No spectral values returned.</p>
      ) : (
        <>
          <svg
            className="spectrum-chart"
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            role="img"
            tabIndex={0}
            aria-labelledby={`${titleId} ${descriptionId}`}
          >
            <desc id={descriptionId}>
              Ordered Laplacian spectrum with {spectrum.zeroEigenvalueMultiplicity} zero
              {' '}mode{`${spectrum.zeroEigenvalueMultiplicity === 1 ? '' : 's'}`}.
              {' '}Values: {spectrum.eigenvalues.map(formatEigenvalue).join(', ')}.
            </desc>
            <line className="spectrum-baseline" x1="24" x2="496" y1={BASELINE_Y} y2={BASELINE_Y} />
            <g aria-hidden="true">
              {spectrum.eigenvalues.map((eigenvalue, index) => {
                const emphasis = eigenvalue === 0
                  ? 'zero-mode'
                  : hasMeaningfulLambdaTwo && index === 1
                    ? 'lambda-2'
                    : undefined
                const x = xPosition(index)
                const y = yPosition(eigenvalue)
                return (
                  <g
                    key={`${index}-${eigenvalue}`}
                    className="spectrum-mode"
                    data-spectrum-index={index}
                    data-emphasis={emphasis}
                  >
                    <line x1={x} x2={x} y1={BASELINE_Y} y2={y} />
                    <circle cx={x} cy={y} r={emphasis ? 5 : 4} />
                    <text x={x} y="119">λ{index + 1}</text>
                  </g>
                )
              })}
            </g>
          </svg>

          <ol className="spectrum-values" aria-label="Ordered Laplacian eigenvalues" tabIndex={0}>
            {spectrum.eigenvalues.map((eigenvalue, index) => (
              <li key={`${index}-${eigenvalue}`}>
                <span>λ<sub>{index + 1}</sub></span>
                <strong>{formatEigenvalue(eigenvalue)}</strong>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}

function spectrumStatus(spectrum: AnalysisResponse['spectrum']): string {
  if (spectrum.eigenvalues.length < 2 || spectrum.algebraicConnectivity === null) {
    return 'One-node graph · λ₂ is not defined'
  }
  if (spectrum.zeroEigenvalueMultiplicity > 1) {
    return `${spectrum.zeroEigenvalueMultiplicity} zero modes · graph disconnected`
  }
  return `Algebraic connectivity λ₂ = ${formatEigenvalue(spectrum.algebraicConnectivity)}`
}

function formatEigenvalue(value: number): string {
  return value !== 0 && Math.abs(value) < 0.001
    ? value.toExponential(2)
    : value.toFixed(3)
}
