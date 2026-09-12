"""Matrix construction for validated weighted undirected graphs."""

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from eigenflow_api.math.graph import CanonicalGraph


@dataclass(frozen=True, slots=True)
class GraphMatrices:
    """Aligned adjacency, degree, and combinatorial Laplacian matrices."""

    node_order: tuple[str, ...]
    adjacency: NDArray[np.float64]
    degree: NDArray[np.float64]
    laplacian: NDArray[np.float64]


def build_graph_matrices(graph: CanonicalGraph) -> GraphMatrices:
    """Construct ``A``, ``D``, and ``L = D - A`` for a canonical graph."""

    size = len(graph.node_order)
    adjacency = np.zeros((size, size), dtype=np.float64)
    node_indices = {node_id: index for index, node_id in enumerate(graph.node_order)}

    for edge in graph.edges:
        source = node_indices[edge.source]
        target = node_indices[edge.target]
        adjacency[source, target] = edge.weight
        adjacency[target, source] = edge.weight

    degree = np.diag(adjacency.sum(axis=1))
    laplacian = degree - adjacency
    return GraphMatrices(
        node_order=graph.node_order,
        adjacency=adjacency,
        degree=degree,
        laplacian=laplacian,
    )
