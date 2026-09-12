"""Deterministic graph fixtures for Eigenflow's curated experiments."""

from collections.abc import Sequence

from eigenflow_api.math.graph import CanonicalGraph, Edge, canonicalize_graph

BOTTLENECK_COMMUNITY_SIZE = 4
COMPARISON_NODE_COUNT = 6
DEFAULT_BRIDGE_WEIGHT = 0.1


def bottleneck_graph(bridge_weight: float = DEFAULT_BRIDGE_WEIGHT) -> CanonicalGraph:
    """Return two four-node cliques connected by one weighted bridge."""

    left = tuple(f"left-{index}" for index in range(BOTTLENECK_COMMUNITY_SIZE))
    right = tuple(f"right-{index}" for index in range(BOTTLENECK_COMMUNITY_SIZE))
    edges = [
        *_clique_edges(left),
        *_clique_edges(right),
        Edge(left[-1], right[0], bridge_weight),
    ]
    return canonicalize_graph((*left, *right), edges)


def path_graph() -> CanonicalGraph:
    """Return a six-node unweighted path."""

    nodes = tuple(f"node-{index}" for index in range(COMPARISON_NODE_COUNT))
    edges = [Edge(nodes[index], nodes[index + 1]) for index in range(len(nodes) - 1)]
    return canonicalize_graph(nodes, edges)


def complete_graph() -> CanonicalGraph:
    """Return a six-node unweighted complete graph."""

    nodes = tuple(f"node-{index}" for index in range(COMPARISON_NODE_COUNT))
    return canonicalize_graph(nodes, _clique_edges(nodes))


def star_graph() -> CanonicalGraph:
    """Return an unweighted star with one hub and five leaves."""

    leaves = tuple(f"leaf-{index}" for index in range(COMPARISON_NODE_COUNT - 1))
    edges = [Edge("hub", leaf) for leaf in leaves]
    return canonicalize_graph(("hub", *leaves), edges)


def _clique_edges(nodes: Sequence[str]) -> list[Edge]:
    return [
        Edge(source, target)
        for source_index, source in enumerate(nodes)
        for target in nodes[source_index + 1 :]
    ]
