import type { AnalysisRequest, GraphEdge } from '../api'
import type { ChoiceControl, ExperimentDefinition } from './types'

const NODE_COUNT = 6
const NODE_IDS = Array.from({ length: NODE_COUNT }, (_, index) => `node-${index}`)

export type ComparisonTopology = 'path' | 'complete'

export interface PathCompleteParameters {
  topology: ComparisonTopology
  heatSource: string
}

const TOPOLOGY_CONTROL = {
  kind: 'topology',
  label: 'Network topology',
  defaultValue: 'path',
  options: [
    { value: 'path', label: 'Path' },
    { value: 'complete', label: 'Complete' },
  ],
} as const satisfies ChoiceControl<ComparisonTopology>

const DEFAULT_PARAMETERS: PathCompleteParameters = {
  topology: TOPOLOGY_CONTROL.defaultValue,
  heatSource: 'node-0',
}

export function createPathCompleteRequest({
  topology,
  heatSource,
}: PathCompleteParameters): AnalysisRequest {
  return {
    nodes: NODE_IDS.map((id) => ({ id })),
    edges: topology === 'path' ? pathEdges() : completeEdges(),
    heatSource,
    times: [0, 0.1, 0.25, 0.5, 1, 2, 4, 8, 16],
    diffusionCoefficient: 1,
  }
}

const PATH_COMPLETE_LAYOUT: Record<string, { x: number; y: number }> = {
  'node-0': { x: 260, y: 26 },
  'node-1': { x: 388, y: 68 },
  'node-2': { x: 420, y: 156 },
  'node-3': { x: 260, y: 198 },
  'node-4': { x: 100, y: 156 },
  'node-5': { x: 132, y: 68 },
}

export const PATH_COMPLETE_EXPERIMENT = {
  id: 'path-complete',
  sequence: '02',
  label: 'Path vs complete',
  question: 'How much does connectivity change diffusion at the same graph size?',
  takeaway: 'At six nodes, topology—not graph size—creates the spectral gap between slow local transport and rapid global mixing.',
  defaultHeatSource: DEFAULT_PARAMETERS.heatSource,
  defaultParameters: DEFAULT_PARAMETERS,
  control: TOPOLOGY_CONTROL,
  createRequest: createPathCompleteRequest,
  positions: PATH_COMPLETE_LAYOUT,
} satisfies ExperimentDefinition<
  PathCompleteParameters,
  ChoiceControl<ComparisonTopology>
>

function pathEdges(): GraphEdge[] {
  return NODE_IDS.slice(0, -1).map((source, index) => ({
    source,
    target: NODE_IDS[index + 1],
    weight: 1,
  }))
}

function completeEdges(): GraphEdge[] {
  return NODE_IDS.flatMap((source, sourceIndex) => (
    NODE_IDS.slice(sourceIndex + 1).map((target) => ({ source, target, weight: 1 }))
  ))
}
