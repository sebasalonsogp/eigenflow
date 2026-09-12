# Eigenflow: Product Specification

## Purpose

Eigenflow is a personal portfolio project for recruiters evaluating mathematical, scientific-computing, and data-visualization ability. It should make difficult graph theory intuitive before asking a visitor to read equations.

## Product objective

Create a guided spectral diffusion experience in which a visitor manipulates graph structure, observes heat flow change, and can reveal the Laplacian eigenmodes that explain the behavior.

## Primary story

Two dense communities are joined by a weak bridge. Heat quickly equilibrates inside the selected community and crosses the bridge slowly. Strengthening the bridge increases algebraic connectivity and accelerates global mixing.

## MVP

- Three curated experiments: bottleneck, path versus complete graph, and star network.
- Weighted, undirected graphs with at most 30 nodes.
- Selectable heat source.
- Play, pause, reset, and time scrubbing.
- One meaningful structural parameter per experiment.
- Coordinated network, spectrum, and diffusion views.
- Optional Fiedler-vector and matrix inspection layers.
- Numerical diagnostics and invariant-based tests.
- Responsive, keyboard-accessible presentation.
- Reproducible local and Docker workflows.

## Not in the MVP

- An unrestricted graph editor.
- Directed, temporal, or large graphs.
- Accounts, persistence, uploads, or external datasets.
- Machine learning or community-algorithm comparisons.
- Separate frontend and backend production deployments.
- 3D, WebGL, or decorative particles without quantitative meaning.

## Success criteria

- The bottleneck experiment is visually understandable without instructions.
- A visitor can inject heat and modify the bridge within 30 seconds.
- The graph, spectrum, and explanation remain synchronized.
- Numerical invariants pass automated tests.
- Supported graphs animate smoothly and do not rely on color alone.
- The live demo starts reliably from one container or one hosted service.
- The README communicates the mathematical and engineering story clearly.
