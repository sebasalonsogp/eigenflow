import type { AnalysisResponse } from './api'

export type BottleneckRegime = 'weak' | 'balanced' | 'strong'

export interface BottleneckInsight {
  regime: BottleneckRegime
  headline: string
  observation: string
  interpretation: string
  verification: string
  limitation: string
}

interface BottleneckInsightInput {
  bridgeWeight: number
  spectrum: AnalysisResponse['spectrum']
  diagnostics: AnalysisResponse['diagnostics']
}

export function buildBottleneckInsight({
  bridgeWeight,
  spectrum,
  diagnostics,
}: BottleneckInsightInput): BottleneckInsight {
  const regime = classifyBridge(bridgeWeight)
  const bridgeLabel = bridgeWeight.toFixed(2)
  const base = regimeCopy[regime]
  const algebraicConnectivity = spectrum.algebraicConnectivity

  let interpretation: string
  if (spectrum.zeroEigenvalueMultiplicity > 1) {
    interpretation = `${spectrum.zeroEigenvalueMultiplicity} zero eigenvalues identify disconnected components, so heat cannot mix globally.`
  } else if (algebraicConnectivity === null) {
    interpretation = 'This graph has no λ₂, so algebraic connectivity is not defined.'
  } else {
    interpretation = `The backend reports λ₂ = ${algebraicConnectivity.toFixed(3)}. In this graph family, a larger λ₂ damps the slowest non-constant diffusion mode faster, so global mixing accelerates as the bridge strengthens.`
  }

  const residual = formatDiagnostic(diagnostics.maxEigenpairResidual)
  const conservation = formatDiagnostic(diagnostics.maxHeatConservationError)

  return {
    regime,
    headline: base.headline,
    observation: base.observation(bridgeLabel),
    interpretation,
    verification: `Maximum eigenpair residual ${residual}; maximum heat-conservation error ${conservation}. These diagnose floating-point consistency, not model fit.`,
    limitation: 'λ₂ describes the slowest asymptotic mode; early-time heat patterns also depend on the selected source and higher modes.',
  }
}

function classifyBridge(bridgeWeight: number): BottleneckRegime {
  if (bridgeWeight < 0.5) return 'weak'
  if (bridgeWeight <= 1) return 'balanced'
  return 'strong'
}

const regimeCopy: Record<
  BottleneckRegime,
  { headline: string; observation: (bridgeLabel: string) => string }
> = {
  weak: {
    headline: 'One weak edge sets the pace.',
    observation: (bridgeLabel) =>
      `At bridge weight ${bridgeLabel}, the connection is far below the unit-weight edges inside each cluster, creating a pronounced structural bottleneck.`,
  },
  balanced: {
    headline: 'The spectral gap is opening.',
    observation: (bridgeLabel) =>
      `At bridge weight ${bridgeLabel}, the connection approaches the unit-weight internal edge scale, so the bottleneck is less dominant.`,
  },
  strong: {
    headline: 'The bridge is no longer the weakest edge.',
    observation: (bridgeLabel) =>
      `At bridge weight ${bridgeLabel}, the connection is stronger than each unit-weight internal edge. It is still a single cut edge, but it is less restrictive.`,
  },
}

function formatDiagnostic(value: number): string {
  if (value === 0) return '0'
  return value.toExponential(1)
}
