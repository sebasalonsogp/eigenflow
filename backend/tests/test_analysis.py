import numpy as np
import pytest

from eigenflow_api.analysis import AnalysisValidationError, analyze_graph
from eigenflow_api.math.fixtures import bottleneck_graph


def test_composes_the_complete_bottleneck_analysis() -> None:
    graph = bottleneck_graph(bridge_weight=0.1)

    analysis = analyze_graph(
        graph.node_order,
        graph.edges,
        heat_source="left-0",
        times=[0.0, 1.0, 8.0],
        diffusion_coefficient=0.75,
    )

    assert analysis.node_order == graph.node_order
    assert analysis.graph == graph
    assert analysis.matrices.node_order == analysis.node_order
    assert analysis.spectrum.node_order == analysis.node_order
    assert analysis.diffusion.node_order == analysis.node_order
    assert analysis.matrices.laplacian.shape == (8, 8)
    assert analysis.spectrum.eigenvectors.shape == (8, 8)
    assert analysis.diffusion.states.shape == (3, 8)
    assert analysis.diffusion.initial_state[analysis.node_order.index("left-0")] == 1.0
    assert np.count_nonzero(analysis.diffusion.initial_state) == 1
    assert analysis.diagnostics.max_eigenpair_residual < 1e-10
    assert analysis.diagnostics.max_heat_conservation_error < 1e-10


def test_rejects_a_heat_source_outside_the_graph() -> None:
    graph = bottleneck_graph()

    with pytest.raises(AnalysisValidationError, match="heat source must reference"):
        analyze_graph(
            graph.node_order,
            graph.edges,
            heat_source="missing",
            times=[0.0],
        )
