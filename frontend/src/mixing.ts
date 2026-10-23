// Distance from the uniform equilibrium, ‖x(t) − x̄‖ / ‖x(0) − x̄‖. Total heat is
// conserved, so x̄ is constant and the late-time decay rate is exactly κλ₂.
export function equilibriumDistances(states: number[][]): number[] {
  const distances = states.map((state) => {
    const mean = state.reduce((sum, heat) => sum + heat, 0) / Math.max(state.length, 1)
    return Math.hypot(...state.map((heat) => heat - mean))
  })
  const initial = distances[0] ?? 0
  return distances.map((distance) => initial > 0 ? distance / initial : 0)
}

// First sampled time at which the distance falls to the threshold, if it does.
export function timeToMix(
  times: number[],
  distances: number[],
  threshold = 0.01,
): number | undefined {
  const index = distances.findIndex((distance) => distance <= threshold)
  if (index <= 0) return index === 0 ? times[0] : undefined

  const [earlierTime, laterTime] = [times[index - 1], times[index]]
  const [earlier, later] = [distances[index - 1], distances[index]]
  const progress = (Math.log(earlier) - Math.log(threshold))
    / (Math.log(earlier) - Math.log(later))
  return earlierTime + (laterTime - earlierTime) * progress
}
