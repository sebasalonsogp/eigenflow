import { describe, expect, it } from 'vitest'
import { deriveFiedlerPartition } from './fiedler'
import { ANALYSIS_FIXTURE } from './test/analysisFixture'

describe('deriveFiedlerPartition', () => {
  it('reads the second eigenvector column in canonical node order', () => {
    const partition = deriveFiedlerPartition(ANALYSIS_FIXTURE)

    expect(partition).toEqual({
      status: 'available',
      entries: [
        { nodeId: 'a', value: Math.SQRT1_2, group: 'positive' },
        { nodeId: 'b', value: -Math.SQRT1_2, group: 'negative' },
      ],
    })
  })

  it('rejects a single partition claim for a disconnected graph', () => {
    const partition = deriveFiedlerPartition({
      ...ANALYSIS_FIXTURE,
      spectrum: {
        ...ANALYSIS_FIXTURE.spectrum,
        eigenvalues: [0, 0],
        zeroEigenvalueMultiplicity: 2,
        algebraicConnectivity: 0,
      },
    })

    expect(partition).toMatchObject({ status: 'unavailable' })
    if (partition.status === 'unavailable') {
      expect(partition.message).toMatch(/graph is disconnected/i)
    }
  })

  it('rejects an arbitrary basis vector from a repeated lambda two eigenspace', () => {
    const partition = deriveFiedlerPartition({
      ...ANALYSIS_FIXTURE,
      spectrum: {
        ...ANALYSIS_FIXTURE.spectrum,
        eigenvalues: [0, 2],
        degenerateEigenspaces: [
          { eigenvalue: 2, indices: [1, 2], multiplicity: 2 },
        ],
      },
    })

    expect(partition).toMatchObject({ status: 'unavailable' })
    if (partition.status === 'unavailable') {
      expect(partition.message).toMatch(/not a unique partition/i)
    }
  })

  it('marks tolerance-level values as boundary nodes', () => {
    const partition = deriveFiedlerPartition({
      ...ANALYSIS_FIXTURE,
      spectrum: {
        ...ANALYSIS_FIXTURE.spectrum,
        eigenvectors: [
          [Math.SQRT1_2, 1e-12],
          [Math.SQRT1_2, -Math.SQRT1_2],
        ],
      },
    })

    expect(partition).toMatchObject({
      status: 'available',
      entries: [
        { nodeId: 'a', group: 'boundary' },
        { nodeId: 'b', group: 'negative' },
      ],
    })
  })
})
