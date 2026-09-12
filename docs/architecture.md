# Architecture

## Decision

Eigenflow uses one Git repository with a React frontend and Python backend. They remain separate source roots because they have different responsibilities and toolchains, but they are built and deployed together.

```text
Browser interaction
       |
       v
React experiment state
       |
       v
POST /api/analysis
       |
       v
FastAPI boundary validation
       |
       v
Graph -> Laplacian -> spectrum -> diffusion
       |
       v
One aligned analysis result
       |
       +------> network view
       +------> spectral view
       +------> timeline and explanation
```

## Boundaries

- Python owns all mathematical computation and diagnostics.
- The frontend owns experiment configuration, presentation, interaction, and playback.
- Playback interpolates returned samples locally; it never calls the API per frame.
- Matrix rows, eigenvector entries, and diffusion states align through an explicit `nodeOrder`.
- Numerical modules do not import FastAPI or presentation concerns.
- React components do not calculate eigenvalues or construct Laplacians.

## API scope

The product starts with two endpoints:

- `GET /api/health` for container and deployment health.
- `POST /api/analysis` for one cohesive graph-analysis result.

The analysis endpoint will be added with the first mathematical slice. Graph changes will be debounced, in-flight requests cancelled, and stale responses ignored.

## Deployment

The production Dockerfile uses three stages:

1. Build the React frontend with Node.
2. Resolve and install the locked Python application with uv.
3. Copy only the built frontend and Python environment into a non-root runtime image.

FastAPI serves `/api/*` and the compiled frontend from the same origin.

## Complexity budget

Do not add a database, state-management library, component framework, generated API client, Web Worker, or separate service until a measured requirement makes it necessary.
