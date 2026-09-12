# Implementation Plan: Eigenflow

## Outcome

Build a polished, guided spectral-graph diffusion experience that a recruiter can
understand in under a minute and inspect deeply afterward. The finished project
must demonstrate three things through one coherent product:

1. Mathematical judgment: correct graph Laplacians, eigendecomposition, diffusion,
   numerical diagnostics, and honest treatment of degenerate eigenspaces.
2. Visualization craft: coordinated, responsive views that make a structural
   bottleneck visible without requiring the visitor to read the equations first.
3. Engineering discipline: typed boundaries, focused tests, CI, and a reproducible
   one-container deployment.

The app is not a general-purpose graph editor or analytics platform. Its job is to
tell one excellent mathematical story, then reinforce it with two smaller curated
experiments.

## Delivery strategy

- Work in thin vertical slices. Each phase must end with something visible or
  independently verifiable, not a disconnected layer of backend or frontend work.
- Keep Python authoritative for all scientific computation. React and D3 own
  interaction, explanation, and rendering only.
- Return one aligned analysis payload with an explicit `nodeOrder`; all visual
  views consume that same result.
- Establish correctness on fixed, small graphs before adding interaction.
- Introduce reusable abstractions only after the bottleneck experiment proves what
  actually needs to be shared.
- Keep Docker on the critical path. Any dependency or serving change must still
  work through the production image.

## Dependency path

```text
graph validation and node ordering
                |
                v
     A, D, and L construction
                |
                v
  eigendecomposition + diagnostics
                |
                v
       sampled heat diffusion
                |
                v
       cohesive analysis result
                |
                v
     POST /api/analysis contract
                |
                v
     React query and state handling
                |
                v
 network -> playback -> spectrum -> explanation
                |
                v
      additional curated experiments
```

## Phases

### Phase 0: Foundation scaffold — complete

**Objective:** Establish a credible, intentionally small production-shaped base.

**Delivered:**

- One Git repository with separate frontend and backend source roots.
- React, TypeScript, Vite, and D3 presentation layer.
- FastAPI, NumPy, SciPy, and NetworkX scientific backend.
- Health endpoint, automated checks, and a responsive visual foundation.
- Multi-stage, non-root Docker image serving the complete application.

**Exit gate:** Frontend and backend checks pass; the built container serves both
`/api/health` and the application shell.

### Phase 1: Numerical truth layer — complete

**Objective:** Make the mathematical core independently trustworthy before it is
used to drive the interface.

**Deliverables:**

- Validation for finite weighted undirected graphs with stable string node IDs.
- Deterministic node ordering and adjacency, degree, and combinatorial Laplacian
  construction.
- Symmetric eigendecomposition with stable display signs and diagnostics.
- Fixed bottleneck, path, complete, and star fixtures for numerical tests.
- Invariant tests covering symmetry, zero row sums, nonnegative eigenvalues,
  eigenpair residuals, connected components, and algebraic connectivity.

**Recruiter-visible signal:** The repository contains a compact scientific kernel
whose tests verify mathematical properties rather than snapshots.

**Exit gate:** All numerical invariants pass on the curated fixtures, and no math
module imports FastAPI or frontend concerns.

### Phase 2: Bottleneck end-to-end slice

**Objective:** Connect the Python model to the browser through one complete,
compelling experiment.

**Deliverables:**

- Sampled spectral heat-diffusion solver with conservation and equilibrium tests.
- One cohesive analysis service that returns matrices, spectrum, diagnostics, and
  diffusion samples aligned to `nodeOrder`.
- Typed `POST /api/analysis` request and response models with bounded inputs and
  useful validation errors.
- Frontend analysis client with loading, failure, cancellation, and stale-response
  handling.
- D3 network view for the two-cluster bottleneck fixture using backend-returned
  data and an accessible non-color status summary.

**Recruiter-visible signal:** A visitor sees real Python-computed data rendered by
a custom frontend rather than a static mock or notebook chart.

**Exit gate:** Starting the container and opening the app produces the bottleneck
graph from `/api/analysis`; API, frontend, and container tests all pass.

### Phase 3: Interactive diffusion experience

**Objective:** Turn the first slice into the project's primary hands-on simulation.

**Deliverables:**

- Selectable heat source and a single bridge-strength control.
- Debounced analysis requests with cancellation and stale-result protection.
- Play, pause, reset, and keyboard-operable time scrubbing.
- Local interpolation of returned samples so animation never makes per-frame API
  calls.
- Coordinated node coloring, legend, time value, and quantitative heat summary.

**Recruiter-visible signal:** The visitor can form and test a hypothesis—stronger
bridge, faster global mixing—and immediately see the model respond.

**Exit gate:** The complete interaction can be discovered and used within 30
seconds, remains smooth at the 30-node limit, and works with reduced motion.

### Phase 4: Spectral explanation layer

**Objective:** Reveal why the diffusion behaves as observed without burying the
visitor in notation.

**Deliverables:**

- Spectrum view with clear emphasis on zero eigenvalues and `lambda_2`.
- Fiedler-vector partition overlay synchronized with the network.
- A concise explanation that connects bridge strength, algebraic connectivity,
  and mixing behavior using the current computed values.
- Optional matrix inspector for `A`, `D`, and `L`, kept collapsed by default.
- Explicit UI treatment for disconnected graphs and repeated eigenvalues.

**Recruiter-visible signal:** Visual storytelling and mathematical interpretation
are linked—the app does not merely draw a network or plot eigenvalues.

**Exit gate:** Changing the bridge updates the network, diffusion, spectrum, and
explanation consistently from the same response, with no contradictory labels.

### Phase 5: Curated comparison experiments

**Objective:** Demonstrate that the model generalizes while keeping the experience
focused and maintainable.

**Deliverables:**

- A small experiment registry introduced only after the bottleneck slice is stable.
- Path-versus-complete experiment using a controlled node count and an A/B switch.
- Star experiment comparing diffusion from the hub and from a leaf.
- Guided experiment picker, reset behavior, and experiment-specific prompts.
- Shared visual components without prematurely generalizing the mathematical core.

**Recruiter-visible signal:** The same system explains multiple structural regimes,
showing reusable modeling and visualization design rather than a one-off demo.

**Exit gate:** All three experiments have a distinct question, one primary control,
and one clear takeaway; switching experiments does not leak prior state.

### Phase 6: Portfolio finish and release

**Objective:** Turn a working application into a project that is easy to evaluate,
run, and discuss in an interview.

**Deliverables:**

- Keyboard, screen-reader, contrast, responsive, and reduced-motion review.
- Browser-level happy-path coverage for the primary bottleneck interaction.
- Container smoke test that starts the image and checks the API and page response.
- Performance verification at the supported graph-size boundary.
- README narrative covering the problem, mathematical model, architecture choices,
  screenshots, local commands, Docker commands, and test strategy.
- Final screenshots and a short demonstration clip centered on the weak-bridge
  experiment.
- Hosted deployment using the same production container where practical.

**Recruiter-visible signal:** The live demo, source repository, and documentation
tell the same story and can be evaluated without setup guesswork.

**Exit gate:** A fresh clone passes CI, builds with one Docker command, and the live
demo completes the primary story without errors on desktop and mobile layouts.

## Checkpoints

### Checkpoint A — after Phase 1

- Numerical API design reviewed before it becomes a public endpoint.
- Invariant tests pass and tolerances are documented.
- Bottleneck fixture demonstrates the expected `lambda_2` relationship.

### Checkpoint B — after Phase 2

- One real end-to-end vertical slice works locally and in Docker.
- Request and response shapes are stable enough for the interaction work.
- The main network view is legible without explanatory instructions.

### Checkpoint C — after Phase 4

- Primary portfolio story is complete and user-tested before scope expands.
- Every visible claim is backed by a returned value or documented mathematical
  property.
- Decide whether the matrix inspector materially improves the story; omit it if it
  competes with the coordinated views.

### Checkpoint D — release candidate

- All three experiments meet their acceptance criteria.
- CI, production image, accessibility, responsiveness, and browser checks pass.
- README and demo media lead with the outcome rather than the implementation stack.

## Scope controls

Do not add these during the MVP:

- Unrestricted graph creation or drag-to-edit behavior.
- Directed, temporal, signed, or large graphs.
- Accounts, databases, persistence, uploads, or external datasets.
- Machine learning or comparisons among community-detection algorithms.
- Multiple deployable services, queues, caches, or generated API clients.
- WebGL, 3D, or decorative simulation effects without quantitative meaning.

Potential extensions are reconsidered only after the release checkpoint and only
if they strengthen the portfolio story more than they increase explanation cost.

## Principal risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Incorrect or unstable spectral output | High | Test invariants and residuals; stabilize signs for display; describe repeated eigenvalues as eigenspaces. |
| Frontend and backend disagree on node alignment | High | Make `nodeOrder` explicit and test every array against it. |
| Rapid controls display stale results | Medium | Debounce, cancel in-flight requests, and ignore responses with obsolete request IDs. |
| Too many panels weaken the story | Medium | Lead with network and playback; progressively reveal spectrum and matrices. |
| Animation becomes janky | Medium | Sample in Python, interpolate locally, and profile at the 30-node boundary before adding workers. |
| Docker path drifts from development | Medium | Build the image in CI and add a runtime smoke test after integration changes. |
| Additional experiments cause abstraction sprawl | Medium | Finish bottleneck first; extract only components proven common by the second experiment. |

## Definition of done

A task is done only when its focused tests pass, the relevant build succeeds, its
manual behavior is checked, error and empty states are handled, and documentation
is updated when a contract or scope decision changes. Phase completion additionally
requires the associated checkpoint and a working Docker build.

## Approval gate

Implementation begins with Phase 1 after this plan is reviewed. The detailed,
ordered work items and verification commands live in `tasks/todo.md`.
