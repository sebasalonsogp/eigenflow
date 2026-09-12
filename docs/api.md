# Analysis API contract

`POST /api/analysis` is Eigenflow's single mathematical boundary. It accepts one
bounded weighted, undirected graph and returns every result needed by the coordinated
views.

## Request

```json
{
  "nodes": [{ "id": "left-0" }, { "id": "left-1" }],
  "edges": [{ "source": "left-0", "target": "left-1", "weight": 1.0 }],
  "heatSource": "left-0",
  "times": [0.0, 0.5, 1.0],
  "diffusionCoefficient": 1.0
}
```

- `nodes` contains 1–30 unique, non-empty string IDs.
- `edges` contains at most 435 unique non-self-loop pairs with finite,
  nonnegative weights.
- `heatSource` must identify one node.
- `times` contains 1–240 finite, nonnegative samples in nondecreasing order.
- `diffusionCoefficient` is finite and positive.

Malformed fields and domain-invalid graphs return `422` with errors located under
the relevant request field.

## Response alignment

The response contains `nodeOrder`, `graph`, `matrices`, `spectrum`, `diffusion`, and
`diagnostics`. `nodeOrder` is the canonical index contract for every numerical value:

- matrix row `i` and column `i` correspond to `nodeOrder[i]`;
- eigenvector matrix row `i` corresponds to `nodeOrder[i]`, while column `j`
  corresponds to `eigenvalues[j]`;
- `initialState[i]` and every `states[t][i]` correspond to `nodeOrder[i]`;
- graph nodes and normalized undirected edges are returned deterministically.

The diagnostic residuals expose numerical error rather than claiming exact floating-
point equality. Browser playback uses the returned diffusion samples locally and does
not call the endpoint per animation frame.
