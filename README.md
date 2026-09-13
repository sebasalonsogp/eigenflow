# Eigenflow

Eigenflow is an interactive exploration of how graph structure controls diffusion. It connects heat flow on networks to the graph Laplacian, its eigenvalues, and its eigenvectors through coordinated, recruiter-friendly visualizations.

> Project status: foundation scaffold. The numerical experiments and interactive visualizations are the next implementation slices.

## Portfolio goal

The project is designed to demonstrate two things clearly:

1. Mathematical and scientific-computing depth using Python, NumPy, SciPy, and NetworkX.
2. The ability to translate an abstract model into a polished React and D3 experience.

The primary experience will be a bottleneck experiment: heat spreads quickly inside two dense communities but slowly across the weak bridge between them. Adjusting that bridge will connect visible behavior to algebraic connectivity and the Fiedler vector.

## Architecture

- `frontend/` — React, TypeScript, Vite, and D3 presentation layer.
- `backend/` — FastAPI boundary and pure Python numerical modules.
- `docs/` — product, architecture, and mathematical decisions.
- `tasks/` — implementation plan and reviewable task list.
- `Dockerfile` — multi-stage production build that serves the compiled frontend and API from one container.

Both applications live in this single Git repository and ship as one product.

## Local development

### Backend

```powershell
cd backend
uv sync --dev
uv run fastapi dev src/eigenflow_api/main.py
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Vite proxies `/api` requests to FastAPI at `http://localhost:8000`.

## Verification

```powershell
cd backend
uv run ruff check .
uv run pytest

cd ../frontend
npm run lint
npm run test
npm run build
```

## Docker

```powershell
docker compose up --build
```

Open `http://localhost:8000`. The final image uses Node only to build the frontend; the runtime contains Python and the installed application.

## Documentation

- [Product specification](docs/specification.md)
- [Architecture](docs/architecture.md)
- [Mathematical model](docs/math-model.md)
- [Supported-boundary performance](docs/performance.md)
