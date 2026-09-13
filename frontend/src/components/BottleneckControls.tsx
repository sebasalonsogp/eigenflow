import type { BridgeStrengthControl } from '../experiments/types'
import './BottleneckControls.css'

interface BottleneckControlsProps {
  nodeIds: string[]
  heatSource: string
  bridgeWeight: number
  defaultHeatSource: string
  control: BridgeStrengthControl
  onHeatSourceChange: (nodeId: string) => void
  onBridgeWeightChange: (weight: number) => void
  onReset: () => void
}

export function BottleneckControls({
  nodeIds,
  heatSource,
  bridgeWeight,
  defaultHeatSource,
  control,
  onHeatSourceChange,
  onBridgeWeightChange,
  onReset,
}: BottleneckControlsProps) {
  const isAtDefaults = heatSource === defaultHeatSource
    && bridgeWeight === control.defaultValue

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
          {control.label}
          <output htmlFor="bridge-strength" aria-live="polite">
            {bridgeWeight.toFixed(2)}
          </output>
        </label>
        <input
          id="bridge-strength"
          type="range"
          min={control.minimum}
          max={control.maximum}
          step={control.step}
          value={bridgeWeight}
          onChange={(event) => onBridgeWeightChange(Number(event.target.value))}
        />
        <div className="control-range-labels" aria-hidden="true">
          <span>{control.minimumLabel}</span>
          <span>{control.maximumLabel}</span>
        </div>
      </div>

      <button type="button" onClick={onReset} disabled={isAtDefaults}>
        Reset experiment
      </button>
    </section>
  )
}
