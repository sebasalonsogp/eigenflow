import { interpolateInferno, scaleLinear } from 'd3'
import { useId, useMemo, useState } from 'react'
import type { AnalysisResponse } from '../api'
import type { DiffusionFrame } from '../diffusionFrame'
import {
  buildTransferSeries,
  computeEdgeFluxes,
  fluxStrength,
  maximumEdgeFlux,
  transferAtTime,
} from '../edgeFlux'
import type { FiedlerEntry } from '../fiedler'
import { expandHeatForColor } from '../heatEncoding'
import './NetworkView.css'

export interface NodePosition {
  x: number
  y: number
}

interface NetworkViewProps {
  analysis: AnalysisResponse
  positions: Record<string, NodePosition>
  frame: DiffusionFrame
  announceChanges?: boolean
  partition?: FiedlerEntry[]
  onSelectNode?: (nodeId: string) => void
}

const VIEWBOX_WIDTH = 520
// Leaves room below the lowest curated node (y = 198) for its label.
const VIEWBOX_HEIGHT = 236
// Inferno's darkest tail disappears into the page background, so start above it.
const COLOR_FLOOR = 0.14
const MINIMUM_VISIBLE_FLUX = 0.04
// Dashes advance this many view-box units per unit of heat an edge has carried,
// so their speed is the instantaneous flux and scrubbing runs them backwards.
const DASH_TRAVEL_PER_HEAT = 600

function heatColor(expandedHeat: number): string {
  return interpolateInferno(COLOR_FLOOR + (0.98 - COLOR_FLOOR) * expandedHeat)
}

export function NetworkView({
  analysis,
  positions,
  frame,
  announceChanges = true,
  partition,
  onSelectNode,
}: NetworkViewProps) {
  const titleId = `${useId().replaceAll(':', '')}-title`
  const [hoveredId, setHoveredId] = useState<string>()
  const { nodeOrder, graph, diffusion } = analysis
  const fluxReference = useMemo(
    () => maximumEdgeFlux(nodeOrder, graph.edges, diffusion.states),
    [diffusion.states, graph.edges, nodeOrder],
  )
  const transfer = useMemo(
    () => buildTransferSeries(nodeOrder, graph.edges, diffusion.times, diffusion.states),
    [diffusion.states, diffusion.times, graph.edges, nodeOrder],
  )
  if (analysis.nodeOrder.length === 0 || frame.state.length === 0) {
    return (
      <figure className="network-view network-view--empty" role="status">
        <strong>No graph data to display</strong>
        <span>The numerical result did not include a drawable state.</span>
      </figure>
    )
  }

  const { state, time } = frame
  const sourceIndex = indexOfMaximum(analysis.diffusion.initialState)
  const hottestIndex = indexOfMaximum(state)
  const sourceId = analysis.nodeOrder[sourceIndex]
  const hottestId = analysis.nodeOrder[hottestIndex]
  const maximumInitialHeat = Math.max(...analysis.diffusion.initialState, 1)
  const maximumWeight = Math.max(...analysis.graph.edges.map((edge) => edge.weight), 1)
  const edgeWidth = scaleLinear().domain([0, maximumWeight]).range([1, 3.25])
  const descriptionId = `${titleId}-description`
  const glowFilterId = `${titleId}-glow`

  const positionedNodes = analysis.nodeOrder.map((nodeId, index) => ({
    id: nodeId,
    heat: state[index],
    colorHeat: expandHeatForColor(state[index], maximumInitialHeat),
    position: positions[nodeId] ?? circularPosition(index, analysis.nodeOrder.length),
  }))
  const positionById = new Map(positionedNodes.map((node) => [node.id, node.position]))
  const partitionByNodeId = new Map(partition?.map((entry) => [entry.nodeId, entry.group]))
  const totalHeat = state.reduce((sum, heat) => sum + heat, 0)
  const weightByEdgeId = new Map(graph.edges.map((edge) => [
    `${edge.source}-${edge.target}`,
    edge,
  ]))
  const visibleFluxes = fluxReference > 0 && !partition
    ? computeEdgeFluxes(nodeOrder, graph.edges, state)
      .map((flux) => ({ ...flux, strength: fluxStrength(flux.magnitude, fluxReference) }))
      .filter((flux) => flux.strength >= MINIMUM_VISIBLE_FLUX)
    : []
  const hovered = positionedNodes.find((node) => node.id === hoveredId)

  return (
    <figure
      className={[
        'network-view',
        partition && 'network-view--partition',
        onSelectNode && 'network-view--selectable',
      ].filter(Boolean).join(' ')}
    >
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
        onPointerLeave={() => setHoveredId(undefined)}
      >
        <title id={titleId}>Heat diffusion across {analysis.nodeOrder.length} graph nodes</title>
        <desc id={descriptionId}>
          {analysis.graph.edges.length} weighted edges connect the graph. The heat source is
          {' '}{sourceId}; at time {time.toFixed(2)}, {hottestId} is hottest.
          {partition && ' The Fiedler partition overlay is active.'}
        </desc>
        <defs>
          <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        <g className="network-glow" filter={`url(#${glowFilterId})`} aria-hidden="true">
          {positionedNodes.map((node) => {
            const group = partitionByNodeId.get(node.id)
            return partition ? (
              <circle
                key={node.id}
                className="network-glow-partition"
                data-partition={group}
                cx={node.position.x}
                cy={node.position.y}
                r="30"
              />
            ) : (
              <circle
                key={node.id}
                cx={node.position.x}
                cy={node.position.y}
                r={12 + 16 * node.colorHeat}
                fill={heatColor(node.colorHeat)}
                opacity={0.75 * node.colorHeat}
              />
            )
          })}
        </g>
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
                style={{ strokeWidth: edgeWidth(edge.weight) }}
              />
            )
          })}
        </g>
        <g className="network-flux" aria-hidden="true">
          {visibleFluxes.map((flux) => {
            const edge = weightByEdgeId.get(flux.edgeId)
            const series = transfer.get(flux.edgeId)
            const source = edge && positionById.get(edge.source)
            const target = edge && positionById.get(edge.target)
            if (!edge || !series || !source || !target) return null
            const carried = transferAtTime(series, diffusion.times, time, flux.signed)
            return (
              <line
                key={flux.edgeId}
                data-flux-edge={flux.edgeId}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                strokeWidth={edgeWidth(edge.weight) + 1.25}
                strokeOpacity={flux.strength}
                strokeDashoffset={-DASH_TRAVEL_PER_HEAT * carried}
              />
            )
          })}
        </g>
        <g className="network-nodes" aria-hidden="true">
          {positionedNodes.map((node) => (
            <g
              key={node.id}
              data-node-id={node.id}
              data-partition={partitionByNodeId.get(node.id)}
              transform={`translate(${node.position.x} ${node.position.y})`}
              onPointerEnter={() => setHoveredId(node.id)}
              onClick={onSelectNode && node.id !== sourceId
                ? () => onSelectNode(node.id)
                : undefined}
            >
              <circle className="network-node-hit" r="22" />
              {node.id === sourceId && <circle className="network-node-source" r="20" />}
              <circle
                className="network-node"
                r={11 + 4 * node.colorHeat}
                fill={heatColor(node.colorHeat)}
              />
              <text y="31">{node.id}</text>
            </g>
          ))}
        </g>
        {hovered && (
          <g
            className="node-inspector"
            aria-hidden="true"
            transform={`translate(${clamp(hovered.position.x, 62, VIEWBOX_WIDTH - 62)} ${
              hovered.position.y < 70 ? hovered.position.y + 58 : hovered.position.y - 58
            })`}
          >
            <rect x="-58" y="-17" width="116" height={onSelectNode ? 42 : 32} rx="5" />
            <text y="-3">{hovered.id}</text>
            <text className="node-inspector-value" y="10">
              heat {formatHeat(hovered.heat)}
            </text>
            {onSelectNode && (
              <text className="node-inspector-hint" y="21">
                {hovered.id === sourceId ? 'current heat source' : 'click to inject heat'}
              </text>
            )}
          </g>
        )}
      </svg>

      <figcaption
        className="network-summary"
        aria-live={announceChanges ? 'polite' : 'off'}
      >
        <span>t = {time.toFixed(2)}</span>
        <span>Source {sourceId}</span>
        <span>Hottest {hottestId}</span>
        <span>Total heat {totalHeat.toFixed(3)}</span>
      </figcaption>

      <div className="network-legend">
        {!partition && (
          <p className="flux-key">
            <span className="flux-key-swatch" aria-hidden="true" />
            Dashes advance with the heat each edge carries, w·Δx; brightness is log-scaled
          </p>
        )}
        <div
          className="heat-key"
          aria-label="Heat scale from cooler to warmer with square-root color spacing"
        >
          <span>Cooler</span>
          <span className="heat-key-gradient" aria-hidden="true" />
          <span>Warmer</span>
          <small>√ color scale keeps low heat visible</small>
        </div>
      </div>

      <table className="visually-hidden">
        <caption>Node heat values at time {time.toFixed(2)}</caption>
        <thead>
          <tr>
            <th scope="col">Graph node</th>
            <th scope="col">Current heat</th>
          </tr>
        </thead>
        <tbody>
          {positionedNodes.map((node) => (
            <tr key={node.id}>
              <th scope="row">Node {node.id}</th>
              <td>{formatHeat(node.heat)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

function indexOfMaximum(values: number[]): number {
  return values.reduce(
    (maximumIndex, value, index) => value > values[maximumIndex] ? index : maximumIndex,
    0,
  )
}

function formatHeat(value: number): string {
  return Math.abs(value) < 0.0005 ? '0.000' : value.toFixed(3)
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}

function circularPosition(index: number, count: number): NodePosition {
  const angle = (2 * Math.PI * index) / count - Math.PI / 2
  return {
    x: VIEWBOX_WIDTH / 2 + Math.cos(angle) * 150,
    y: VIEWBOX_HEIGHT / 2 + Math.sin(angle) * 72,
  }
}
