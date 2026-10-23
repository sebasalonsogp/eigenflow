import { expect, test } from 'vitest'
import { projectOntoModes } from './modeWeights'

const eigenvectors = [
  [Math.SQRT1_2, Math.SQRT1_2],
  [Math.SQRT1_2, -Math.SQRT1_2],
]

test('projects a heat state onto each eigenvector column', () => {
  const [constant, contrast] = projectOntoModes(eigenvectors, [1, 0])
  expect(constant).toBeCloseTo(Math.SQRT1_2)
  expect(contrast).toBeCloseTo(Math.SQRT1_2)
})

test('leaves only the constant mode at equilibrium', () => {
  const [constant, contrast] = projectOntoModes(eigenvectors, [0.5, 0.5])
  expect(constant).toBeCloseTo(Math.SQRT1_2)
  expect(contrast).toBeCloseTo(0)
})

test('returns no weights for an empty basis', () => {
  expect(projectOntoModes([], [])).toEqual([])
})
