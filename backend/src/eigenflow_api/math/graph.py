"""Validated graph primitives shared by Eigenflow's numerical routines."""

from collections.abc import Iterable
from dataclasses import dataclass
from math import isfinite
from numbers import Real

MAX_NODES = 30


class GraphValidationError(ValueError):
    """Raised when graph data falls outside Eigenflow's supported domain."""


@dataclass(frozen=True, slots=True)
class Edge:
    """A weighted undirected edge before or after canonicalization."""

    source: str
    target: str
    weight: float = 1.0


@dataclass(frozen=True, slots=True)
class CanonicalGraph:
    """A validated graph with deterministic node and edge ordering."""

    node_order: tuple[str, ...]
    edges: tuple[Edge, ...]


def canonicalize_graph(node_ids: Iterable[str], edges: Iterable[Edge]) -> CanonicalGraph:
    """Validate and normalize a graph for deterministic numerical analysis."""

    nodes = tuple(node_ids)
    if not nodes:
        raise GraphValidationError("graph must contain at least one node")
    if len(nodes) > MAX_NODES:
        raise GraphValidationError(f"graph supports at most {MAX_NODES} nodes")
    if any(not isinstance(node_id, str) for node_id in nodes):
        raise GraphValidationError("node IDs must be strings")
    if any(not node_id.strip() for node_id in nodes):
        raise GraphValidationError("node IDs must be non-empty")
    if len(set(nodes)) != len(nodes):
        raise GraphValidationError("node IDs must be unique")

    node_order = tuple(sorted(nodes))
    node_set = set(node_order)
    normalized_edges: list[Edge] = []
    seen_pairs: set[tuple[str, str]] = set()

    for edge in edges:
        if not isinstance(edge, Edge):
            raise GraphValidationError("edges must be Edge instances")
        if edge.source == edge.target:
            raise GraphValidationError(f"self-loop is not supported: {edge.source!r}")
        if edge.source not in node_set or edge.target not in node_set:
            raise GraphValidationError(
                f"edge references an unknown node: {edge.source!r} -- {edge.target!r}"
            )
        if (
            not isinstance(edge.weight, Real)
            or isinstance(edge.weight, bool)
            or not isfinite(float(edge.weight))
            or edge.weight < 0
        ):
            raise GraphValidationError("edge weight must be a finite nonnegative number")

        source, target = sorted((edge.source, edge.target))
        pair = (source, target)
        if pair in seen_pairs:
            raise GraphValidationError(f"duplicate undirected edge: {source!r} -- {target!r}")
        seen_pairs.add(pair)
        normalized_edges.append(Edge(source, target, float(edge.weight)))

    normalized_edges.sort(key=lambda edge: (edge.source, edge.target))
    return CanonicalGraph(node_order=node_order, edges=tuple(normalized_edges))
