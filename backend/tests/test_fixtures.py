import numpy as np
from numpy.testing import assert_allclose

from eigenflow_api.math.fixtures import (
    COMPARISON_NODE_COUNT,
    bottleneck_graph,
    complete_graph,
    path_graph,
    star_graph,
)
from eigenflow_api.math.laplacian import build_graph_matrices
from eigenflow_api.math.spectrum import analyze_spectrum


def _eigenvalues(graph_name: str) -> np.ndarray:
    fixtures = {
        "path": path_graph,
        "complete": complete_graph,
        "star": star_graph,
    }
    graph = fixtures[graph_name]()
    return analyze_spectrum(build_graph_matrices(graph)).eigenvalues


def test_bottleneck_graph_is_deterministic_and_has_one_cross_community_edge() -> None:
    graph = bottleneck_graph(bridge_weight=0.25)

    assert graph == bottleneck_graph(bridge_weight=0.25)
    assert len(graph.node_order) == 8
    assert len(graph.edges) == 13
    cross_community_edges = [
        edge
        for edge in graph.edges
        if edge.source.startswith("left-") and edge.target.startswith("right-")
    ]
    assert len(cross_community_edges) == 1
    assert cross_community_edges[0].weight == 0.25


def test_strengthening_bottleneck_bridge_increases_algebraic_connectivity() -> None:
    weak = analyze_spectrum(build_graph_matrices(bottleneck_graph(bridge_weight=0.05)))
    strong = analyze_spectrum(build_graph_matrices(bottleneck_graph(bridge_weight=2.0)))

    assert weak.algebraic_connectivity is not None
    assert strong.algebraic_connectivity is not None
    assert strong.algebraic_connectivity > weak.algebraic_connectivity


def test_path_graph_has_known_spectrum() -> None:
    mode = np.arange(COMPARISON_NODE_COUNT)
    expected = 2.0 - 2.0 * np.cos(np.pi * mode / COMPARISON_NODE_COUNT)

    assert_allclose(_eigenvalues("path"), expected, atol=1e-10)


def test_complete_graph_has_known_spectrum() -> None:
    expected = np.array([0.0] + [float(COMPARISON_NODE_COUNT)] * (COMPARISON_NODE_COUNT - 1))

    assert_allclose(_eigenvalues("complete"), expected, atol=1e-10)


def test_star_graph_has_known_spectrum() -> None:
    expected = np.array(
        [0.0]
        + [1.0] * (COMPARISON_NODE_COUNT - 2)
        + [float(COMPARISON_NODE_COUNT)]
    )

    assert_allclose(_eigenvalues("star"), expected, atol=1e-10)
