import type { AnalysisRequest, GraphEdge } from '../api'
import type { ExperimentDefinition } from './types'

const COMMUNITY_SIZE = 4
const leftNodes = Array.from({ length: COMMUNITY_SIZE }, (_, index) => `left-${index}`)
const rightNodes = Array.from({ length: COMMUNITY_SIZE }, (_, index) => `right-${index}`)

export const DEFAULT_BRIDGE_WEIGHT = 0.1
export const MIN_BRIDGE_WEIGHT = 0.05
export const MAX_BRIDGE_WEIGHT = 2
export const BRIDGE_WEIGHT_STEP = 0.05
export const DEFAULT_HEAT_SOURCE = 'left-0'

function cliqueEdges(nodeIds: string[]): GraphEdge[] {
  return nodeIds.flatMap((source, sourceIndex) => (
    nodeIds.slice(sourceIndex + 1).map((target) => ({ source, target, weight: 1 }))
  ))
}

export interface BottleneckParameters {
  bridgeWeight: number
  heatSource: string
}

export function createBottleneckRequest({
  bridgeWeight,
  heatSource,
}: BottleneckParameters): AnalysisRequest {
  return {
    nodes: [...leftNodes, ...rightNodes].map((id) => ({ id })),
    edges: [
      ...cliqueEdges(leftNodes),
      { source: 'left-3', target: 'right-0', weight: bridgeWeight },
      ...cliqueEdges(rightNodes),
    ],
    heatSource,
    times: [0, 0.25, 0.75, 1.5, 3, 6, 12, 24],
    diffusionCoefficient: 1,
  }
}

export const BOTTLENECK_REQUEST = createBottleneckRequest({
  bridgeWeight: DEFAULT_BRIDGE_WEIGHT,
  heatSource: DEFAULT_HEAT_SOURCE,
})

export const BOTTLENECK_LAYOUT: Record<string, { x: number; y: number }> = {
  'left-0': { x: 86, y: 112 },
  'left-1': { x: 152, y: 58 },
  'left-2': { x: 152, y: 166 },
  'left-3': { x: 218, y: 112 },
  'right-0': { x: 302, y: 112 },
  'right-1': { x: 368, y: 58 },
  'right-2': { x: 368, y: 166 },
  'right-3': { x: 434, y: 112 },
}

export const BOTTLENECK_EXPERIMENT = {
  id: 'bottleneck',
  sequence: '01',
  label: 'Bottleneck',
  question: 'How much can one weak edge slow global diffusion?',
  takeaway: 'A weak bridge compresses algebraic connectivity and preserves a slow global diffusion mode.',
  defaultHeatSource: DEFAULT_HEAT_SOURCE,
  defaultParameters: {
    bridgeWeight: DEFAULT_BRIDGE_WEIGHT,
    heatSource: DEFAULT_HEAT_SOURCE,
  },
  control: {
    kind: 'bridge-strength',
    label: 'Bridge strength',
    minimum: MIN_BRIDGE_WEIGHT,
    maximum: MAX_BRIDGE_WEIGHT,
    step: BRIDGE_WEIGHT_STEP,
    defaultValue: DEFAULT_BRIDGE_WEIGHT,
    minimumLabel: 'Weak',
    maximumLabel: 'Strong',
  },
  createRequest: createBottleneckRequest,
  positions: BOTTLENECK_LAYOUT,
} satisfies ExperimentDefinition<BottleneckParameters>

export const BOTTLENECK_DISPLAY_SAMPLE_INDEX = 2
