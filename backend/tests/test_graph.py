import math

import pytest

from eigenflow_api.math.graph import (
    MAX_NODES,
    CanonicalGraph,
    Edge,
    GraphValidationError,
    canonicalize_graph,
)


def test_canonicalize_graph_normalizes_node_and_edge_order() -> None:
    graph = canonicalize_graph(
        ["right", "bridge", "left"],
        [
            Edge("right", "bridge", 0.25),
            Edge("bridge", "left", 2.0),
        ],
    )

    assert graph == CanonicalGraph(
        node_order=("bridge", "left", "right"),
        edges=(
            Edge("bridge", "left", 2.0),
            Edge("bridge", "right", 0.25),
        ),
    )


def test_canonicalize_graph_accepts_isolated_nodes_and_zero_weight_edges() -> None:
    graph = canonicalize_graph(
        ["isolated", "source", "target"],
        [Edge("target", "source", 0.0)],
    )

    assert graph.node_order == ("isolated", "source", "target")
    assert graph.edges == (Edge("source", "target", 0.0),)


@pytest.mark.parametrize(
    ("nodes", "message"),
    [
        ([], "at least one node"),
        ([1], "strings"),
        (["a", "a"], "unique"),
        ([""], "non-empty"),
        (["  "], "non-empty"),
        (["a"] * (MAX_NODES + 1), f"at most {MAX_NODES}"),
    ],
)
def test_canonicalize_graph_rejects_invalid_node_sets(
    nodes: list[object], message: str
) -> None:
    with pytest.raises(GraphValidationError, match=message):
        canonicalize_graph(nodes, [])


def test_canonicalize_graph_rejects_untyped_edges() -> None:
    with pytest.raises(GraphValidationError, match="Edge instances"):
        canonicalize_graph(["a"], [None])


@pytest.mark.parametrize(
    ("edge", "message"),
    [
        (Edge("a", "a"), "self-loop"),
        (Edge("a", "missing"), "unknown node"),
    ],
)
def test_canonicalize_graph_rejects_invalid_endpoints(edge: Edge, message: str) -> None:
    with pytest.raises(GraphValidationError, match=message):
        canonicalize_graph(["a", "b"], [edge])


def test_canonicalize_graph_rejects_duplicate_undirected_edges() -> None:
    with pytest.raises(GraphValidationError, match="duplicate undirected edge"):
        canonicalize_graph(
            ["a", "b"],
            [Edge("a", "b", 1.0), Edge("b", "a", 2.0)],
        )


@pytest.mark.parametrize("weight", [-1.0, math.inf, -math.inf, math.nan, True])
def test_canonicalize_graph_rejects_invalid_weights(weight: float) -> None:
    with pytest.raises(GraphValidationError, match="finite nonnegative number"):
        canonicalize_graph(["a", "b"], [Edge("a", "b", weight)])
