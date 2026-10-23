import type { GraphEdge } from './api'

export interface EdgeFlux {
  edgeId: string
  from: string
  to: string
  magnitude: number
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
