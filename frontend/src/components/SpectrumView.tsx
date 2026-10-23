import { scaleLinear } from 'd3'
import { useId, useMemo } from 'react'
import type { AnalysisResponse } from '../api'
import { projectOntoModes } from '../modeWeights'
import './SpectrumView.css'

interface SpectrumViewProps {
  spectrum: AnalysisResponse['spectrum']
  initialState?: number[]
  state?: number[]
}

const VIEWBOX_WIDTH = 520
const BASELINE_Y = 100
const WEIGHT_BASELINE_Y = 170
const WEIGHT_BAR_HEIGHT = 34

export function SpectrumView({ spectrum, initialState, state }: SpectrumViewProps) {
  const titleId = `${useId().replaceAll(':', '')}-spectrum-title`
  const descriptionId = `${titleId}-description`
  const initialWeights = useMemo(
    () => initialState ? projectOntoModes(spectrum.eigenvectors, initialState) : undefined,
    [initialState, spectrum.eigenvectors],
  )
  const weightReference = Math.max(...(initialWeights ?? []).map(Math.abs), 0)
  const currentWeights = state && weightReference > 0
    ? projectOntoModes(spectrum.eigenvectors, state)
    : undefined
  const viewBoxHeight = currentWeights ? 180 : 128
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
  const barWidth = Math.min(
    14,
    0.6 * (xPosition(1) - xPosition(0)),
  )
  const modeEmphasis = (index: number) => spectrum.eigenvalues[index] === 0
    ? 'zero-mode'
    : hasMeaningfulLambdaTwo && index === 1
      ? 'lambda-2'
      : undefined

  return (
    <section className="spectrum-view" aria-labelledby={titleId}>
      <header className="spectrum-header">
        <div>
          <p className="spectrum-kicker">Why it moves this way</p>
          <h2 id={titleId}>Laplacian spectrum</h2>
          <p className="spectrum-context">
            Eigenvalues fixed during playback · changes when the graph changes
          </p>
          {currentWeights && (
            <p className="spectrum-context">
              Bars show each mode’s live weight, decaying as e<sup>−λt</sup>
            </p>
          )}
        </div>
        <p className="spectrum-status">{spectrumStatus(spectrum)}</p>
      </header>

      {spectrum.eigenvalues.length === 0 ? (
        <p className="spectrum-empty" role="status">No spectral values returned.</p>
      ) : (
        <>
          <svg
            className="spectrum-chart"
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${viewBoxHeight}`}
            role="img"
            tabIndex={0}
            aria-labelledby={`${titleId} ${descriptionId}`}
          >
            <desc id={descriptionId}>
              Ordered Laplacian spectrum with {spectrum.zeroEigenvalueMultiplicity} zero
              {' '}mode{`${spectrum.zeroEigenvalueMultiplicity === 1 ? '' : 's'}`}.
              {' '}Values: {spectrum.eigenvalues.map(formatEigenvalue).join(', ')}.
              {currentWeights && ' Bars beneath the values show how much of the current heat state each mode still carries.'}
            </desc>
            <line className="spectrum-baseline" x1="24" x2="496" y1={BASELINE_Y} y2={BASELINE_Y} />
            {currentWeights && (
              <g className="spectrum-weights" aria-hidden="true">
                <text className="spectrum-weights-label" x="24" y="133">Mode weight now</text>
                <line
                  className="spectrum-baseline"
                  x1="24"
                  x2="496"
                  y1={WEIGHT_BASELINE_Y}
                  y2={WEIGHT_BASELINE_Y}
                />
                {currentWeights.map((weight, index) => {
                  const height = WEIGHT_BAR_HEIGHT * Math.min(Math.abs(weight) / weightReference, 1)
                  return (
                    <rect
                      key={index}
                      data-weight-index={index}
                      data-emphasis={modeEmphasis(index)}
                      x={xPosition(index) - barWidth / 2}
                      y={WEIGHT_BASELINE_Y - height}
                      width={barWidth}
                      height={height}
                    />
                  )
                })}
              </g>
            )}
            <g aria-hidden="true">
              {spectrum.eigenvalues.map((eigenvalue, index) => {
                const emphasis = modeEmphasis(index)
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
