import { describe, expect, it } from 'vitest'
import {
  PATH_COMPLETE_EXPERIMENT,
  createPathCompleteRequest,
} from './pathComplete'

describe('path-versus-complete experiment', () => {
  it('builds a six-node path with heat starting at the shared source', () => {
    const request = createPathCompleteRequest({
      topology: 'path',
      heatSource: 'node-0',
    })

    expect(request.nodes).toHaveLength(6)
    expect(request.edges).toHaveLength(5)
    expect(request.edges).toEqual([
      { source: 'node-0', target: 'node-1', weight: 1 },
      { source: 'node-1', target: 'node-2', weight: 1 },
      { source: 'node-2', target: 'node-3', weight: 1 },
      { source: 'node-3', target: 'node-4', weight: 1 },
      { source: 'node-4', target: 'node-5', weight: 1 },
    ])
    expect(request.heatSource).toBe('node-0')
  })

  it('changes only topology when switched to the complete graph', () => {
    const path = createPathCompleteRequest({ topology: 'path', heatSource: 'node-0' })
    const complete = createPathCompleteRequest({
      topology: 'complete',
      heatSource: 'node-0',
    })

    expect(complete.edges).toHaveLength(15)
    expect(complete.nodes).toEqual(path.nodes)
    expect(complete.heatSource).toBe(path.heatSource)
    expect(complete.times).toEqual(path.times)
    expect(complete.diffusionCoefficient).toBe(path.diffusionCoefficient)
  })

  it('keeps registry defaults and layout aligned with the graph factory', () => {
    const request = PATH_COMPLETE_EXPERIMENT.createRequest(
      PATH_COMPLETE_EXPERIMENT.defaultParameters,
    )

    expect(PATH_COMPLETE_EXPERIMENT).toMatchObject({
      id: 'path-complete',
      sequence: '02',
      defaultHeatSource: 'node-0',
      control: {
        kind: 'topology',
        defaultValue: 'path',
      },
    })
    expect(Object.keys(PATH_COMPLETE_EXPERIMENT.positions).sort()).toEqual(
      request.nodes.map((node) => node.id).sort(),
    )
  })
})
