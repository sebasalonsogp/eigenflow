"""FastAPI application entry point."""

import os
from collections.abc import Awaitable, Callable
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from eigenflow_api.analysis import AnalysisValidationError, analyze_graph
from eigenflow_api.math.diffusion import DiffusionValidationError
from eigenflow_api.math.graph import Edge, GraphValidationError
from eigenflow_api.schemas import AnalysisRequest, AnalysisResponse, HealthResponse

app = FastAPI(
    title="Eigenflow API",
    description="Scientific-computing backend for interactive spectral diffusion.",
    version="0.1.0",
)
app.add_middleware(GZipMiddleware, minimum_size=1000, compresslevel=5)

SECURITY_HEADERS = {
    "Content-Security-Policy": (
        "default-src 'self'; base-uri 'none'; connect-src 'self'; font-src 'self'; "
        "form-action 'none'; frame-ancestors 'none'; img-src 'self' data:; "
        "object-src 'none'; script-src 'self'; style-src 'self'"
    ),
    "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
}


@app.middleware("http")
async def add_security_headers(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """Apply one conservative browser policy to API and frontend responses."""

    response = await call_next(request)
    response.headers.update(SECURITY_HEADERS)
    return response


@app.get("/api/health", response_model=HealthResponse, tags=["operations"])
def health() -> HealthResponse:
    """Confirm that the API process is ready to accept requests."""

    return HealthResponse()


@app.post("/api/analysis", response_model=AnalysisResponse, tags=["analysis"])
def analysis(request: AnalysisRequest) -> AnalysisResponse:
    """Analyze a bounded weighted graph and sample heat diffusion over it."""

    try:
        result = analyze_graph(
            (node.id for node in request.nodes),
            (Edge(edge.source, edge.target, edge.weight) for edge in request.edges),
            heat_source=request.heat_source,
            times=request.times,
            diffusion_coefficient=request.diffusion_coefficient,
        )
    except GraphValidationError as error:
        _raise_validation_error("graph", "graph_validation", error)
    except AnalysisValidationError as error:
        _raise_validation_error("heatSource", "analysis_validation", error)
    except DiffusionValidationError as error:
        location = (
            "diffusionCoefficient"
            if str(error).startswith("diffusion coefficient")
            else "times"
        )
        _raise_validation_error(location, "diffusion_validation", error)

    return AnalysisResponse.from_analysis(result)


def _raise_validation_error(location: str, error_type: str, error: ValueError) -> None:
    raise HTTPException(
        status_code=422,
        detail=[
            {
                "type": error_type,
                "loc": ["body", location],
                "msg": str(error),
            }
        ],
    ) from error


static_directory = Path(os.getenv("EIGENFLOW_STATIC_DIR", "static"))
if static_directory.is_dir():
    # Registered after API routes so the SPA cannot shadow /api/*.
    app.mount("/", StaticFiles(directory=static_directory, html=True), name="frontend")


def run() -> None:
    """Run the API through the installed console script."""

    uvicorn.run("eigenflow_api.main:app", host="0.0.0.0", port=8000, reload=False)
