import type { AnalysisRequest, GraphEdge } from '../api'
import type { ChoiceControl, ExperimentDefinition } from './types'

const LEAF_IDS = Array.from({ length: 5 }, (_, index) => `leaf-${index}`)

export type StarHeatSource = 'hub' | 'leaf-0'

export interface StarParameters {
  heatSource: StarHeatSource
}

const SOURCE_CONTROL = {
  kind: 'source-position',
  label: 'Source position',
  defaultValue: 'hub',
  options: [
    { value: 'hub', label: 'Hub' },
    { value: 'leaf-0', label: 'Leaf' },
  ],
} as const satisfies ChoiceControl<StarHeatSource, 'source-position'>

const DEFAULT_PARAMETERS: StarParameters = {
  heatSource: SOURCE_CONTROL.defaultValue,
}

export function createStarRequest({ heatSource }: StarParameters): AnalysisRequest {
  const edges: GraphEdge[] = LEAF_IDS.map((leaf) => ({
    source: 'hub',
    target: leaf,
    weight: 1,
  }))

  return {
    nodes: ['hub', ...LEAF_IDS].map((id) => ({ id })),
    edges,
    heatSource,
    times: [0, 0.1, 0.25, 0.5, 1, 2, 4, 8],
    diffusionCoefficient: 1,
  }
}

const STAR_LAYOUT: Record<string, { x: number; y: number }> = {
  hub: { x: 260, y: 112 },
  'leaf-0': { x: 260, y: 24 },
  'leaf-1': { x: 372, y: 82 },
  'leaf-2': { x: 330, y: 188 },
  'leaf-3': { x: 190, y: 188 },
  'leaf-4': { x: 148, y: 82 },
}

export const STAR_EXPERIMENT = {
  id: 'star',
  sequence: '03',
  label: 'Hub vs leaf',
  question: 'How does structural position change the first moments of diffusion?',
  takeaway: 'With the same graph and heat amount, the hub distributes heat to five neighbors immediately; a leaf must route heat through the hub to reach the rest.',
  defaultHeatSource: DEFAULT_PARAMETERS.heatSource,
  defaultParameters: DEFAULT_PARAMETERS,
  control: SOURCE_CONTROL,
  createRequest: createStarRequest,
  positions: STAR_LAYOUT,
} satisfies ExperimentDefinition<
  StarParameters,
  ChoiceControl<StarHeatSource, 'source-position'>
>
