"""Symmetric Laplacian eigendecomposition and numerical diagnostics."""

from dataclasses import dataclass
from math import isfinite

import numpy as np
from numpy.typing import NDArray

from eigenflow_api.math.laplacian import GraphMatrices

DEFAULT_TOLERANCE = 1e-10


class NumericalInvariantError(RuntimeError):
    """Raised when a computed result violates a required numerical property."""


@dataclass(frozen=True, slots=True)
class Eigenspace:
    """Indices belonging to one numerically repeated eigenvalue."""

    eigenvalue: float
    indices: tuple[int, ...]

    @property
    def multiplicity(self) -> int:
        return len(self.indices)


@dataclass(frozen=True, slots=True)
class Spectrum:
    """Laplacian eigenpairs and the diagnostics needed for interpretation."""

    node_order: tuple[str, ...]
    eigenvalues: NDArray[np.float64]
    eigenvectors: NDArray[np.float64]
    residual_norms: tuple[float, ...]
    zero_eigenvalue_multiplicity: int
    algebraic_connectivity: float | None
    degenerate_eigenspaces: tuple[Eigenspace, ...]
    tolerance: float


def analyze_spectrum(
    matrices: GraphMatrices,
    *,
    tolerance: float = DEFAULT_TOLERANCE,
) -> Spectrum:
    """Compute ordered symmetric eigenpairs and stable presentation metadata."""

    if not isfinite(tolerance) or tolerance <= 0:
        raise ValueError("tolerance must be a finite positive number")

    eigenvalues, eigenvectors = np.linalg.eigh(matrices.laplacian)
    minimum_eigenvalue = float(eigenvalues[0])
    if minimum_eigenvalue < -tolerance:
        raise NumericalInvariantError(
            "Laplacian produced a materially negative eigenvalue: "
            f"{minimum_eigenvalue:.6g}"
        )

    eigenvalues = eigenvalues.astype(np.float64, copy=True)
    eigenvalues[np.abs(eigenvalues) <= tolerance] = 0.0
    eigenvectors = _stabilize_eigenvector_signs(eigenvectors)
    residual_norms = tuple(
        float(np.linalg.norm(matrices.laplacian @ vector - eigenvalue * vector))
        for eigenvalue, vector in zip(eigenvalues, eigenvectors.T, strict=True)
    )
    zero_multiplicity = int(np.count_nonzero(eigenvalues == 0.0))

    return Spectrum(
        node_order=matrices.node_order,
        eigenvalues=eigenvalues,
        eigenvectors=eigenvectors,
        residual_norms=residual_norms,
        zero_eigenvalue_multiplicity=zero_multiplicity,
        algebraic_connectivity=float(eigenvalues[1]) if len(eigenvalues) > 1 else None,
        degenerate_eigenspaces=_find_degenerate_eigenspaces(eigenvalues, tolerance),
        tolerance=tolerance,
    )


def _stabilize_eigenvector_signs(
    eigenvectors: NDArray[np.float64],
) -> NDArray[np.float64]:
    stabilized = eigenvectors.astype(np.float64, copy=True)
    for column_index in range(stabilized.shape[1]):
        column = stabilized[:, column_index]
        pivot_index = int(np.argmax(np.abs(column)))
        if column[pivot_index] < 0:
            stabilized[:, column_index] *= -1.0
    return stabilized


def _find_degenerate_eigenspaces(
    eigenvalues: NDArray[np.float64], tolerance: float
) -> tuple[Eigenspace, ...]:
    groups: list[Eigenspace] = []
    group_start = 0

    for index in range(1, len(eigenvalues) + 1):
        at_end = index == len(eigenvalues)
        value_changed = (
            not at_end
            and abs(eigenvalues[index] - eigenvalues[group_start]) > tolerance
        )
        if not at_end and not value_changed:
            continue

        indices = tuple(range(group_start, index))
        if len(indices) > 1:
            groups.append(Eigenspace(eigenvalue=float(eigenvalues[group_start]), indices=indices))
        group_start = index

    return tuple(groups)
