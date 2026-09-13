import type { AnalysisRequest } from '../api'

export interface BridgeStrengthControl {
  kind: 'bridge-strength'
  label: string
  minimum: number
  maximum: number
  step: number
  defaultValue: number
  minimumLabel: string
  maximumLabel: string
}

export interface ChoiceControl<
  Value extends string,
  Kind extends string = 'topology',
> {
  kind: Kind
  label: string
  defaultValue: Value
  options: readonly { value: Value; label: string }[]
}

export interface ExperimentDefinition<Parameters, Control = BridgeStrengthControl> {
  id: string
  sequence: string
  label: string
  question: string
  takeaway: string
  defaultHeatSource: string
  defaultParameters: Parameters
  control: Control
  createRequest: (parameters: Parameters) => AnalysisRequest
  positions: Record<string, { x: number; y: number }>
}
