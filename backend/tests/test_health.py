import pytest
from httpx2 import ASGITransport, AsyncClient

from eigenflow_api.main import app


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.mark.anyio
async def test_health_endpoint_reports_ready() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "eigenflow-api"}


@pytest.mark.anyio
async def test_responses_include_browser_security_headers() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/health")

    assert response.headers["content-security-policy"] == (
        "default-src 'self'; base-uri 'none'; connect-src 'self'; font-src 'self'; "
        "form-action 'none'; frame-ancestors 'none'; img-src 'self' data:; "
        "object-src 'none'; script-src 'self'; style-src 'self'"
    )
    assert response.headers["permissions-policy"] == (
        "camera=(), geolocation=(), microphone=()"
    )
    assert response.headers["referrer-policy"] == "no-referrer"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"


@pytest.mark.anyio
async def test_openapi_reports_release_version() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/openapi.json")

    assert response.status_code == 200
    assert response.json()["info"]["version"] == "1.0.0"
