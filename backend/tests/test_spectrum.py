import numpy as np
import pytest
from numpy.testing import assert_allclose

from eigenflow_api.math.graph import Edge, canonicalize_graph
from eigenflow_api.math.laplacian import GraphMatrices, build_graph_matrices
from eigenflow_api.math.spectrum import NumericalInvariantError, analyze_spectrum


def test_analyze_spectrum_returns_known_path_graph_spectrum() -> None:
    graph = canonicalize_graph(
        ["a", "b", "c"],
        [Edge("a", "b"), Edge("b", "c")],
    )

    spectrum = analyze_spectrum(build_graph_matrices(graph))

    assert spectrum.node_order == ("a", "b", "c")
    assert_allclose(spectrum.eigenvalues, [0.0, 1.0, 3.0], atol=1e-12)
    assert spectrum.algebraic_connectivity == pytest.approx(1.0)
    assert spectrum.zero_eigenvalue_multiplicity == 1
    assert max(spectrum.residual_norms) < 1e-12


def test_analyze_spectrum_stabilizes_eigenvector_signs_for_display() -> None:
    graph = canonicalize_graph(
        ["a", "b", "c", "d"],
        [Edge("a", "b"), Edge("b", "c", 2.0), Edge("c", "d", 3.0)],
    )

    spectrum = analyze_spectrum(build_graph_matrices(graph))

    for column in spectrum.eigenvectors.T:
        pivot = int(np.argmax(np.abs(column)))
        assert column[pivot] >= 0.0


def test_analyze_spectrum_describes_repeated_values_as_eigenspaces() -> None:
    graph = canonicalize_graph(
        ["a", "b", "c", "d"],
        [Edge("a", "b"), Edge("c", "d")],
    )

    spectrum = analyze_spectrum(build_graph_matrices(graph))

    assert_allclose(spectrum.eigenvalues, [0.0, 0.0, 2.0, 2.0], atol=1e-12)
    assert spectrum.zero_eigenvalue_multiplicity == 2
    assert spectrum.algebraic_connectivity == 0.0
    assert [space.indices for space in spectrum.degenerate_eigenspaces] == [
        (0, 1),
        (2, 3),
    ]
    assert [space.multiplicity for space in spectrum.degenerate_eigenspaces] == [2, 2]


def test_analyze_spectrum_snaps_tolerance_level_negative_values_to_zero() -> None:
    laplacian = np.diag([-1e-12, 1.0])
    matrices = GraphMatrices(
        node_order=("a", "b"),
        adjacency=np.zeros((2, 2)),
        degree=np.zeros((2, 2)),
        laplacian=laplacian,
    )

    spectrum = analyze_spectrum(matrices, tolerance=1e-10)

    assert_allclose(spectrum.eigenvalues, [0.0, 1.0])
    assert spectrum.zero_eigenvalue_multiplicity == 1


def test_analyze_spectrum_rejects_materially_negative_eigenvalues() -> None:
    laplacian = np.diag([-1e-4, 1.0])
    matrices = GraphMatrices(
        node_order=("a", "b"),
        adjacency=np.zeros((2, 2)),
        degree=np.zeros((2, 2)),
        laplacian=laplacian,
    )

    with pytest.raises(NumericalInvariantError, match="negative eigenvalue"):
        analyze_spectrum(matrices, tolerance=1e-10)


@pytest.mark.parametrize("tolerance", [0.0, -1.0, np.nan, np.inf])
def test_analyze_spectrum_rejects_invalid_tolerance(tolerance: float) -> None:
    graph = canonicalize_graph(["only"], [])

    with pytest.raises(ValueError, match="finite positive number"):
        analyze_spectrum(build_graph_matrices(graph), tolerance=tolerance)


def test_analyze_spectrum_has_no_algebraic_connectivity_for_single_node() -> None:
    graph = canonicalize_graph(["only"], [])

    spectrum = analyze_spectrum(build_graph_matrices(graph))

    assert_allclose(spectrum.eigenvalues, [0.0])
    assert spectrum.algebraic_connectivity is None
