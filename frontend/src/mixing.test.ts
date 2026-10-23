import { expect, test } from 'vitest'
import { equilibriumDistances, timeToMix } from './mixing'

test('normalizes distance from the uniform equilibrium to one at the start', () => {
  expect(equilibriumDistances([[1, 0], [0.75, 0.25], [0.5, 0.5]])).toEqual([1, 0.5, 0])
})

test('reports zero distance for a state that starts at equilibrium', () => {
  expect(equilibriumDistances([[0.5, 0.5], [0.5, 0.5]])).toEqual([0, 0])
})

test('interpolates the mixing time on a log scale between samples', () => {
  expect(timeToMix([0, 1, 2], [1, 0.1, 0.001])).toBeCloseTo(1.5)
  expect(timeToMix([0, 1], [1, 0.5])).toBeUndefined()
  expect(timeToMix([0, 1], [0, 0])).toBe(0)
})
