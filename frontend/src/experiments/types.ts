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

export interface ExperimentDefinition<Parameters> {
  id: string
  sequence: string
  label: string
  question: string
  takeaway: string
  defaultHeatSource: string
  defaultParameters: Parameters
  control: BridgeStrengthControl
  createRequest: (parameters: Parameters) => AnalysisRequest
  positions: Record<string, { x: number; y: number }>
}
