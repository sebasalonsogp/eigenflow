import { expect, test } from 'vitest'
import { computeEdgeFluxes, fluxStrength, maximumEdgeFlux } from './edgeFlux'

const nodeOrder = ['a', 'b', 'c']
const edges = [
  { source: 'a', target: 'b', weight: 2 },
  { source: 'b', target: 'c', weight: 0.5 },
]

test('orients each edge flux from the warmer node to the cooler node', () => {
  expect(computeEdgeFluxes(nodeOrder, edges, [0.2, 0.6, 0.2])).toEqual([
    { edgeId: 'a-b', from: 'b', to: 'a', magnitude: expect.closeTo(0.8) },
    { edgeId: 'b-c', from: 'b', to: 'c', magnitude: expect.closeTo(0.2) },
  ])
})

test('reports zero flux across an edge at local equilibrium', () => {
  const [flux] = computeEdgeFluxes(nodeOrder, edges, [0.5, 0.5, 0])
  expect(flux.magnitude).toBe(0)
})

test('skips edges whose endpoints are missing from the state', () => {
  expect(computeEdgeFluxes(nodeOrder, edges, [1])).toEqual([])
})

test('maps three decades of flux below the peak onto display strength', () => {
  expect(fluxStrength(2, 2)).toBe(1)
  expect(fluxStrength(0.2, 2)).toBeCloseTo(2 / 3)
  expect(fluxStrength(0.02, 2)).toBeCloseTo(1 / 3)
  expect(fluxStrength(0.0001, 2)).toBe(0)
  expect(fluxStrength(4, 2)).toBe(1)
  expect(fluxStrength(1, 0)).toBe(0)
})

test('finds the largest flux across every sampled state', () => {
  expect(maximumEdgeFlux(nodeOrder, edges, [
    [1, 0, 0],
    [0.4, 0.4, 0.2],
  ])).toBeCloseTo(2)
  expect(maximumEdgeFlux(nodeOrder, edges, [])).toBe(0)
})
