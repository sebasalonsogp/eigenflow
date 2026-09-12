"""Public API schemas."""

from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Deployment health returned to the frontend and container runtime."""

    status: Literal["ok"] = "ok"
    service: Literal["eigenflow-api"] = "eigenflow-api"
