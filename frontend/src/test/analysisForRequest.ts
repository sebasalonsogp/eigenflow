import type { AnalysisRequest, AnalysisResponse } from '../api'

type DegenerateEigenspace = AnalysisResponse['spectrum']['degenerateEigenspaces'][number]

export function analysisForRequest(request: AnalysisRequest): AnalysisResponse {
  const size = request.nodes.length
  const graphKind = identifyGraph(request)
  const eigenvalues = graphKind === 'complete'
    ? [0, 6, 6, 6, 6, 6]
    : graphKind === 'star'
      ? [0, 1, 1, 1, 1, 6]
      : [0, 0.268, 1, 2, 3, 3.732]
  const degenerateEigenspaces: DegenerateEigenspace[] = graphKind === 'complete'
    ? [{ eigenvalue: 6, indices: [1, 2, 3, 4, 5], multiplicity: 5 }]
    : graphKind === 'star'
      ? [{ eigenvalue: 1, indices: [1, 2, 3, 4], multiplicity: 4 }]
      : []
  const initialState = request.nodes.map((node) => (
    node.id === request.heatSource ? 1 : 0
  ))
  const identity = request.nodes.map((_, row) => (
    request.nodes.map((__, column) => row === column ? 1 : 0)
  ))
  const zeroMatrix = request.nodes.map(() => request.nodes.map(() => 0))

  return {
    nodeOrder: request.nodes.map((node) => node.id),
    graph: { nodes: request.nodes, edges: request.edges },
    matrices: {
      adjacency: zeroMatrix,
      degree: zeroMatrix,
      laplacian: zeroMatrix,
    },
    spectrum: {
      eigenvalues,
      eigenvectors: identity,
      residualNorms: Array.from({ length: size }, () => 0),
      zeroEigenvalueMultiplicity: 1,
      algebraicConnectivity: eigenvalues[1],
      degenerateEigenspaces,
      tolerance: 1e-10,
    },
    diffusion: {
      times: request.times,
      states: request.times.map(() => initialState),
      initialState,
      diffusionCoefficient: request.diffusionCoefficient,
    },
    diagnostics: {
      maxEigenpairResidual: 0,
      maxHeatConservationError: 0,
    },
  }
}

function identifyGraph(request: AnalysisRequest): 'path' | 'complete' | 'star' {
  if (request.nodes[0]?.id === 'hub') return 'star'
  return request.edges.length === 15 ? 'complete' : 'path'
}
