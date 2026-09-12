import pytest
from httpx2 import ASGITransport, AsyncClient

from eigenflow_api.main import app
from eigenflow_api.math.fixtures import bottleneck_graph


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


def _bottleneck_payload() -> dict[str, object]:
    graph = bottleneck_graph(bridge_weight=0.1)
    return {
        "nodes": [{"id": node_id} for node_id in reversed(graph.node_order)],
        "edges": [
            {"source": edge.source, "target": edge.target, "weight": edge.weight}
            for edge in reversed(graph.edges)
        ],
        "heatSource": "left-0",
        "times": [0.0, 1.0, 8.0],
        "diffusionCoefficient": 0.75,
    }


@pytest.mark.anyio
async def test_analysis_endpoint_returns_one_aligned_typed_payload() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post("/api/analysis", json=_bottleneck_payload())

    assert response.status_code == 200
    payload = response.json()
    expected_order = [
        *(f"left-{index}" for index in range(4)),
        *(f"right-{index}" for index in range(4)),
    ]
    assert payload["nodeOrder"] == expected_order
    assert [node["id"] for node in payload["graph"]["nodes"]] == expected_order
    assert len(payload["graph"]["edges"]) == 13
    assert len(payload["matrices"]["laplacian"]) == len(expected_order)
    assert all(len(row) == len(expected_order) for row in payload["matrices"]["laplacian"])
    assert len(payload["spectrum"]["eigenvalues"]) == len(expected_order)
    assert payload["spectrum"]["algebraicConnectivity"] > 0
    assert payload["diffusion"]["times"] == [0.0, 1.0, 8.0]
    assert len(payload["diffusion"]["states"]) == 3
    assert payload["diagnostics"]["maxEigenpairResidual"] < 1e-10
    assert payload["diagnostics"]["maxHeatConservationError"] < 1e-10


@pytest.mark.anyio
async def test_analysis_endpoint_returns_actionable_graph_validation_errors() -> None:
    payload = _bottleneck_payload()
    payload["edges"] = [
        {"source": "left-0", "target": "left-0", "weight": 1.0},
    ]
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post("/api/analysis", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"] == [
        {
            "type": "graph_validation",
            "loc": ["body", "graph"],
            "msg": "self-loop is not supported: 'left-0'",
        }
    ]


@pytest.mark.anyio
async def test_analysis_endpoint_rejects_unknown_heat_source_with_field_location() -> None:
    payload = _bottleneck_payload()
    payload["heatSource"] = "missing"
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post("/api/analysis", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "heatSource"]
    assert "must reference a node" in response.json()["detail"][0]["msg"]


@pytest.mark.anyio
async def test_analysis_endpoint_enforces_node_and_time_bounds() -> None:
    payload = _bottleneck_payload()
    payload["nodes"] = [{"id": f"node-{index}"} for index in range(31)]
    payload["times"] = [float(index) for index in range(241)]
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post("/api/analysis", json=payload)

    assert response.status_code == 422
    locations = {tuple(error["loc"]) for error in response.json()["detail"]}
    assert ("body", "nodes") in locations
    assert ("body", "times") in locations


@pytest.mark.anyio
async def test_analysis_endpoint_does_not_coerce_booleans_into_edge_weights() -> None:
    payload = _bottleneck_payload()
    payload["edges"] = [{"source": "left-0", "target": "left-1", "weight": True}]
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post("/api/analysis", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "edges", 0, "weight"]
