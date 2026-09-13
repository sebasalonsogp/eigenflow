"""Benchmark the analysis API at Eigenflow's documented support boundary."""

from __future__ import annotations

import argparse
import gzip
import json
import math
import os
import platform
import statistics
import time
import urllib.request
from typing import Any

DEFAULT_BASE_URL = os.environ.get(
    "EIGENFLOW_BASE_URL",
    "http://127.0.0.1:8000",
).rstrip("/")
REQUEST_TIMEOUT_SECONDS = 30


def create_supported_boundary_request() -> dict[str, Any]:
    """Create a deterministic 30-node, 435-edge, 240-sample request."""

    node_ids = [f"node-{index}" for index in range(30)]
    return {
        "nodes": [{"id": node_id} for node_id in node_ids],
        "edges": [
            {
                "source": node_ids[source_index],
                "target": node_ids[target_index],
                "weight": 1.0 + ((source_index + target_index) % 7) * 0.05,
            }
            for source_index in range(len(node_ids))
            for target_index in range(source_index + 1, len(node_ids))
        ],
        "heatSource": node_ids[0],
        "times": [8.0 * index / 239 for index in range(240)],
        "diffusionCoefficient": 1.0,
    }


def nearest_rank_percentile(samples: list[float], percentile: float) -> float:
    if not samples:
        raise ValueError("at least one sample is required")
    if not 0 < percentile <= 1:
        raise ValueError("percentile must be in the interval (0, 1]")

    ordered = sorted(samples)
    return ordered[math.ceil(percentile * len(ordered)) - 1]


def _post_analysis(
    base_url: str, request_body: bytes
) -> tuple[float, bytes, bytes, str]:
    request = urllib.request.Request(
        f"{base_url}/api/analysis",
        data=request_body,
        headers={
            "Accept-Encoding": "gzip",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    started = time.perf_counter()
    with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        transfer_body = response.read()
        content_encoding = response.headers.get("Content-Encoding", "identity")
    elapsed_ms = (time.perf_counter() - started) * 1000
    response_body = (
        gzip.decompress(transfer_body) if content_encoding == "gzip" else transfer_body
    )
    return elapsed_ms, transfer_body, response_body, content_encoding


def run_benchmark(base_url: str, warmups: int, samples: int) -> dict[str, Any]:
    if warmups < 0 or samples < 1:
        raise ValueError("warmups must be nonnegative and samples must be positive")

    request = create_supported_boundary_request()
    request_body = json.dumps(request, separators=(",", ":")).encode()

    for _ in range(warmups):
        _post_analysis(base_url, request_body)

    timings: list[float] = []
    transfer_body = b""
    response_body = b""
    content_encoding = "identity"
    for _ in range(samples):
        elapsed_ms, transfer_body, response_body, content_encoding = _post_analysis(
            base_url,
            request_body,
        )
        timings.append(elapsed_ms)

    response = json.loads(response_body)
    assert len(response["nodeOrder"]) == 30
    assert len(response["graph"]["edges"]) == 435
    assert len(response["diffusion"]["states"]) == 240

    return {
        "environment": {
            "platform": platform.platform(),
            "python": platform.python_version(),
        },
        "endpoint": f"{base_url}/api/analysis",
        "boundary": {
            "nodes": 30,
            "edges": 435,
            "timeSamples": 240,
        },
        "runs": {"warmups": warmups, "samples": samples},
        "latencyMs": {
            "minimum": round(min(timings), 3),
            "median": round(statistics.median(timings), 3),
            "p95": round(nearest_rank_percentile(timings, 0.95), 3),
            "maximum": round(max(timings), 3),
        },
        "payloadBytes": {
            "request": len(request_body),
            "response": len(response_body),
            "transferred": len(transfer_body),
            "contentEncoding": content_encoding,
        },
        "samplesMs": [round(timing, 3) for timing in timings],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--warmups", type=int, default=3)
    parser.add_argument("--samples", type=int, default=20)
    arguments = parser.parse_args()

    result = run_benchmark(
        arguments.base_url.rstrip("/"),
        arguments.warmups,
        arguments.samples,
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
