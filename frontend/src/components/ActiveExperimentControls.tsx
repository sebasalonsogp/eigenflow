import type { AnalysisRequest } from '../api'
import { EXPERIMENTS } from '../experiments'
import type { ActiveExperimentState } from '../experiments/state'
import { BottleneckControls } from './BottleneckControls'
import { ChoiceControls } from './ChoiceControls'

interface ActiveExperimentControlsProps {
  state: ActiveExperimentState
  request: AnalysisRequest
  onChange: (state: ActiveExperimentState) => void
}

export function ActiveExperimentControls({
  state,
  request,
  onChange,
}: ActiveExperimentControlsProps) {
  switch (state.id) {
    case 'bottleneck':
      return (
        <BottleneckControls
          nodeIds={request.nodes.map((node) => node.id)}
          heatSource={state.parameters.heatSource}
          bridgeWeight={state.parameters.bridgeWeight}
          defaultHeatSource={EXPERIMENTS.bottleneck.defaultHeatSource}
          control={EXPERIMENTS.bottleneck.control}
          onHeatSourceChange={(heatSource) => onChange({
            ...state,
            parameters: { ...state.parameters, heatSource },
          })}
          onBridgeWeightChange={(bridgeWeight) => onChange({
            ...state,
            parameters: { ...state.parameters, bridgeWeight },
          })}
          onReset={() => onChange({
            id: state.id,
            parameters: { ...EXPERIMENTS.bottleneck.defaultParameters },
          })}
        />
      )
    case 'path-complete':
      return (
        <ChoiceControls
          value={state.parameters.topology}
          fixedLabel="Fixed source"
          fixedValue={state.parameters.heatSource}
          control={EXPERIMENTS['path-complete'].control}
          onChange={(topology) => onChange({
            ...state,
            parameters: { ...state.parameters, topology },
          })}
          onReset={() => onChange({
            id: state.id,
            parameters: { ...EXPERIMENTS['path-complete'].defaultParameters },
          })}
        />
      )
    case 'star':
      return (
        <ChoiceControls
          value={state.parameters.heatSource}
          fixedLabel="Fixed network"
          fixedValue="Six-node star"
          control={EXPERIMENTS.star.control}
          onChange={(heatSource) => onChange({
            ...state,
            parameters: { heatSource },
          })}
          onReset={() => onChange({
            id: state.id,
            parameters: { ...EXPERIMENTS.star.defaultParameters },
          })}
        />
      )
  }
}
