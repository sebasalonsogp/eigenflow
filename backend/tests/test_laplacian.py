import numpy as np
from numpy.testing import assert_allclose

from eigenflow_api.math.graph import Edge, canonicalize_graph
from eigenflow_api.math.laplacian import GraphMatrices, build_graph_matrices


def test_build_graph_matrices_aligns_weighted_values_to_node_order() -> None:
    graph = canonicalize_graph(
        ["c", "a", "b"],
        [Edge("b", "c", 0.5), Edge("b", "a", 2.0)],
    )

    matrices = build_graph_matrices(graph)

    assert matrices.node_order == ("a", "b", "c")
    assert_allclose(
        matrices.adjacency,
        np.array(
            [
                [0.0, 2.0, 0.0],
                [2.0, 0.0, 0.5],
                [0.0, 0.5, 0.0],
            ]
        ),
    )
    assert_allclose(matrices.degree, np.diag([2.0, 2.5, 0.5]))
    assert_allclose(
        matrices.laplacian,
        np.array(
            [
                [2.0, -2.0, 0.0],
                [-2.0, 2.5, -0.5],
                [0.0, -0.5, 0.5],
            ]
        ),
    )


def test_build_graph_matrices_preserves_isolated_nodes() -> None:
    graph = canonicalize_graph(["isolated", "pair-a", "pair-b"], [Edge("pair-a", "pair-b")])

    matrices = build_graph_matrices(graph)

    assert matrices.adjacency.shape == (3, 3)
    assert_allclose(matrices.adjacency[0], np.zeros(3))
    assert_allclose(matrices.degree[0], np.zeros(3))
    assert_allclose(matrices.laplacian[0], np.zeros(3))


def test_graph_matrices_satisfy_laplacian_invariants() -> None:
    graph = canonicalize_graph(
        ["a", "b", "c", "d"],
        [Edge("a", "b", 1.5), Edge("b", "c", 0.75), Edge("c", "d", 3.0)],
    )

    matrices = build_graph_matrices(graph)

    assert isinstance(matrices, GraphMatrices)
    assert_allclose(matrices.adjacency, matrices.adjacency.T)
    assert_allclose(matrices.degree, matrices.degree.T)
    assert_allclose(matrices.laplacian, matrices.laplacian.T)
    assert_allclose(matrices.laplacian.sum(axis=1), np.zeros(4), atol=1e-12)
    assert_allclose(matrices.laplacian, matrices.degree - matrices.adjacency)
