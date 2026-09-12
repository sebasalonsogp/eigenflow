import { interpolateCividis, scaleLinear, scaleSequential } from 'd3'
import { useId } from 'react'
import type { AnalysisResponse } from '../api'
import './NetworkView.css'

export interface NodePosition {
  x: number
  y: number
}

interface NetworkViewProps {
  analysis: AnalysisResponse
  positions: Record<string, NodePosition>
  sampleIndex?: number
}

const VIEWBOX_WIDTH = 520
const VIEWBOX_HEIGHT = 224

export function NetworkView({ analysis, positions, sampleIndex = 0 }: NetworkViewProps) {
  const titleId = `${useId().replaceAll(':', '')}-title`
  if (analysis.nodeOrder.length === 0 || analysis.diffusion.states.length === 0) {
    return (
      <figure className="network-view network-view--empty" role="status">
        <strong>No graph data to display</strong>
        <span>The numerical result did not include a drawable state.</span>
      </figure>
    )
  }

  const boundedSampleIndex = Math.min(
    Math.max(sampleIndex, 0),
    analysis.diffusion.states.length - 1,
  )
  const state = analysis.diffusion.states[boundedSampleIndex]
  const time = analysis.diffusion.times[boundedSampleIndex]
  const sourceIndex = indexOfMaximum(analysis.diffusion.initialState)
  const hottestIndex = indexOfMaximum(state)
  const sourceId = analysis.nodeOrder[sourceIndex]
  const hottestId = analysis.nodeOrder[hottestIndex]
  const maximumInitialHeat = Math.max(...analysis.diffusion.initialState, 1)
  const maximumWeight = Math.max(...analysis.graph.edges.map((edge) => edge.weight), 1)
  const heatColor = scaleSequential(interpolateCividis).domain([0, maximumInitialHeat])
  const edgeWidth = scaleLinear().domain([0, maximumWeight]).range([1, 3.25])
  const descriptionId = `${titleId}-description`

  const positionedNodes = analysis.nodeOrder.map((nodeId, index) => ({
    id: nodeId,
    heat: state[index],
    position: positions[nodeId] ?? circularPosition(index, analysis.nodeOrder.length),
  }))
  const positionById = new Map(positionedNodes.map((node) => [node.id, node.position]))
  const totalHeat = state.reduce((sum, heat) => sum + heat, 0)

  return (
    <figure className="network-view">
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
      >
        <title id={titleId}>Heat diffusion across {analysis.nodeOrder.length} graph nodes</title>
        <desc id={descriptionId}>
          {analysis.graph.edges.length} weighted edges connect the graph. The heat source is
          {' '}{sourceId}; at time {time.toFixed(2)}, {hottestId} is hottest.
        </desc>
        <g className="network-edges" aria-hidden="true">
          {analysis.graph.edges.map((edge) => {
            const source = positionById.get(edge.source)
            const target = positionById.get(edge.target)
            if (!source || !target) return null
            return (
              <line
                key={`${edge.source}-${edge.target}`}
                data-edge-id={`${edge.source}-${edge.target}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                strokeWidth={edgeWidth(edge.weight)}
              />
            )
          })}
        </g>
        <g className="network-nodes" aria-hidden="true">
          {positionedNodes.map((node) => (
            <g
              key={node.id}
              data-node-id={node.id}
              transform={`translate(${node.position.x} ${node.position.y})`}
            >
              {node.id === sourceId && <circle className="network-node-source" r="17" />}
              <circle className="network-node" r="11" fill={heatColor(node.heat)} />
              <text y="27">{node.id}</text>
            </g>
          ))}
        </g>
      </svg>

      <div className="heat-key" aria-label="Heat scale from cooler to warmer">
        <span>Cooler</span>
        <span className="heat-key-gradient" aria-hidden="true" />
        <span>Warmer</span>
      </div>

      <figcaption className="network-summary" aria-live="polite">
        <span>t = {time.toFixed(2)}</span>
        <span>Source {sourceId}</span>
        <span>Hottest {hottestId}</span>
        <span>Total heat {totalHeat.toFixed(3)}</span>
      </figcaption>
    </figure>
  )
}

function indexOfMaximum(values: number[]): number {
  return values.reduce(
    (maximumIndex, value, index) => value > values[maximumIndex] ? index : maximumIndex,
    0,
  )
}

function circularPosition(index: number, count: number): NodePosition {
  const angle = (2 * Math.PI * index) / count - Math.PI / 2
  return {
    x: VIEWBOX_WIDTH / 2 + Math.cos(angle) * 150,
    y: VIEWBOX_HEIGHT / 2 + Math.sin(angle) * 72,
  }
}
