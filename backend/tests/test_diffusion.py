import numpy as np
import pytest

from eigenflow_api.math.diffusion import DiffusionValidationError, simulate_diffusion
from eigenflow_api.math.graph import Edge, canonicalize_graph
from eigenflow_api.math.laplacian import build_graph_matrices
from eigenflow_api.math.spectrum import analyze_spectrum


def _system(node_ids: list[str], edges: list[Edge]):
    matrices = build_graph_matrices(canonicalize_graph(node_ids, edges))
    return matrices, analyze_spectrum(matrices)


def test_samples_align_with_node_order_and_requested_times() -> None:
    matrices, spectrum = _system(["b", "a", "c"], [Edge("a", "b"), Edge("b", "c")])

    result = simulate_diffusion(
        matrices,
        spectrum,
        initial_state={"a": 3.0, "b": 0.0, "c": 0.0},
        times=[0.0, 0.5, 2.0],
    )

    assert result.node_order == ("a", "b", "c")
    assert result.times == (0.0, 0.5, 2.0)
    np.testing.assert_allclose(result.initial_state, [3.0, 0.0, 0.0])
    np.testing.assert_allclose(result.states[0], result.initial_state, atol=1e-12)
    assert result.states.shape == (3, 3)


def test_heat_is_conserved_and_converges_to_connected_equilibrium() -> None:
    matrices, spectrum = _system(
        ["a", "b", "c"],
        [Edge("a", "b", 2.0), Edge("b", "c", 0.5)],
    )

    result = simulate_diffusion(
        matrices,
        spectrum,
        initial_state={"a": 6.0, "b": 0.0, "c": 0.0},
        times=[0.0, 1.0, 100.0],
    )

    np.testing.assert_allclose(result.states.sum(axis=1), 6.0, atol=1e-10)
    np.testing.assert_allclose(result.states[-1], [2.0, 2.0, 2.0], atol=1e-10)


def test_disconnected_components_converge_to_their_own_equilibria() -> None:
    matrices, spectrum = _system(
        ["a", "b", "c", "d"],
        [Edge("a", "b"), Edge("c", "d")],
    )

    result = simulate_diffusion(
        matrices,
        spectrum,
        initial_state={"a": 4.0, "b": 0.0, "c": 2.0, "d": 6.0},
        times=[100.0],
    )

    np.testing.assert_allclose(result.states[0], [2.0, 2.0, 4.0, 4.0], atol=1e-10)


@pytest.mark.parametrize(
    ("initial_state", "times", "coefficient", "message"),
    [
        ({"a": 1.0}, [0.0], 1.0, "exactly match node order"),
        ({"a": 1.0, "b": float("nan")}, [0.0], 1.0, "finite nonnegative"),
        ({"a": -1.0, "b": 1.0}, [0.0], 1.0, "finite nonnegative"),
        ({"a": 1.0, "b": 0.0}, [], 1.0, "at least one"),
        ({"a": 1.0, "b": 0.0}, [1.0, 0.0], 1.0, "nondecreasing"),
        ({"a": 1.0, "b": 0.0}, [-1.0], 1.0, "finite nonnegative"),
        ({"a": 1.0, "b": 0.0}, [0.0], 0.0, "finite positive"),
    ],
)
def test_invalid_inputs_are_rejected(
    initial_state: dict[str, float],
    times: list[float],
    coefficient: float,
    message: str,
) -> None:
    matrices, spectrum = _system(["a", "b"], [Edge("a", "b")])

    with pytest.raises(DiffusionValidationError, match=message):
        simulate_diffusion(
            matrices,
            spectrum,
            initial_state=initial_state,
            times=times,
            diffusion_coefficient=coefficient,
        )


def test_rejects_spectrum_from_a_different_node_order() -> None:
    matrices, _ = _system(["a", "b"], [Edge("a", "b")])
    _, mismatched_spectrum = _system(["x", "y"], [Edge("x", "y")])

    with pytest.raises(DiffusionValidationError, match="same node order"):
        simulate_diffusion(
            matrices,
            mismatched_spectrum,
            initial_state={"a": 1.0, "b": 0.0},
            times=[0.0],
        )
