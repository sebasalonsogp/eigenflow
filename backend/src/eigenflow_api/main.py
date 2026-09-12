"""FastAPI application entry point."""

import os
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from eigenflow_api.schemas import HealthResponse

app = FastAPI(
    title="Eigenflow API",
    description="Scientific-computing backend for interactive spectral diffusion.",
    version="0.1.0",
)


@app.get("/api/health", response_model=HealthResponse, tags=["operations"])
def health() -> HealthResponse:
    """Confirm that the API process is ready to accept requests."""

    return HealthResponse()


static_directory = Path(os.getenv("EIGENFLOW_STATIC_DIR", "static"))
if static_directory.is_dir():
    # Registered after API routes so the SPA cannot shadow /api/*.
    app.mount("/", StaticFiles(directory=static_directory, html=True), name="frontend")


def run() -> None:
    """Run the API through the installed console script."""

    uvicorn.run("eigenflow_api.main:app", host="0.0.0.0", port=8000, reload=False)
