import { describe, expect, it } from 'vitest'
import { createBottleneckRequest } from './bottleneck'
import {
  DEFAULT_EXPERIMENT_ID,
  EXPERIMENTS,
  getExperiment,
  type ExperimentId,
} from './index'

describe('experiment registry', () => {
  it('registers the finished bottleneck experiment with its portfolio story', () => {
    expect(Object.keys(EXPERIMENTS)).toEqual(['bottleneck'])

    const experiment = getExperiment(DEFAULT_EXPERIMENT_ID)
    expect(experiment).toMatchObject({
      id: 'bottleneck',
      sequence: '01',
      label: 'Bottleneck',
      question: 'How much can one weak edge slow global diffusion?',
      defaultHeatSource: 'left-0',
      control: {
        kind: 'bridge-strength',
        label: 'Bridge strength',
        minimum: 0.05,
        maximum: 2,
        step: 0.05,
        defaultValue: 0.1,
      },
    })
    expect(experiment.takeaway).toMatch(/algebraic connectivity/i)
  })

  it('keeps graph construction and layout aligned behind one definition', () => {
    const experiment = getExperiment('bottleneck')
    const request = experiment.createRequest(experiment.defaultParameters)

    expect(request).toEqual(createBottleneckRequest(experiment.defaultParameters))
    expect(request.heatSource).toBe(experiment.defaultHeatSource)
    expect(Object.keys(experiment.positions).sort()).toEqual(
      request.nodes.map((node) => node.id).sort(),
    )
  })

  it('exposes only registered experiment identifiers', () => {
    const id: ExperimentId = 'bottleneck'
    expect(getExperiment(id).id).toBe(id)
  })
})
