import {
  BRIDGE_WEIGHT_STEP,
  DEFAULT_BRIDGE_WEIGHT,
  DEFAULT_HEAT_SOURCE,
  MAX_BRIDGE_WEIGHT,
  MIN_BRIDGE_WEIGHT,
} from '../experiments/bottleneck'
import './BottleneckControls.css'

interface BottleneckControlsProps {
  nodeIds: string[]
  heatSource: string
  bridgeWeight: number
  onHeatSourceChange: (nodeId: string) => void
  onBridgeWeightChange: (weight: number) => void
  onReset: () => void
}

export function BottleneckControls({
  nodeIds,
  heatSource,
  bridgeWeight,
  onHeatSourceChange,
  onBridgeWeightChange,
  onReset,
}: BottleneckControlsProps) {
  const isAtDefaults = heatSource === DEFAULT_HEAT_SOURCE
    && bridgeWeight === DEFAULT_BRIDGE_WEIGHT

  return (
    <section className="bottleneck-controls" aria-label="Experiment controls">
      <div className="control-field control-field--source">
        <label htmlFor="heat-source">Heat source</label>
        <select
          id="heat-source"
          value={heatSource}
          onChange={(event) => onHeatSourceChange(event.target.value)}
        >
          {nodeIds.map((nodeId) => <option key={nodeId}>{nodeId}</option>)}
        </select>
      </div>

      <div className="control-field control-field--bridge">
        <label htmlFor="bridge-strength">
          Bridge strength
          <output htmlFor="bridge-strength" aria-live="polite">
            {bridgeWeight.toFixed(2)}
          </output>
        </label>
        <input
          id="bridge-strength"
          type="range"
          min={MIN_BRIDGE_WEIGHT}
          max={MAX_BRIDGE_WEIGHT}
          step={BRIDGE_WEIGHT_STEP}
          value={bridgeWeight}
          onChange={(event) => onBridgeWeightChange(Number(event.target.value))}
        />
        <div className="control-range-labels" aria-hidden="true">
          <span>Weak</span>
          <span>Strong</span>
        </div>
      </div>

      <button type="button" onClick={onReset} disabled={isAtDefaults}>
        Reset experiment
      </button>
    </section>
  )
}
