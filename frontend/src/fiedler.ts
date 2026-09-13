import type { AnalysisResponse } from './api'

export type PartitionGroup = 'negative' | 'boundary' | 'positive'

export interface FiedlerEntry {
  nodeId: string
  value: number
  group: PartitionGroup
}

export type FiedlerPartition =
  | { status: 'available'; entries: FiedlerEntry[] }
  | { status: 'unavailable'; message: string }

type SpectralGraph = Pick<AnalysisResponse, 'nodeOrder' | 'spectrum'>

export function deriveFiedlerPartition(analysis: SpectralGraph): FiedlerPartition {
  const { nodeOrder, spectrum } = analysis
  if (nodeOrder.length < 2 || spectrum.algebraicConnectivity === null) {
    return {
      status: 'unavailable',
      message: 'A one-node graph has no second eigenvector to partition.',
    }
  }
  if (spectrum.zeroEigenvalueMultiplicity !== 1) {
    return {
      status: 'unavailable',
      message: 'The graph is disconnected, so one Fiedler partition would be misleading.',
    }
  }
  const repeatedFiedlerSpace = spectrum.degenerateEigenspaces.some(
    (eigenspace) => eigenspace.multiplicity > 1 && eigenspace.indices.includes(1),
  )
  if (repeatedFiedlerSpace) {
    return {
      status: 'unavailable',
      message: 'λ₂ belongs to a repeated eigenspace, so this basis vector is not a unique partition.',
    }
  }

  const values = nodeOrder.map((_, nodeIndex) => spectrum.eigenvectors[nodeIndex]?.[1])
  if (values.some((value) => value === undefined)) {
    return {
      status: 'unavailable',
      message: 'The returned spectrum does not contain a complete second eigenvector.',
    }
  }

  const fiedlerValues = values.filter((value): value is number => value !== undefined)
  const firstPartitionValue = fiedlerValues.find(
    (value) => Math.abs(value) > spectrum.tolerance,
  )
  const orientation = firstPartitionValue !== undefined && firstPartitionValue < 0 ? -1 : 1
  const entries = nodeOrder.map((nodeId, nodeIndex) => {
    const value = fiedlerValues[nodeIndex] * orientation
    return { nodeId, value, group: partitionGroup(value, spectrum.tolerance) }
  })

  return { status: 'available', entries }
}

function partitionGroup(value: number, tolerance: number): PartitionGroup {
  if (Math.abs(value) <= tolerance) return 'boundary'
  return value < 0 ? 'negative' : 'positive'
}
