import { describe, expect, it } from 'vitest'
import { BOTTLENECK_LAYOUT, BOTTLENECK_REQUEST } from './bottleneck'

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
})
