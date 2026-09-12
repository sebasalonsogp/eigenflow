export interface HealthResponse {
  status: 'ok'
  service: 'eigenflow-api'
}

export type HealthState =
  | { status: 'checking' }
  | { status: 'ready' }
  | { status: 'unavailable' }

export interface GraphNode {
  id: string
}

export interface GraphEdge {
  source: string
  target: string
  weight: number
}

export interface AnalysisRequest {
  nodes: GraphNode[]
  edges: GraphEdge[]
  heatSource: string
  times: number[]
  diffusionCoefficient: number
}

export interface AnalysisResponse {
  nodeOrder: string[]
  graph: { nodes: GraphNode[]; edges: GraphEdge[] }
  matrices: {
    adjacency: number[][]
    degree: number[][]
    laplacian: number[][]
  }
  spectrum: {
    eigenvalues: number[]
    eigenvectors: number[][]
    residualNorms: number[]
    zeroEigenvalueMultiplicity: number
    algebraicConnectivity: number | null
    degenerateEigenspaces: Array<{
      eigenvalue: number
      indices: number[]
      multiplicity: number
    }>
    tolerance: number
  }
  diffusion: {
    times: number[]
    states: number[][]
    initialState: number[]
    diffusionCoefficient: number
  }
  diagnostics: {
    maxEigenpairResidual: number
    maxHeatConservationError: number
  }
}

export type AnalysisApiErrorKind = 'validation' | 'http' | 'invalid-response'

export class AnalysisApiError extends Error {
  kind: AnalysisApiErrorKind

  constructor(kind: AnalysisApiErrorKind, message: string) {
    super(message)
    this.name = 'AnalysisApiError'
    this.kind = kind
  }
}

function isHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return candidate.status === 'ok' && candidate.service === 'eigenflow-api'
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch('/api/health', { signal })
  if (!response.ok) throw new Error(`Health check failed with status ${response.status}`)

  const payload: unknown = await response.json()
  if (!isHealthResponse(payload)) throw new Error('Health check returned an invalid response')
  return payload
}

export async function analyzeGraph(
  request: AnalysisRequest,
  signal?: AbortSignal,
): Promise<AnalysisResponse> {
  const response = await fetch('/api/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  })
  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const kind = response.status === 422 ? 'validation' : 'http'
    throw new AnalysisApiError(kind, extractErrorMessage(payload, response.status))
  }
  if (!isAnalysisResponse(payload)) {
    throw new AnalysisApiError('invalid-response', 'Analysis returned an invalid response')
  }
  return payload
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (isRecord(payload) && Array.isArray(payload.detail)) {
    const firstError: unknown = payload.detail[0]
    if (isRecord(firstError) && typeof firstError.msg === 'string') return firstError.msg
  }
  return `Analysis request failed with status ${status}`
}

function isAnalysisResponse(value: unknown): value is AnalysisResponse {
  if (!isRecord(value) || !isStringArray(value.nodeOrder)) return false
  const size = value.nodeOrder.length
  if (size === 0 || new Set(value.nodeOrder).size !== size) return false

  return isGraphResult(value.graph, value.nodeOrder)
    && isRecord(value.matrices)
    && isNumberMatrix(value.matrices.adjacency, size, size)
    && isNumberMatrix(value.matrices.degree, size, size)
    && isNumberMatrix(value.matrices.laplacian, size, size)
    && isSpectrumResult(value.spectrum, size)
    && isDiffusionResult(value.diffusion, size)
    && isRecord(value.diagnostics)
    && isFiniteNumber(value.diagnostics.maxEigenpairResidual)
    && isFiniteNumber(value.diagnostics.maxHeatConservationError)
}

function isGraphResult(value: unknown, nodeOrder: string[]): boolean {
  if (!isRecord(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) return false
  if (value.nodes.length !== nodeOrder.length) return false
  if (!value.nodes.every((node, index) => isRecord(node) && node.id === nodeOrder[index])) return false
  const nodeIds = new Set(nodeOrder)
  return value.edges.every((edge) => isRecord(edge)
    && typeof edge.source === 'string'
    && typeof edge.target === 'string'
    && nodeIds.has(edge.source)
    && nodeIds.has(edge.target)
    && isFiniteNumber(edge.weight)
    && edge.weight >= 0)
}

function isSpectrumResult(value: unknown, size: number): boolean {
  return isRecord(value)
    && isNumberArray(value.eigenvalues, size)
    && isNumberMatrix(value.eigenvectors, size, size)
    && isNumberArray(value.residualNorms, size)
    && Number.isInteger(value.zeroEigenvalueMultiplicity)
    && (value.algebraicConnectivity === null || isFiniteNumber(value.algebraicConnectivity))
    && Array.isArray(value.degenerateEigenspaces)
    && value.degenerateEigenspaces.every(isEigenspace)
    && isFiniteNumber(value.tolerance)
}

function isEigenspace(value: unknown): boolean {
  return isRecord(value)
    && isFiniteNumber(value.eigenvalue)
    && Array.isArray(value.indices)
    && value.indices.every(Number.isInteger)
    && Number.isInteger(value.multiplicity)
}

function isDiffusionResult(value: unknown, size: number): boolean {
  if (!isRecord(value) || !isNumberArray(value.times) || !isNumberArray(value.initialState, size)) {
    return false
  }
  return isNumberMatrix(value.states, value.times.length, size)
    && isFiniteNumber(value.diffusionCoefficient)
    && value.diffusionCoefficient > 0
}

function isNumberMatrix(value: unknown, rows: number, columns: number): value is number[][] {
  return Array.isArray(value)
    && value.length === rows
    && value.every((row) => isNumberArray(row, columns))
}

function isNumberArray(value: unknown, length?: number): value is number[] {
  return Array.isArray(value)
    && (length === undefined || value.length === length)
    && value.every(isFiniteNumber)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
