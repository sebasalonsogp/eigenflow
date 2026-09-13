# Eigenflow quality constraints

Last reviewed: 2026-09-13

These constraints protect a small, recruiter-facing portfolio application. They
favor a polished, trustworthy demonstration over production-scale machinery.

## Enforced gates

- Backend tests and lint must pass with zero errors:
  `cd backend; uv run pytest; uv run ruff check .`.
- Frontend tests and lint must pass with zero errors:
  `cd frontend; npm test; npm run lint`.
- TypeScript and the production build must pass with zero errors. JavaScript must
  remain at or below 105 kB Brotli and CSS at or below 5 kB Brotli, checked by
  `cd frontend; npm run size`. These limits round up the 2026-09-13 baseline plus
  the Size Limit project's recommended approximately 25% headroom.
- High- or critical-severity frontend dependency findings are not accepted;
  verify with `cd frontend; npm audit --audit-level=high`.
- The real-browser recruiter journey, including the functional 30-node boundary
  exercise, must pass with `cd frontend; npm run test:e2e`.
- The production image must pass `docker compose up --detach --build` followed by
  `python scripts/container_smoke.py`.

## Measured baselines

Machine-dependent latency and frame timing are recorded in `docs/performance.md`,
not enforced as hard CI thresholds. Re-profile before adding a worker, cache, or
alternate numerical solver, and investigate a material regression before merging.
The deterministic bundle budgets above remain blocking.

## Integrity floor

- Do not add `@ts-ignore`, `eslint-disable`, `# noqa`, or `# type: ignore` to bypass
  a check. Audit with
  `rg -n "@ts-ignore|eslint-disable|# noqa|# type: ignore" backend frontend scripts`.
- Do not skip or delete tests, weaken assertions or budgets, add unimplemented
  stubs, or swallow exceptions merely to make a check pass.
- Do not commit secrets or credentials.
- A constraint may change only with a documented measurement or project-scope
  decision, never as a shortcut around a failing change.
