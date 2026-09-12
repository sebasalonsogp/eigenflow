# Implementation Plan: Eigenflow

## Strategy

Build thin vertical slices around the bottleneck experiment. Mathematical correctness comes first, but each major slice must connect to a visible portfolio experience before expanding scope.

## Phases

1. Foundation scaffold and one-container development path.
2. Graph contract, Laplacian construction, and numerical diagnostics.
3. Complete bottleneck analysis endpoint and basic network rendering.
4. Diffusion playback and synchronized spectral explanation.
5. Path-versus-complete and star experiments.
6. Accessibility, responsive polish, Docker verification, and portfolio documentation.

## Architecture risks

- Degenerate eigenspaces can make individual eigenvectors visually unstable.
- Rapid parameter changes can produce stale API responses.
- Too many simultaneous panels can overwhelm the central story.
- Docker can drift from local development if both paths are not tested in CI.

## Checkpoints

- Every numerical slice passes invariant-based tests.
- Every frontend slice builds and has an accessible error or loading state.
- Docker is rebuilt after dependency or serving changes.
- Scope changes update `docs/specification.md` before implementation.
