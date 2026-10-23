# Changelog

Notable user-facing changes to Eigenflow are recorded here.

## [Unreleased]

### Added

- Edge flux traces whose dashes advance with integrated heat transfer.
- A log-scale mixing curve with a `−κλ₂` slope guide and a dashed ghost of the
  previous configuration.
- A live readout of `λ₂`, time to mix to 1%, and distance from equilibrium.
- Live eigenmode weights beneath the Laplacian spectrum, with stems that animate
  when the structure changes.
- Click-to-inject heat sources, a node inspector on hover, and a tinted Fiedler
  split.
- A link to the source repository.

### Changed

- The simulation is the page's focus: a compact introduction above a lab layout
  with the stage beside a control and readout rail.
- Typography follows a LaTeX paper: labels, numbers, and math in Computer Modern
  (CMU Serif) in sentence case, running text in Inter, all self-hosted and
  subsetted. This replaces an undeclared system font stack and all-caps monospace
  labels.
- Bridge changes keep the playhead and the previous result on screen while the
  spectrum is recomputed.
- Heat now uses the perceptually uniform inferno palette with heat-scaled glow.
- Curated experiments sample diffusion densely so playback follows the exact
  exponential solution.
- Patched vite, vitest, and source-map-js advisories.

## [1.0.0] - 2026-09-13

### Added

- Three curated spectral-diffusion experiments: bridge bottleneck, path versus
  complete graph, and hub versus leaf.
- Synchronized network, timeline, spectrum, Fiedler partition, and computed
  explanation views.
- Accessible desktop and mobile interaction with reduced-motion support.
- A same-origin FastAPI and React production image, CI quality gates, and a
  reproducible Render deployment definition.
- A public portfolio deployment at
  [eigenflow-8tdq.onrender.com](https://eigenflow-8tdq.onrender.com).

### Security

- Bounded and validated numerical API inputs, a non-root runtime user, and
  conservative browser response headers.
- Locked Python and JavaScript dependencies with no known vulnerabilities at
  release review.
