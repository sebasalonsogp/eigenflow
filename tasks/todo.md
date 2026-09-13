# Eigenflow Task List

Tasks are sized for one focused implementation session. Complete them in dependency
order; do not start a later phase until its preceding checkpoint passes.

## Phase 0: Foundation scaffold — complete

- [x] Initialize the repository and toolchain scaffolds.
- [x] Add project, architecture, and mathematical documentation.
- [x] Add a backend health endpoint and frontend foundation screen.
- [x] Add CI and a multi-stage Docker build.

## Phase 1: Numerical truth layer

### Task 1.1: Validate graphs and establish canonical node order

**Description:** Add pure-Python validation and deterministic conversion from the
supported graph input into a canonical internal representation.

**Acceptance criteria:**

- [x] Accept finite, nonnegative weights and stable unique string node IDs.
- [x] Reject self-loops, duplicate undirected edges, unknown endpoints, and graphs
      above 30 nodes with actionable messages.
- [x] Produce deterministic `nodeOrder` independent of edge input order.

**Verification:**

- [x] `uv run pytest tests/test_graph.py`
- [x] `uv run ruff check .`

**Dependencies:** Phase 0

**Files likely touched:** `backend/src/eigenflow_api/math/graph.py`,
`backend/tests/test_graph.py`

**Estimated scope:** Small

### Task 1.2: Construct adjacency, degree, and Laplacian matrices

**Description:** Build `A`, `D`, and `L = D - A` from the canonical graph.

**Acceptance criteria:**

- [x] Matrix indices align exactly with the returned `nodeOrder`.
- [x] Weighted fixtures produce symmetric matrices with correct degrees.
- [x] Laplacian rows sum to zero within the documented tolerance.

**Verification:**

- [x] `uv run pytest tests/test_laplacian.py`
- [x] `uv run ruff check .`

**Dependencies:** Task 1.1

**Files likely touched:** `backend/src/eigenflow_api/math/laplacian.py`,
`backend/tests/test_laplacian.py`

**Estimated scope:** Small

### Task 1.3: Compute spectrum and diagnostics

**Description:** Add symmetric eigendecomposition, presentation sign stabilization,
and numerical diagnostics without coupling the kernel to HTTP models.

**Acceptance criteria:**

- [x] Eigenvalues are sorted and tolerance-level negatives are handled explicitly.
- [x] Tests verify eigenpair residuals, zero-eigenvalue multiplicity, and `lambda_2`.
- [x] Repeated eigenvalues are represented as degenerate eigenspaces in metadata.

**Verification:**

- [x] `uv run pytest tests/test_spectrum.py`
- [x] `uv run pytest`
- [x] `uv run ruff check .`

**Dependencies:** Task 1.2

**Files likely touched:** `backend/src/eigenflow_api/math/spectrum.py`,
`backend/tests/test_spectrum.py`, `docs/math-model.md`

**Estimated scope:** Medium

### Task 1.4: Add curated numerical fixtures

**Description:** Define deterministic bottleneck, path, complete, and star fixtures
shared by numerical tests and later experiment definitions.

**Acceptance criteria:**

- [x] Fixtures contain no presentation-specific values.
- [x] Bridge strengthening increases algebraic connectivity in the bottleneck test.
- [x] Path, complete, and star spectra satisfy documented known properties.

**Verification:**

- [x] `uv run pytest tests/test_fixtures.py tests/test_spectrum.py`

**Dependencies:** Tasks 1.1–1.3

**Files likely touched:** `backend/src/eigenflow_api/math/fixtures.py`,
`backend/tests/test_fixtures.py`

**Estimated scope:** Small

### Checkpoint A: Numerical foundation

- [x] Full backend suite and Ruff pass.
- [x] Numerical tolerances and invariants are documented.
- [x] Mathematical interfaces are reviewed before HTTP exposure.
- [x] Production Docker image still builds.

## Phase 2: Bottleneck end-to-end slice — complete

### Task 2.1: Implement sampled heat diffusion

**Description:** Compute `x(t)` through the symmetric spectral solution for a
bounded time grid and initial heat vector.

**Acceptance criteria:**

- [x] Output samples align with `nodeOrder` and requested times.
- [x] Heat is conserved and converges to component-wise equilibrium.
- [x] Invalid initial states, times, and diffusion coefficients are rejected.

**Verification:**

- [x] `uv run pytest tests/test_diffusion.py`
- [x] `uv run ruff check .`

**Dependencies:** Task 1.3

**Files likely touched:** `backend/src/eigenflow_api/math/diffusion.py`,
`backend/tests/test_diffusion.py`

**Estimated scope:** Small

### Task 2.2: Compose one graph-analysis result

**Description:** Orchestrate validation, matrices, spectrum, diagnostics, and
diffusion into one framework-independent application service.

**Acceptance criteria:**

- [x] Every vector and matrix is explicitly aligned to one `nodeOrder`.
- [x] The service exposes no FastAPI or JSON serialization concerns.
- [x] One integration test covers the complete bottleneck computation.

**Verification:**

- [x] `uv run pytest tests/test_analysis.py`

**Dependencies:** Tasks 1.2–1.4 and 2.1

**Files likely touched:** `backend/src/eigenflow_api/analysis.py`,
`backend/tests/test_analysis.py`

**Estimated scope:** Small

### Task 2.3: Expose `POST /api/analysis`

**Description:** Define bounded Pydantic request/response models and adapt the
application service to a single cohesive HTTP endpoint.

**Acceptance criteria:**

- [x] Valid bottleneck requests return the full typed analysis payload.
- [x] Invalid graphs return stable 422 responses with actionable field errors.
- [x] Endpoint tests verify shape, alignment, bounds, and one numerical diagnostic.

**Verification:**

- [x] `uv run pytest tests/test_analysis_api.py`
- [x] `uv run pytest`

**Dependencies:** Task 2.2

**Files likely touched:** `backend/src/eigenflow_api/schemas.py`,
`backend/src/eigenflow_api/main.py`, `backend/tests/test_analysis_api.py`

**Estimated scope:** Medium

### Task 2.4: Add the typed frontend analysis client

**Description:** Add request/response types, runtime boundary validation, and a
small React hook for lifecycle and stale-request handling.

**Acceptance criteria:**

- [x] Loading, success, validation failure, and network failure are represented.
- [x] Superseded requests are cancelled or ignored deterministically.
- [x] Client tests use representative API fixtures rather than duplicating math.

**Verification:**

- [x] `npm test -- --run`
- [x] `npm run lint`
- [x] `npm run build`

**Dependencies:** Task 2.3

**Files likely touched:** `frontend/src/api.ts`, `frontend/src/useAnalysis.ts`,
`frontend/src/test/analysisFixture.ts`, `frontend/src/api.test.ts`

**Estimated scope:** Medium

### Task 2.5: Render the bottleneck network from analysis data

**Description:** Replace the static hero diagram with a D3-driven network view
whose structure and state come from the backend analysis result.

**Acceptance criteria:**

- [x] Nodes and weighted edges render deterministically with stable labels.
- [x] Heat uses a perceptually ordered scale plus a non-color textual summary.
- [x] Empty, loading, and error states preserve the page layout.

**Verification:**

- [x] `npm test -- --run`
- [x] `npm run build`
- [x] Manual check at desktop and narrow viewport widths.

**Dependencies:** Task 2.4

**Files likely touched:** `frontend/src/components/NetworkView.tsx`,
`frontend/src/components/NetworkView.css`, `frontend/src/App.tsx`,
`frontend/src/components/NetworkView.test.tsx`

**Estimated scope:** Medium

### Checkpoint B: First working vertical slice

- [x] Backend and frontend suites pass.
- [x] Container returns a bottleneck analysis and renders the real network.
- [x] API contract and `nodeOrder` alignment are documented.
- [x] Primary view is understandable without setup instructions.

## Phase 3: Interactive diffusion experience — complete

### Task 3.1: Add experiment state and bridge control

**Description:** Model the bottleneck configuration in React and connect one
bounded bridge-weight control to the analysis request lifecycle.

**Acceptance criteria:**

- [x] Changing bridge strength updates only the intended edge weight.
- [x] Rapid changes never display an obsolete response.
- [x] Control has a label, current value, keyboard support, and reset behavior.

**Verification:**

- [x] `npm test -- --run`
- [x] Manual rapid-change and keyboard test.

**Dependencies:** Checkpoint B

**Files likely touched:** `frontend/src/experiments/bottleneck.ts`,
`frontend/src/App.tsx`, `frontend/src/components/ParameterControl.tsx`,
`frontend/src/useAnalysis.test.ts`

**Estimated scope:** Medium

### Task 3.2: Add local timeline playback

**Description:** Animate returned diffusion samples locally with play, pause,
reset, and time-scrubbing controls.

**Acceptance criteria:**

- [x] Playback performs no per-frame network requests.
- [x] Scrubbing and pause produce deterministic displayed values.
- [x] Reduced-motion mode disables automatic animation without removing analysis.

**Verification:**

- [x] `npm test -- --run`
- [x] Browser and container logs confirm no per-frame API traffic.

**Dependencies:** Task 3.1

**Files likely touched:** `frontend/src/usePlayback.ts`,
`frontend/src/components/PlaybackControls.tsx`, `frontend/src/App.tsx`,
`frontend/src/usePlayback.test.ts`

**Estimated scope:** Medium

### Task 3.3: Synchronize heat encoding and quantitative summary

**Description:** Drive network coloring, legend, time, and a compact heat summary
from the same interpolated frame.

**Acceptance criteria:**

- [x] All displayed values correspond to the same playback time.
- [x] The palette remains interpretable for common color-vision deficiencies.
- [x] Selected source and hottest region remain available as text.

**Verification:**

- [x] Component tests cover start, midpoint, end, and reset states.
- [x] Manual visual and accessibility-tree check.

**Dependencies:** Task 3.2

**Files likely touched:** `frontend/src/components/NetworkView.tsx`,
`frontend/src/components/HeatLegend.tsx`, `frontend/src/App.tsx`

**Estimated scope:** Medium

### Checkpoint C1: Primary interaction

- [x] A new visitor can select a source, change the bridge, and play diffusion.
- [x] Interaction remains smooth at 30 nodes and under rapid input.
- [x] Docker image passes API and page smoke checks.

## Phase 4: Spectral explanation layer

### Task 4.1: Add the spectrum view

**Description:** Render the ordered Laplacian eigenvalues with accessible focus and
clear emphasis on the zero modes and `lambda_2`.

**Acceptance criteria:**

- [x] Spectrum updates from the current analysis response.
- [x] `lambda_2` is highlighted only when its interpretation is valid.
- [x] Values are available through labels or a compact accessible table.

**Verification:**

- [x] `npm test -- --run`
- [ ] Manual keyboard and narrow-layout check.

**Dependencies:** Task 3.3

**Files likely touched:** `frontend/src/components/SpectrumView.tsx`,
`frontend/src/components/SpectrumView.css`, `frontend/src/App.tsx`

**Estimated scope:** Medium

### Task 4.2: Add Fiedler partition overlay

**Description:** Allow the current Fiedler mode to color or outline the network
partition while preserving the heat view as the default.

**Acceptance criteria:**

- [ ] Toggling the overlay never changes the underlying experiment.
- [ ] Partition membership remains available without relying on color alone.
- [ ] Disconnected or degenerate cases show a truthful limitation message.

**Verification:**

- [ ] Component tests cover connected, disconnected, and degenerate responses.
- [ ] Manual comparison against the bottleneck fixture.

**Dependencies:** Task 4.1

**Files likely touched:** `frontend/src/components/NetworkView.tsx`,
`frontend/src/components/ModeToggle.tsx`, `frontend/src/App.tsx`

**Estimated scope:** Medium

### Task 4.3: Connect computed values to the explanation

**Description:** Add concise narrative text using current bridge strength,
`lambda_2`, and mixing diagnostics rather than static claims.

**Acceptance criteria:**

- [ ] Explanation updates consistently with the active analysis result.
- [ ] Copy distinguishes observation, mathematical interpretation, and limitation.
- [ ] Strengthening the bridge produces no contradictory qualitative statement.

**Verification:**

- [ ] Tests cover weak, medium, and strong bridge fixtures.
- [ ] Content review against `docs/math-model.md`.

**Dependencies:** Tasks 4.1 and 4.2

**Files likely touched:** `frontend/src/components/InsightPanel.tsx`,
`frontend/src/insights.ts`, `frontend/src/insights.test.ts`

**Estimated scope:** Small

### Task 4.4: Add the optional matrix inspector

**Description:** Add a collapsed inspection panel for `A`, `D`, and `L`; omit the
feature if Checkpoint C2 shows it distracts from the primary story.

**Acceptance criteria:**

- [ ] Matrix headings and rows identify the shared `nodeOrder`.
- [ ] Values remain readable at the 30-node boundary through scroll or reduction.
- [ ] Inspector is absent from the initial visual hierarchy until opened.

**Verification:**

- [ ] Component tests verify matrix selection and alignment.
- [ ] Manual mobile overflow and keyboard test.

**Dependencies:** Task 4.3 and explicit Checkpoint C2 approval

**Files likely touched:** `frontend/src/components/MatrixInspector.tsx`,
`frontend/src/components/MatrixInspector.css`, `frontend/src/App.tsx`

**Estimated scope:** Medium

### Checkpoint C2: Complete portfolio story

- [ ] Network, playback, spectrum, and explanation stay synchronized.
- [ ] A reviewer can explain the bridge/`lambda_2`/mixing relationship after use.
- [ ] Matrix inspector is retained only if it strengthens that understanding.

## Phase 5: Curated comparison experiments

### Task 5.1: Introduce the experiment registry

**Description:** Extract the minimum shared experiment configuration proven by the
finished bottleneck experience.

**Acceptance criteria:**

- [ ] Registry defines IDs, display copy, graph factory, control, and default source.
- [ ] Bottleneck behavior remains unchanged after extraction.
- [ ] No plugin system or generic schema is introduced.

**Verification:**

- [ ] Existing frontend and backend suites pass.
- [ ] Experiment registry unit tests pass.

**Dependencies:** Checkpoint C2

**Files likely touched:** `frontend/src/experiments/types.ts`,
`frontend/src/experiments/index.ts`, `frontend/src/experiments/bottleneck.ts`,
`frontend/src/App.tsx`

**Estimated scope:** Medium

### Task 5.2: Add path-versus-complete comparison

**Description:** Add a controlled A/B experiment that keeps node count fixed and
contrasts slow path mixing with rapid complete-graph mixing.

**Acceptance criteria:**

- [ ] One switch changes topology while preserving comparable initial conditions.
- [ ] Prompt and takeaway explain the observed spectral difference.
- [ ] Reset and experiment switching clear obsolete playback state.

**Verification:**

- [ ] Numerical fixture and frontend interaction tests pass.
- [ ] Manual A/B comparison check.

**Dependencies:** Task 5.1

**Files likely touched:** `frontend/src/experiments/pathComplete.ts`,
`frontend/src/components/ExperimentPicker.tsx`, `backend/tests/test_fixtures.py`

**Estimated scope:** Small

### Task 5.3: Add the star-network experiment

**Description:** Compare diffusion from the hub and a leaf to reveal the role of
centrality through the same simulation system.

**Acceptance criteria:**

- [ ] Source choice is limited to an intentional hub-versus-leaf comparison.
- [ ] Prompt and takeaway distinguish structural position from initial heat amount.
- [ ] Shared views require no star-specific rendering branches.

**Verification:**

- [ ] Numerical fixture and frontend interaction tests pass.
- [ ] Manual hub/leaf comparison check.

**Dependencies:** Task 5.1

**Files likely touched:** `frontend/src/experiments/star.ts`,
`frontend/src/components/ExperimentPicker.tsx`, `backend/tests/test_fixtures.py`

**Estimated scope:** Small

### Checkpoint D: MVP feature complete

- [ ] Each experiment has one question, one primary control, and one takeaway.
- [ ] Experiment switching has no stale state or requests.
- [ ] Full suites and Docker smoke check pass.

## Phase 6: Portfolio finish and release

### Task 6.1: Complete accessibility and responsive verification

**Description:** Audit the finished interaction across keyboard, screen reader,
contrast, reduced motion, desktop, and mobile layouts.

**Acceptance criteria:**

- [ ] Primary flow is keyboard operable with visible focus.
- [ ] Charts expose equivalent names, values, and state outside color alone.
- [ ] Supported narrow layouts have no unusable controls or clipped content.

**Verification:**

- [ ] Automated accessibility checks pass.
- [ ] Manual keyboard, screen-reader, reduced-motion, and mobile checklist passes.

**Dependencies:** Checkpoint D

**Files likely touched:** focused frontend component styles/tests and
`docs/accessibility.md`

**Estimated scope:** Medium

### Task 6.2: Add browser and container smoke coverage

**Description:** Exercise the primary bottleneck flow in a real browser and verify
the running production image in CI.

**Acceptance criteria:**

- [ ] Browser test covers load, source selection, bridge change, playback, and
      spectrum update.
- [ ] Container smoke test checks `/api/health`, `/api/analysis`, and `/`.
- [ ] Failures provide useful logs without adding production observability services.

**Verification:**

- [ ] Browser suite passes locally and in CI.
- [ ] CI builds and starts the production image successfully.

**Dependencies:** Task 6.1

**Files likely touched:** browser test files, `.github/workflows/ci.yml`,
`compose.yaml`

**Estimated scope:** Medium

### Task 6.3: Verify supported-boundary performance

**Description:** Measure analysis latency, payload size, and animation smoothness at
30 nodes before considering workers or alternate solvers.

**Acceptance criteria:**

- [ ] Results and test environment are documented reproducibly.
- [ ] Primary interaction remains responsive at the supported boundary.
- [ ] Any optimization is driven by a measured bottleneck.

**Verification:**

- [ ] Backend benchmark and browser performance capture are recorded.
- [ ] Production build size is reviewed.

**Dependencies:** Task 6.2

**Files likely touched:** focused benchmark files and `docs/performance.md`

**Estimated scope:** Small

### Task 6.4: Produce the portfolio narrative and media

**Description:** Rewrite the README around the problem, experiment, insight, and
engineering choices; capture final screenshots and a short demo clip.

**Acceptance criteria:**

- [ ] README leads with the weak-bridge result and includes the live demo.
- [ ] Math, architecture, testing, and Docker choices are concise and accurate.
- [ ] Media shows interaction and coordinated views rather than only the landing page.

**Verification:**

- [ ] Fresh-clone setup and Docker instructions are followed successfully.
- [ ] All links, screenshots, and commands are checked.

**Dependencies:** Task 6.3

**Files likely touched:** `README.md`, `docs/`, `assets/`

**Estimated scope:** Medium

### Task 6.5: Deploy and perform release review

**Description:** Deploy the production container, review the complete codebase, and
tag the recruiter-ready release.

**Acceptance criteria:**

- [ ] Hosted app uses the same production build verified in CI.
- [ ] Public repository contains no secrets or generated clutter.
- [ ] Live app, repository, README, and portfolio link agree on naming.

**Verification:**

- [ ] Live desktop and mobile smoke tests pass.
- [ ] Clean clone passes documented commands and CI.
- [ ] Final review has no unresolved high-priority findings.

**Dependencies:** Task 6.4

**Files likely touched:** deployment configuration, `README.md`, release metadata

**Estimated scope:** Medium

### Checkpoint E: Recruiter-ready release

- [ ] All automated and manual quality gates pass.
- [ ] One-command Docker workflow succeeds from a clean clone.
- [ ] Live demo communicates the central insight within 30 seconds.
- [ ] Repository demonstrates mathematical, visualization, and engineering depth
      without presenting out-of-scope unfinished features.
