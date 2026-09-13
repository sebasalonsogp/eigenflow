import { expect, test } from 'vitest'
import { expandHeatForColor } from './heatEncoding'

test('expands low heat values while preserving the fixed endpoints', () => {
  expect(expandHeatForColor(0, 1)).toBe(0)
  expect(expandHeatForColor(0.25, 1)).toBe(0.5)
  expect(expandHeatForColor(1, 1)).toBe(1)
})

test('clamps numerical noise and overshoot before color encoding', () => {
  expect(expandHeatForColor(-0.001, 1)).toBe(0)
  expect(expandHeatForColor(1.001, 1)).toBe(1)
})
