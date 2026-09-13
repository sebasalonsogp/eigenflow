import type { AnalysisResponse } from './api'
import type { ComparisonTopology } from './experiments/pathComplete'
import type { StarHeatSource } from './experiments/star'

export type BottleneckRegime = 'weak' | 'balanced' | 'strong'

export interface BottleneckInsight {
  regime: BottleneckRegime
  headline: string
  observation: string
  interpretation: string
  verification: string
  limitation: string
}

export interface TopologyComparisonInsight {
  headline: string
  observation: string
  interpretation: string
  verification: string
  limitation: string
}

export type StarInsight = TopologyComparisonInsight

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
    verification: numericalVerification(residual, conservation),
    limitation: 'λ₂ describes the slowest asymptotic mode; early-time heat patterns also depend on the selected source and higher modes.',
  }
}

export function buildTopologyComparisonInsight({
  topology,
  spectrum,
  diagnostics,
}: {
  topology: ComparisonTopology
  spectrum: AnalysisResponse['spectrum']
  diagnostics: AnalysisResponse['diagnostics']
}): TopologyComparisonInsight {
  const lambdaTwo = spectrum.algebraicConnectivity === null
    ? 'not defined'
    : spectrum.algebraicConnectivity.toFixed(3)
  const residual = formatDiagnostic(diagnostics.maxEigenpairResidual)
  const conservation = formatDiagnostic(diagnostics.maxHeatConservationError)

  if (topology === 'path') {
    return {
      headline: 'Local links make distance matter.',
      observation: `The six-node path has five unit-weight edges and λ₂ = ${lambdaTwo}. Heat must travel through adjacent nodes to reach the opposite endpoint.`,
      interpretation: 'The small spectral gap leaves a slowly decaying global mode, which produces slow long-distance mixing.',
      verification: numericalVerification(residual, conservation),
      limitation: 'The comparison holds the same six nodes and source, with the same edge weights and time samples; topology is the controlled difference.',
    }
  }

  return {
    headline: 'Every node talks to every other.',
    observation: `The six-node complete graph has fifteen unit-weight edges and λ₂ = ${lambdaTwo}. Every node is one step from the source.`,
    interpretation: 'The much larger spectral gap rapidly damps every non-constant mode, producing rapid global mixing.',
    verification: numericalVerification(residual, conservation),
    limitation: 'The comparison holds the same six nodes and source, with the same edge weights and time samples; topology is the controlled difference.',
  }
}

export function buildStarInsight({
  heatSource,
  spectrum,
  diagnostics,
}: {
  heatSource: StarHeatSource
  spectrum: AnalysisResponse['spectrum']
  diagnostics: AnalysisResponse['diagnostics']
}): StarInsight {
  const lambdaTwo = spectrum.algebraicConnectivity === null
    ? 'not defined'
    : spectrum.algebraicConnectivity.toFixed(3)
  const verification = numericalVerification(
    formatDiagnostic(diagnostics.maxEigenpairResidual),
    formatDiagnostic(diagnostics.maxHeatConservationError),
  )
  const limitation = 'One edge and two edges describe graph distance, not a discrete waiting period; continuous heat diffusion is positive throughout a connected graph for every t > 0.'

  if (heatSource === 'hub') {
    return {
      headline: 'The hub spreads heat symmetrically.',
      observation: 'With heat placed at the hub, all five leaves are one edge away and receive equal heat throughout the simulation.',
      interpretation: `The fixed graph reports λ₂ = ${lambdaTwo}. Changing the initial condition alters the coefficients on its eigenmodes, not their decay rates.`,
      verification,
      limitation,
    }
  }

  return {
    headline: 'A leaf creates a directional transient.',
    observation: 'With heat placed at leaf-0, the hub is one edge away while every other leaf is two edges away through the hub.',
    interpretation: `Selecting a different source does not change the spectrum or λ₂ = ${lambdaTwo}; it changes how the initial condition projects onto the fixed eigenmodes.`,
    verification,
    limitation,
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

function numericalVerification(residual: string, conservation: string): string {
  return `Maximum eigenpair residual ${residual}; maximum heat-conservation error ${conservation}. These diagnose floating-point consistency, not model fit.`
}
