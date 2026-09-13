import { describe, expect, it } from 'vitest'
import { interpolateDiffusionFrame } from './diffusionFrame'

const times = [0, 2, 5]
const states = [
  [1, 0],
  [0.6, 0.4],
  [0.5, 0.5],
]

describe('interpolateDiffusionFrame', () => {
  it('clamps to the first and last computed states', () => {
    expect(interpolateDiffusionFrame(times, states, -1)).toEqual({
      time: 0,
      state: [1, 0],
    })
    expect(interpolateDiffusionFrame(times, states, 9)).toEqual({
      time: 5,
      state: [0.5, 0.5],
    })
  })

  it('linearly interpolates every node from the same enclosing samples', () => {
    expect(interpolateDiffusionFrame(times, states, 1)).toEqual({
      time: 1,
      state: [0.8, 0.2],
    })
    expect(interpolateDiffusionFrame(times, states, 3.5)).toEqual({
      time: 3.5,
      state: [0.55, 0.45],
    })
  })

  it('returns an empty frame when no samples are available', () => {
    expect(interpolateDiffusionFrame([], [], 2)).toEqual({ time: 0, state: [] })
  })
})
