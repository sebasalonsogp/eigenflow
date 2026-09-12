import type { AnalysisRequest, GraphEdge } from '../api'

const COMMUNITY_SIZE = 4
const leftNodes = Array.from({ length: COMMUNITY_SIZE }, (_, index) => `left-${index}`)
const rightNodes = Array.from({ length: COMMUNITY_SIZE }, (_, index) => `right-${index}`)

function cliqueEdges(nodeIds: string[]): GraphEdge[] {
  return nodeIds.flatMap((source, sourceIndex) => (
    nodeIds.slice(sourceIndex + 1).map((target) => ({ source, target, weight: 1 }))
  ))
}

export const BOTTLENECK_REQUEST = {
  nodes: [...leftNodes, ...rightNodes].map((id) => ({ id })),
  edges: [
    ...cliqueEdges(leftNodes),
    { source: 'left-3', target: 'right-0', weight: 0.1 },
    ...cliqueEdges(rightNodes),
  ],
  heatSource: 'left-0',
  times: [0, 0.25, 0.75, 1.5, 3, 6, 12, 24],
  diffusionCoefficient: 1,
} satisfies AnalysisRequest

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

export const BOTTLENECK_DISPLAY_SAMPLE_INDEX = 2
