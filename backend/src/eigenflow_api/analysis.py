"""Framework-independent orchestration for a complete graph analysis."""

from collections.abc import Iterable
from dataclasses import dataclass
from numbers import Real

import numpy as np

from eigenflow_api.math.diffusion import DiffusionResult, simulate_diffusion
from eigenflow_api.math.graph import CanonicalGraph, Edge, canonicalize_graph
from eigenflow_api.math.laplacian import GraphMatrices, build_graph_matrices
from eigenflow_api.math.spectrum import Spectrum, analyze_spectrum


class AnalysisValidationError(ValueError):
    """Raised when an analysis request is inconsistent with its graph."""


@dataclass(frozen=True, slots=True)
class AnalysisDiagnostics:
    """Compact numerical checks suitable for inspection at application boundaries."""

    max_eigenpair_residual: float
    max_heat_conservation_error: float


@dataclass(frozen=True, slots=True)
class GraphAnalysis:
    """One internally aligned graph, spectral, and diffusion result."""

    graph: CanonicalGraph
    matrices: GraphMatrices
    spectrum: Spectrum
    diffusion: DiffusionResult
    diagnostics: AnalysisDiagnostics

    @property
    def node_order(self) -> tuple[str, ...]:
        """Return the shared order used by every vector and matrix."""

        return self.graph.node_order


def analyze_graph(
    node_ids: Iterable[str],
    edges: Iterable[Edge],
    *,
    heat_source: str,
    times: Iterable[Real],
    diffusion_coefficient: Real = 1.0,
) -> GraphAnalysis:
    """Validate and compute every numerical view needed for one experiment."""

    graph = canonicalize_graph(node_ids, edges)
    if heat_source not in graph.node_order:
        raise AnalysisValidationError("heat source must reference a node in the graph")

    matrices = build_graph_matrices(graph)
    spectrum = analyze_spectrum(matrices)
    initial_state = dict.fromkeys(graph.node_order, 0.0)
    initial_state[heat_source] = 1.0
    diffusion = simulate_diffusion(
        matrices,
        spectrum,
        initial_state=initial_state,
        times=times,
        diffusion_coefficient=diffusion_coefficient,
    )
    total_heat = float(diffusion.initial_state.sum())
    conservation_errors = np.abs(diffusion.states.sum(axis=1) - total_heat)

    return GraphAnalysis(
        graph=graph,
        matrices=matrices,
        spectrum=spectrum,
        diffusion=diffusion,
        diagnostics=AnalysisDiagnostics(
            max_eigenpair_residual=max(spectrum.residual_norms),
            max_heat_conservation_error=float(conservation_errors.max()),
        ),
    )
