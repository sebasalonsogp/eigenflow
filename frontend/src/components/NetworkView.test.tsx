import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ANALYSIS_FIXTURE } from '../test/analysisFixture'
import { NetworkView } from './NetworkView'

test('renders weighted graph structure and a non-color heat summary', () => {
  const { container } = render(
    <NetworkView
      analysis={ANALYSIS_FIXTURE}
      positions={{
        a: { x: 100, y: 90 },
        b: { x: 300, y: 90 },
      }}
      sampleIndex={1}
    />,
  )

  expect(screen.getByRole('img', { name: /heat diffusion on a 2-node graph/i })).toBeVisible()
  expect(container.querySelectorAll('[data-node-id]')).toHaveLength(2)
  expect(container.querySelectorAll('[data-edge-id]')).toHaveLength(1)
  expect(screen.getByText('a')).toBeVisible()
  expect(screen.getByText('b')).toBeVisible()
  expect(screen.getByText(/source a/i)).toBeVisible()
  expect(screen.getByText(/hottest a/i)).toBeVisible()
  expect(screen.getByText(/t = 1.00/i)).toBeVisible()
  expect(screen.getByText(/total heat 1.000/i)).toBeVisible()
})

test('preserves the visualization frame when no graph data is available', () => {
  render(
    <NetworkView
      analysis={{
        ...ANALYSIS_FIXTURE,
        nodeOrder: [],
        graph: { nodes: [], edges: [] },
        matrices: { adjacency: [], degree: [], laplacian: [] },
        spectrum: {
          ...ANALYSIS_FIXTURE.spectrum,
          eigenvalues: [],
          eigenvectors: [],
          residualNorms: [],
        },
        diffusion: {
          ...ANALYSIS_FIXTURE.diffusion,
          times: [],
          states: [],
          initialState: [],
        },
      }}
      positions={{}}
    />,
  )

  expect(screen.getByText(/no graph data to display/i)).toBeVisible()
})
