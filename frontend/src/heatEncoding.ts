export function expandHeatForColor(value: number, maximumHeat: number): number {
  if (maximumHeat <= 0) return 0

  const normalizedHeat = Math.min(Math.max(value / maximumHeat, 0), 1)
  return Math.sqrt(normalizedHeat)
}
