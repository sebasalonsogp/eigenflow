import type { GraphEdge } from './api'

export interface EdgeFlux {
  edgeId: string
  from: string
  to: string
  magnitude: number
  // Positive when heat moves from edge.source toward edge.target.
  signed: number
}

// Fick's law on a graph: heat moves along an edge at rate w * (x_i - x_j).
export function computeEdgeFluxes(
  nodeOrder: string[],
  edges: GraphEdge[],
  state: number[],
): EdgeFlux[] {
  const indexById = new Map(nodeOrder.map((nodeId, index) => [nodeId, index]))
  return edges.flatMap((edge) => {
    const sourceHeat = state[indexById.get(edge.source) ?? -1]
    const targetHeat = state[indexById.get(edge.target) ?? -1]
    if (sourceHeat === undefined || targetHeat === undefined) return []

    const flux = edge.weight * (sourceHeat - targetHeat)
    return [{
      edgeId: `${edge.source}-${edge.target}`,
      from: flux >= 0 ? edge.source : edge.target,
      to: flux >= 0 ? edge.target : edge.source,
      magnitude: Math.abs(flux),
      signed: flux,
    }]
  })
}

// Flux spans orders of magnitude, so display strength covers three decades on a
// log scale: the run's peak flux maps to 1 and a thousandth of it maps to 0.
const FLUX_DECADES = 3

export function fluxStrength(magnitude: number, reference: number): number {
  if (reference <= 0 || magnitude <= 0) return 0
  return Math.min(Math.max(1 + Math.log10(magnitude / reference) / FLUX_DECADES, 0), 1)
}

export function maximumEdgeFlux(
  nodeOrder: string[],
  edges: GraphEdge[],
  states: number[][],
): number {
  return states.reduce((maximum, state) => Math.max(
    maximum,
    ...computeEdgeFluxes(nodeOrder, edges, state).map((flux) => flux.magnitude),
  ), 0)
}

export interface TransferSeries {
  signedFlux: number[]
  cumulative: number[]
}

// Heat carried source -> target since t0, per sample. Playback interpolates states
// linearly, so flux is linear between samples and the trapezoid rule is exact.
export function buildTransferSeries(
  nodeOrder: string[],
  edges: GraphEdge[],
  times: number[],
  states: number[][],
): Map<string, TransferSeries> {
  const series = new Map<string, TransferSeries>()
  states.forEach((state, sampleIndex) => {
    for (const flux of computeEdgeFluxes(nodeOrder, edges, state)) {
      const entry = series.get(flux.edgeId) ?? { signedFlux: [], cumulative: [] }
      const previousFlux = entry.signedFlux.at(-1) ?? flux.signed
      const interval = sampleIndex === 0 ? 0 : times[sampleIndex] - times[sampleIndex - 1]
      entry.cumulative.push((entry.cumulative.at(-1) ?? 0)
        + interval * (previousFlux + flux.signed) / 2)
      entry.signedFlux.push(flux.signed)
      series.set(flux.edgeId, entry)
    }
  })
  return series
}

export function transferAtTime(
  series: TransferSeries,
  times: number[],
  time: number,
  currentSignedFlux: number,
): number {
  const upperIndex = times.findIndex((sampleTime) => sampleTime > time)
  const lowerIndex = upperIndex === -1 ? times.length - 1 : Math.max(upperIndex - 1, 0)
  const elapsed = Math.max(time - (times[lowerIndex] ?? 0), 0)
  return (series.cumulative[lowerIndex] ?? 0)
    + elapsed * ((series.signedFlux[lowerIndex] ?? 0) + currentSignedFlux) / 2
}
