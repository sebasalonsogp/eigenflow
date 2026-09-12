"""Sampled heat diffusion over an aligned graph Laplacian spectrum."""

from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from math import isfinite
from numbers import Real

import numpy as np
from numpy.typing import NDArray

from eigenflow_api.math.laplacian import GraphMatrices
from eigenflow_api.math.spectrum import Spectrum


class DiffusionValidationError(ValueError):
    """Raised when a requested heat simulation is outside the supported domain."""


@dataclass(frozen=True, slots=True)
class DiffusionResult:
    """Heat samples with every vector aligned to ``node_order``."""

    node_order: tuple[str, ...]
    times: tuple[float, ...]
    states: NDArray[np.float64]
    initial_state: NDArray[np.float64]
    diffusion_coefficient: float


def simulate_diffusion(
    matrices: GraphMatrices,
    spectrum: Spectrum,
    *,
    initial_state: Mapping[str, Real],
    times: Iterable[Real],
    diffusion_coefficient: Real = 1.0,
) -> DiffusionResult:
    """Evaluate ``exp(-kappa L t) x(0)`` at a bounded collection of times."""

    if matrices.node_order != spectrum.node_order:
        raise DiffusionValidationError("matrices and spectrum must use the same node order")

    if set(initial_state) != set(matrices.node_order):
        raise DiffusionValidationError("initial state keys must exactly match node order")
    initial_values = tuple(initial_state[node_id] for node_id in matrices.node_order)
    if any(not _is_finite_nonnegative(value) for value in initial_values):
        raise DiffusionValidationError("initial state values must be finite nonnegative numbers")

    requested_times = tuple(times)
    if not requested_times:
        raise DiffusionValidationError("times must contain at least one sample")
    if any(not _is_finite_nonnegative(value) for value in requested_times):
        raise DiffusionValidationError("times must be finite nonnegative numbers")
    numeric_times = tuple(float(value) for value in requested_times)
    if any(
        later < earlier
        for earlier, later in zip(numeric_times, numeric_times[1:], strict=False)
    ):
        raise DiffusionValidationError("times must be nondecreasing")

    if (
        not isinstance(diffusion_coefficient, Real)
        or isinstance(diffusion_coefficient, bool)
        or not isfinite(float(diffusion_coefficient))
        or diffusion_coefficient <= 0
    ):
        raise DiffusionValidationError("diffusion coefficient must be a finite positive number")

    initial_vector = np.asarray(initial_values, dtype=np.float64)
    spectral_coefficients = spectrum.eigenvectors.T @ initial_vector
    decay = np.exp(
        -float(diffusion_coefficient)
        * np.outer(np.asarray(numeric_times, dtype=np.float64), spectrum.eigenvalues)
    )
    states = (decay * spectral_coefficients) @ spectrum.eigenvectors.T

    return DiffusionResult(
        node_order=matrices.node_order,
        times=numeric_times,
        states=states,
        initial_state=initial_vector,
        diffusion_coefficient=float(diffusion_coefficient),
    )


def _is_finite_nonnegative(value: object) -> bool:
    return (
        isinstance(value, Real)
        and not isinstance(value, bool)
        and isfinite(float(value))
        and value >= 0
    )
