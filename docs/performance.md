# Supported-boundary performance

## Decision

Eigenflow remains responsive at its supported maximum of 30 nodes. The measured
analysis latency and browser frame cadence do not justify web workers, response
caching, or another numerical solver. The one demonstrated bottleneck was wire
size: the production JavaScript was served uncompressed. FastAPI gzip middleware
reduced that transfer by 68.4%, so that focused optimization was retained.

These results are a local engineering baseline, not a universal service-level
agreement. Deterministic build-size limits are enforced in CI; timing is captured
for comparison without making shared-runner variance a flaky gate.

## Supported boundary

The benchmark deliberately combines the largest accepted inputs:

- 30 nodes;
- all 435 possible undirected edges;
- 240 requested diffusion samples; and
- one complete analysis response containing graph, matrix, spectrum, diagnostics,
  and diffusion data.

## Test environment

Measurements were recorded on 2026-09-13 with:

- Windows 11 build 22631, 64-bit;
- 12th Gen Intel Core i7-12700K;
- Docker Desktop with Compose 5.5.1 and the production `python:3.12-slim` image;
- Python 3.12.14 for the benchmark client;
- Node.js 26.1.0 and npm 11.13.0 for local tooling; the production frontend build
  uses the pinned Node 24 Docker stage; and
- Playwright 1.63.0 with headless Chromium 153.0.8010.12 at 1280 x 720.

The machine was otherwise in normal development use. Runs were sequential so that
parallel local jobs did not distort latency.

## Reproduce

From the repository root in PowerShell:

```powershell
docker compose up --detach --build

# Run this command three times, sequentially.
python scripts/benchmark_analysis.py

cd frontend
$env:EIGENFLOW_E2E_BASE_URL = "http://127.0.0.1:8000"

# Run this command three times, sequentially.
npm run test:e2e -- performance.spec.ts

# Build and check compressed bundle budgets.
npm run size

Remove-Item Env:EIGENFLOW_E2E_BASE_URL
cd ..
docker compose down
```

The API benchmark uses three warmups and 20 measured requests by default. It emits
JSON with every timing, the input boundary, environment, decoded payload size, and
transferred payload size. The browser test prints and attaches a JSON performance
capture while exercising the production application.

## Results

### Analysis API

Each row is one sequential execution against the production container.

| Run | Median | p95 | Minimum | Maximum |
| --- | ---: | ---: | ---: | ---: |
| 1 | 12.456 ms | 20.745 ms | 7.660 ms | 21.297 ms |
| 2 | 10.889 ms | 14.396 ms | 7.580 ms | 36.373 ms |
| 3 | 10.078 ms | 28.783 ms | 7.480 ms | 45.419 ms |

Across these runs, median latency was 10.08–12.46 ms and p95 latency was
14.40–28.78 ms. The request was 27,918 bytes. Each response was 207,868 decoded
bytes and 19,996 transferred bytes with gzip.

### Browser interaction and animation

Each row is one sequential Chromium execution against the production container.
Interaction measures bridge-slider input through visible value feedback. Animation
samples `requestAnimationFrame` intervals for two seconds during diffusion playback.

| Run | Interaction | Average FPS | Frame p95 | Maximum frame | Frames over 34 ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 38.3 ms | 60.002 | 16.8 ms | 16.8 ms | 0% |
| 2 | 32.9 ms | 60.002 | 16.7 ms | 16.8 ms | 0% |
| 3 | 31.7 ms | 60.002 | 16.7 ms | 16.8 ms | 0% |

All three runs rendered 121 sampled frames, stayed at the display's approximately
60 Hz cadence, and produced no browser console warnings, errors, or page errors.

### Production build size

`npm run size` builds the frontend, then applies Brotli-compressed budgets through
Size Limit.

| Asset | Raw | Vite gzip estimate | Size Limit Brotli | CI budget |
| --- | ---: | ---: | ---: | ---: |
| JavaScript | 301.36 kB | 95.49 kB | 81.17 kB | 105 kB |
| CSS | 17.57 kB | 3.92 kB | 3.39 kB | 5 kB |

The limits apply the Size Limit project's suggested approximately 25% baseline
headroom and round upward to readable values. CI fails when either budget is
exceeded.

## Optimization evidence

Before gzip, requesting the production JavaScript with `Accept-Encoding: gzip, br`
still transferred all 301,361 bytes and returned no `Content-Encoding`. After the
middleware change, five repeated requests each transferred 95,350 bytes with
`Content-Encoding: gzip`: 206,011 fewer bytes, or a 68.4% reduction.

The app uses FastAPI's documented `GZipMiddleware` at compression level 5 for
responses of at least 1,000 bytes. A focused API test protects response negotiation;
the Docker smoke check protects the integrated production image. No worker, cache,
or solver change was attempted because the boundary measurements show no compute or
animation problem to solve.

## Measurement references

- [FastAPI gzip middleware](https://fastapi.tiangolo.com/advanced/middleware/)
- [Size Limit configuration](https://github.com/ai/size-limit)
- [Playwright page evaluation](https://playwright.dev/docs/evaluating)
- [Playwright test attachments](https://playwright.dev/docs/api/class-testinfo)
- [MDN `requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
