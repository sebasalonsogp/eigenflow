// Projects a heat state onto the returned eigenbasis: weight k is v_k · x.
// Under diffusion each weight decays independently as exp(-λ_k t).
export function projectOntoModes(eigenvectors: number[][], state: number[]): number[] {
  const modeCount = eigenvectors[0]?.length ?? 0
  return Array.from({ length: modeCount }, (_, modeIndex) => (
    state.reduce(
      (sum, heat, nodeIndex) => sum + heat * (eigenvectors[nodeIndex]?.[modeIndex] ?? 0),
      0,
    )
  ))
}
