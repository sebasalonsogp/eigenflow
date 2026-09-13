export interface DiffusionFrame {
  time: number
  state: number[]
}

export function interpolateDiffusionFrame(
  times: number[],
  states: number[][],
  requestedTime: number,
): DiffusionFrame {
  if (times.length === 0 || states.length === 0) {
    return { time: 0, state: [] }
  }

  const lastIndex = Math.min(times.length, states.length) - 1
  const startTime = times[0]
  const endTime = times[lastIndex]
  const time = Math.min(Math.max(requestedTime, startTime), endTime)

  if (time <= startTime) return { time: startTime, state: [...states[0]] }
  if (time >= endTime) return { time: endTime, state: [...states[lastIndex]] }

  const upperIndex = times.findIndex((sampleTime, index) => (
    index <= lastIndex && sampleTime >= time
  ))
  const lowerIndex = Math.max(upperIndex - 1, 0)
  const interval = times[upperIndex] - times[lowerIndex]
  if (interval <= 0) return { time, state: [...states[upperIndex]] }

  const progress = (time - times[lowerIndex]) / interval
  const state = states[lowerIndex].map((value, nodeIndex) => (
    value + (states[upperIndex][nodeIndex] - value) * progress
  ))
  return { time, state }
}
