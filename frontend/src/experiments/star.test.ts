import { describe, expect, it } from 'vitest'
import { createStarRequest, STAR_EXPERIMENT } from './star'

describe('star experiment', () => {
  it('limits the comparison to one hub and one representative leaf', () => {
    expect(STAR_EXPERIMENT).toMatchObject({
      id: 'star',
      sequence: '03',
      label: 'Hub vs leaf',
      defaultHeatSource: 'hub',
      control: {
        kind: 'source-position',
        label: 'Source position',
        defaultValue: 'hub',
        options: [
          { value: 'hub', label: 'Hub' },
          { value: 'leaf-0', label: 'Leaf' },
        ],
      },
    })
  })

  it('changes only the heat source between hub and leaf requests', () => {
    const hubRequest = createStarRequest({ heatSource: 'hub' })
    const leafRequest = createStarRequest({ heatSource: 'leaf-0' })

    expect(hubRequest.nodes).toHaveLength(6)
    expect(hubRequest.edges).toHaveLength(5)
    expect(hubRequest.edges.every(
      (edge) => edge.source === 'hub' || edge.target === 'hub',
    )).toBe(true)
    expect(leafRequest).toEqual({ ...hubRequest, heatSource: 'leaf-0' })
    expect(Object.keys(STAR_EXPERIMENT.positions).sort()).toEqual(
      hubRequest.nodes.map((node) => node.id).sort(),
    )
  })

  it('frames the source-position comparison as a controlled experiment', () => {
    expect(STAR_EXPERIMENT.question).toMatch(/structural position/i)
    expect(STAR_EXPERIMENT.takeaway).toMatch(/same graph and heat amount/i)
  })
})
