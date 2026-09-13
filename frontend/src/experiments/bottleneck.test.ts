import { describe, expect, it } from 'vitest'
import {
  BOTTLENECK_LAYOUT,
  BOTTLENECK_REQUEST,
  createBottleneckRequest,
} from './bottleneck'

describe('bottleneck experiment definition', () => {
  it('defines two four-node cliques joined by one weak bridge', () => {
    expect(BOTTLENECK_REQUEST.nodes).toHaveLength(8)
    expect(BOTTLENECK_REQUEST.edges).toHaveLength(13)
    expect(BOTTLENECK_REQUEST.edges.filter((edge) => edge.weight < 1)).toEqual([
      { source: 'left-3', target: 'right-0', weight: 0.1 },
    ])
  })

  it('provides one deterministic display position for every node', () => {
    expect(Object.keys(BOTTLENECK_LAYOUT).sort()).toEqual(
      BOTTLENECK_REQUEST.nodes.map((node) => node.id).sort(),
    )
  })

  it('changes only the bridge edge and selected source', () => {
    const request = createBottleneckRequest({
      bridgeWeight: 0.8,
      heatSource: 'right-2',
    })

    expect(request.heatSource).toBe('right-2')
    expect(request.edges.filter((edge) => edge.weight !== 1)).toEqual([
      { source: 'left-3', target: 'right-0', weight: 0.8 },
    ])
    expect(request.edges.filter((edge) => edge.weight === 1)).toEqual(
      BOTTLENECK_REQUEST.edges.filter((edge) => edge.weight === 1),
    )
  })
})
