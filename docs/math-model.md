# Mathematical Model

## Initial domain

The MVP supports finite, weighted, undirected graphs with stable string node identifiers and nonnegative, finite edge weights. Self-loops and duplicate undirected edges will be rejected initially.

## Graph Laplacian

For adjacency matrix `A` and weighted degree matrix `D`, Eigenflow uses the combinatorial Laplacian

```text
L = D - A.
```

The node order used to construct these matrices is explicit and returned with every analysis result.

## Diffusion

For node state `x(t)` and diffusion coefficient `kappa`,

```text
dx/dt = -kappa L x.
```

With the symmetric eigendecomposition `L = V Lambda V^T`,

```text
x(t) = V exp(-kappa Lambda t) V^T x(0).
```

The backend samples this solution over time. The frontend animates those samples without recomputing the model.

## Numerical obligations

Tests will verify:

- Symmetry and zero row sums of `L`.
- Nonnegative eigenvalues within a documented tolerance.
- Eigenpair residuals rather than exact eigenvector snapshots.
- Heat conservation.
- Component-wise long-term equilibrium.
- The relationship between bridge strength and algebraic connectivity.

Eigenvector signs will be stabilized for display. Repeated eigenvalues will be presented as degenerate eigenspaces rather than implying that one arbitrary basis is unique.
