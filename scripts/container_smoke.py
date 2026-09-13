"""Verify Eigenflow's production container through its public HTTP surface."""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from typing import Any

BASE_URL = os.environ.get("EIGENFLOW_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
REQUEST_TIMEOUT_SECONDS = 5
STARTUP_ATTEMPTS = 30

ANALYSIS_REQUEST = {
    "nodes": [{"id": "a"}, {"id": "b"}],
    "edges": [{"source": "a", "target": "b", "weight": 1.0}],
    "heatSource": "a",
    "times": [0.0, 0.5, 1.0],
    "diffusionCoefficient": 1.0,
}


def _request(path: str, payload: dict[str, Any] | None = None) -> tuple[int, bytes]:
    body = json.dumps(payload).encode() if payload is not None else None
    request = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=body,
        headers={"Content-Type": "application/json"} if body is not None else {},
        method="POST" if body is not None else "GET",
    )
    with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        return response.status, response.read()


def _wait_until_ready() -> dict[str, Any]:
    last_error: Exception | None = None
    for _ in range(STARTUP_ATTEMPTS):
        try:
            status, body = _request("/api/health")
            health = json.loads(body)
            if status == 200 and health == {"status": "ok", "service": "eigenflow-api"}:
                return health
            last_error = RuntimeError(
                f"GET /api/health returned status {status} with body {health!r}"
            )
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            last_error = error
        time.sleep(1)

    raise RuntimeError(f"container did not become ready at {BASE_URL}: {last_error}")


def main() -> None:
    health = _wait_until_ready()
    print(f"[smoke] health ready: {health['service']}", flush=True)

    status, body = _request("/")
    page = body.decode()
    assert status == 200, f"GET / returned {status}"
    assert "<title>Eigenflow" in page, "GET / did not return the Eigenflow application"
    print("[smoke] frontend served from production image", flush=True)

    status, body = _request("/api/analysis", ANALYSIS_REQUEST)
    analysis = json.loads(body)
    assert status == 200, f"POST /api/analysis returned {status}"
    assert analysis["nodeOrder"] == ["a", "b"], (
        f"unexpected analysis node order: {analysis['nodeOrder']!r}"
    )
    state_count = len(analysis["diffusion"]["states"])
    assert state_count == len(ANALYSIS_REQUEST["times"]), (
        f"expected three diffusion states, received {state_count}"
    )
    connectivity = analysis["spectrum"]["algebraicConnectivity"]
    assert connectivity > 0, (
        f"expected positive algebraic connectivity, received {connectivity}"
    )
    print("[smoke] numerical analysis completed through public API", flush=True)


if __name__ == "__main__":
    main()
