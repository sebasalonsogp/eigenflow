import { expect, test } from 'vitest'
import { uniformTimes } from './sampling'

test('samples evenly from zero through the end time without float drift', () => {
  expect(uniformTimes(1, 0.25)).toEqual([0, 0.25, 0.5, 0.75, 1])
  expect(uniformTimes(0.3, 0.1)).toEqual([0, 0.1, 0.2, 0.3])
})

test('keeps every curated experiment within the API sample bound', () => {
  expect(uniformTimes(24, 0.25)).toHaveLength(97)
  expect(uniformTimes(16, 0.125)).toHaveLength(129)
  expect(uniformTimes(8, 0.1)).toHaveLength(81)
})
