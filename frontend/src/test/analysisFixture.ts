import type { AnalysisRequest, AnalysisResponse } from '../api'

export const ANALYSIS_REQUEST = {
  nodes: [{ id: 'a' }, { id: 'b' }],
  edges: [{ source: 'a', target: 'b', weight: 1 }],
  heatSource: 'a',
  times: [0, 1],
  diffusionCoefficient: 1,
} satisfies AnalysisRequest

export const ANALYSIS_FIXTURE = {
  nodeOrder: ['a', 'b'],
  graph: {
    nodes: [{ id: 'a' }, { id: 'b' }],
    edges: [{ source: 'a', target: 'b', weight: 1 }],
  },
  matrices: {
    adjacency: [[0, 1], [1, 0]],
    degree: [[1, 0], [0, 1]],
    laplacian: [[1, -1], [-1, 1]],
  },
  spectrum: {
    eigenvalues: [0, 2],
    eigenvectors: [[Math.SQRT1_2, Math.SQRT1_2], [Math.SQRT1_2, -Math.SQRT1_2]],
    residualNorms: [0, 0],
    zeroEigenvalueMultiplicity: 1,
    algebraicConnectivity: 2,
    degenerateEigenspaces: [],
    tolerance: 1e-10,
  },
  diffusion: {
    times: [0, 1],
    states: [[1, 0], [0.5676676416, 0.4323323584]],
    initialState: [1, 0],
    diffusionCoefficient: 1,
  },
  diagnostics: {
    maxEigenpairResidual: 0,
    maxHeatConservationError: 0,
  },
} satisfies AnalysisResponse
