// Playback interpolates linearly between samples, so dense uniform sampling keeps
// the exponential decay smooth without approaching the API's 240-sample bound.
export function uniformTimes(endTime: number, step: number): number[] {
  const count = Math.round(endTime / step) + 1
  return Array.from({ length: count }, (_, index) => Number((index * step).toFixed(6)))
}
