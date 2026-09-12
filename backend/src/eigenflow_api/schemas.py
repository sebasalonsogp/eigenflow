"""Typed request and response contracts at Eigenflow's HTTP boundary."""

from typing import Annotated, Literal, Self

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field
from pydantic.alias_generators import to_camel

from eigenflow_api.analysis import GraphAnalysis
from eigenflow_api.math.graph import MAX_NODES

MAX_EDGES = MAX_NODES * (MAX_NODES - 1) // 2
MAX_NODE_ID_LENGTH = 64
MAX_TIME_SAMPLES = 240


def _reject_boolean(value: object) -> object:
    if isinstance(value, bool):
        raise ValueError("value must be a number, not a boolean")
    return value


FiniteNonnegative = Annotated[
    float,
    BeforeValidator(_reject_boolean),
    Field(ge=0, allow_inf_nan=False),
]
FinitePositive = Annotated[
    float,
    BeforeValidator(_reject_boolean),
    Field(gt=0, allow_inf_nan=False),
]


class ApiModel(BaseModel):
    """Use Python names internally and camelCase on the JSON boundary."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )


class HealthResponse(ApiModel):
    """Deployment health returned to the frontend and container runtime."""

    status: Literal["ok"] = "ok"
    service: Literal["eigenflow-api"] = "eigenflow-api"


class NodeInput(ApiModel):
    """A stable graph node identifier."""

    id: str = Field(min_length=1, max_length=MAX_NODE_ID_LENGTH)


class EdgeInput(ApiModel):
    """One weighted undirected graph edge."""

    source: str = Field(min_length=1, max_length=MAX_NODE_ID_LENGTH)
    target: str = Field(min_length=1, max_length=MAX_NODE_ID_LENGTH)
    weight: FiniteNonnegative = 1.0


class AnalysisRequest(ApiModel):
    """Bounded inputs for one deterministic graph analysis."""

    nodes: list[NodeInput] = Field(min_length=1, max_length=MAX_NODES)
    edges: list[EdgeInput] = Field(default_factory=list, max_length=MAX_EDGES)
    heat_source: str = Field(min_length=1, max_length=MAX_NODE_ID_LENGTH)
    times: list[FiniteNonnegative] = Field(min_length=1, max_length=MAX_TIME_SAMPLES)
    diffusion_coefficient: FinitePositive = 1.0


class NodeResult(ApiModel):
    """A canonical node returned for visualization."""

    id: str


class EdgeResult(ApiModel):
    """A canonical weighted edge returned for visualization."""

    source: str
    target: str
    weight: float


class GraphResult(ApiModel):
    """Canonical graph data in deterministic order."""

    nodes: list[NodeResult]
    edges: list[EdgeResult]


class MatrixResult(ApiModel):
    """Matrices whose row and column indices use the top-level node order."""

    adjacency: list[list[float]]
    degree: list[list[float]]
    laplacian: list[list[float]]


class EigenspaceResult(ApiModel):
    """One numerically repeated eigenvalue and its mode indices."""

    eigenvalue: float
    indices: list[int]
    multiplicity: int


class SpectrumResult(ApiModel):
    """Ordered Laplacian eigenpairs and spectral diagnostics."""

    eigenvalues: list[float]
    eigenvectors: list[list[float]]
    residual_norms: list[float]
    zero_eigenvalue_multiplicity: int
    algebraic_connectivity: float | None
    degenerate_eigenspaces: list[EigenspaceResult]
    tolerance: float


class DiffusionResultSchema(ApiModel):
    """Sampled heat states aligned to the top-level node order."""

    times: list[float]
    states: list[list[float]]
    initial_state: list[float]
    diffusion_coefficient: float


class DiagnosticsResult(ApiModel):
    """End-to-end numerical error summaries."""

    max_eigenpair_residual: float
    max_heat_conservation_error: float


class AnalysisResponse(ApiModel):
    """Cohesive payload consumed by all coordinated frontend views."""

    node_order: list[str]
    graph: GraphResult
    matrices: MatrixResult
    spectrum: SpectrumResult
    diffusion: DiffusionResultSchema
    diagnostics: DiagnosticsResult

    @classmethod
    def from_analysis(cls, analysis: GraphAnalysis) -> Self:
        """Serialize numerical arrays without leaking JSON concerns into the service."""

        return cls.model_validate(
            {
                "node_order": analysis.node_order,
                "graph": {
                    "nodes": [{"id": node_id} for node_id in analysis.node_order],
                    "edges": [
                        {
                            "source": edge.source,
                            "target": edge.target,
                            "weight": edge.weight,
                        }
                        for edge in analysis.graph.edges
                    ],
                },
                "matrices": {
                    "adjacency": analysis.matrices.adjacency.tolist(),
                    "degree": analysis.matrices.degree.tolist(),
                    "laplacian": analysis.matrices.laplacian.tolist(),
                },
                "spectrum": {
                    "eigenvalues": analysis.spectrum.eigenvalues.tolist(),
                    "eigenvectors": analysis.spectrum.eigenvectors.tolist(),
                    "residual_norms": analysis.spectrum.residual_norms,
                    "zero_eigenvalue_multiplicity": (
                        analysis.spectrum.zero_eigenvalue_multiplicity
                    ),
                    "algebraic_connectivity": analysis.spectrum.algebraic_connectivity,
                    "degenerate_eigenspaces": [
                        {
                            "eigenvalue": eigenspace.eigenvalue,
                            "indices": eigenspace.indices,
                            "multiplicity": eigenspace.multiplicity,
                        }
                        for eigenspace in analysis.spectrum.degenerate_eigenspaces
                    ],
                    "tolerance": analysis.spectrum.tolerance,
                },
                "diffusion": {
                    "times": analysis.diffusion.times,
                    "states": analysis.diffusion.states.tolist(),
                    "initial_state": analysis.diffusion.initial_state.tolist(),
                    "diffusion_coefficient": analysis.diffusion.diffusion_coefficient,
                },
                "diagnostics": {
                    "max_eigenpair_residual": (
                        analysis.diagnostics.max_eigenpair_residual
                    ),
                    "max_heat_conservation_error": (
                        analysis.diagnostics.max_heat_conservation_error
                    ),
                },
            }
        )
