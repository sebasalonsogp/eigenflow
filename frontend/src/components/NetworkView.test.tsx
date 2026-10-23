import { fireEvent, render, screen } from '@testing-library/react'
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
      frame={{
        time: 1,
        state: ANALYSIS_FIXTURE.diffusion.states[1],
      }}
    />,
  )

  expect(screen.getByRole('img', { name: /heat diffusion across 2 graph nodes/i })).toBeVisible()
  expect(container.querySelectorAll('[data-node-id]')).toHaveLength(2)
  expect(container.querySelectorAll('[data-edge-id]')).toHaveLength(1)
  expect(screen.getByText('a')).toBeVisible()
  expect(screen.getByText('b')).toBeVisible()
  expect(screen.getByText(/source a/i)).toBeVisible()
  expect(screen.getByText(/hottest a/i)).toBeVisible()
  expect(screen.getByText(/t = 1.00/i)).toBeVisible()
  expect(screen.getByText(/total heat 1.000/i)).toBeVisible()
  expect(screen.getByLabelText(/square-root color spacing/i)).toBeVisible()
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
      frame={{ time: 0, state: [] }}
    />,
  )

  expect(screen.getByText(/no graph data to display/i)).toBeVisible()
})

test('drives color-independent details from one explicit diffusion frame', () => {
  render(
    <NetworkView
      analysis={ANALYSIS_FIXTURE}
      positions={{
        a: { x: 100, y: 90 },
        b: { x: 300, y: 90 },
      }}
      frame={{ time: 0.5, state: [0.25, 0.75] }}
    />,
  )

  const visualization = screen.getByRole('img', {
    name: /at time 0.50, b is hottest/i,
  })
  expect(visualization).toBeVisible()
  expect(screen.getByText(/t = 0.50/i)).toBeVisible()
  expect(screen.getByText(/source a/i)).toBeVisible()
  expect(screen.getByText(/hottest b/i)).toBeVisible()
  expect(screen.getByText(/total heat 1.000/i)).toBeVisible()
})

test('exposes every current node value without relying on the heat colors', () => {
  render(
    <NetworkView
      analysis={ANALYSIS_FIXTURE}
      positions={{}}
      frame={{ time: 0.5, state: [0.25, 0.75] }}
    />,
  )

  const values = screen.getByRole('table', { name: /node heat values at time 0.50/i })
  expect(values).toHaveTextContent(/node a/i)
  expect(values).toHaveTextContent('0.250')
  expect(values).toHaveTextContent(/node b/i)
  expect(values).toHaveTextContent('0.750')
})

test('presents floating-point noise as zero in the accessible node values', () => {
  render(
    <NetworkView
      analysis={ANALYSIS_FIXTURE}
      positions={{}}
      frame={{ time: 0, state: [-0.0001, 1.0001] }}
    />,
  )

  expect(screen.getByRole('row', { name: /node a/i })).toHaveTextContent('0.000')
  expect(screen.getByRole('row', { name: /node a/i })).not.toHaveTextContent('-0.000')
})

test('silences live summary announcements during automatic playback', () => {
  render(
    <NetworkView
      analysis={ANALYSIS_FIXTURE}
      positions={{}}
      frame={{ time: 0.5, state: [0.75, 0.25] }}
      announceChanges={false}
    />,
  )

  expect(screen.getByText(/total heat 1.000/i).closest('figcaption')).toHaveAttribute(
    'aria-live',
    'off',
  )
})

test('applies an explicit Fiedler membership overlay in node order', () => {
  const { container } = render(
    <NetworkView
      analysis={ANALYSIS_FIXTURE}
      positions={{
        a: { x: 100, y: 90 },
        b: { x: 300, y: 90 },
      }}
      frame={{ time: 0.5, state: [0.75, 0.25] }}
      partition={[
        { nodeId: 'a', value: Math.SQRT1_2, group: 'positive' },
        { nodeId: 'b', value: -Math.SQRT1_2, group: 'negative' },
      ]}
    />,
  )

  expect(container.querySelector('[data-node-id="a"]')).toHaveAttribute(
    'data-partition',
    'positive',
  )
  expect(container.querySelector('[data-node-id="b"]')).toHaveAttribute(
    'data-partition',
    'negative',
  )
  expect(screen.getByRole('img', { name: /fiedler partition overlay is active/i })).toBeVisible()
})

test('advances flux dashes by the heat each edge has carried', () => {
  const { container } = render(
    <NetworkView
      analysis={ANALYSIS_FIXTURE}
      positions={{
        a: { x: 100, y: 90 },
        b: { x: 300, y: 90 },
      }}
      frame={{ time: 0.5, state: [0.7838338208, 0.2161661792] }}
    />,
  )

  // Flux a -> b falls linearly from 1 to 0.5677 over [0, 1]; by t = 0.5 the edge
  // has carried 0.5 * (1 + 0.5677) / 2 ≈ 0.392 heat, moving dashes 600 units each.
  const flux = container.querySelector('[data-flux-edge="a-b"]')
  expect(flux).toHaveAttribute('x1', '100')
  expect(flux).toHaveAttribute('x2', '300')
  expect(Number(flux?.getAttribute('stroke-dashoffset'))).toBeCloseTo(-235.1, 0)
  expect(screen.getByText(/dashes advance with the heat each edge carries/i)).toBeVisible()
})

test('offers click-to-inject on non-source nodes when selection is enabled', () => {
  const selected: string[] = []
  const { container } = render(
    <NetworkView
      analysis={ANALYSIS_FIXTURE}
      positions={{}}
      frame={{ time: 0, state: [1, 0] }}
      onSelectNode={(nodeId) => selected.push(nodeId)}
    />,
  )

  const target = container.querySelector('[data-node-id="b"]')
  fireEvent.pointerEnter(target!)
  expect(container.querySelector('.node-inspector')).toHaveTextContent(/click to inject heat/i)
  fireEvent.click(target!)
  fireEvent.click(container.querySelector('[data-node-id="a"]')!)
  expect(selected).toEqual(['b'])
})

test('omits flux traces once neighbouring nodes reach equilibrium', () => {
  const { container } = render(
    <NetworkView
      analysis={ANALYSIS_FIXTURE}
      positions={{}}
      frame={{ time: 1, state: [0.5, 0.5] }}
    />,
  )

  expect(container.querySelector('[data-flux-edge]')).not.toBeInTheDocument()
})

test('hides heat flux while the Fiedler partition overlay is active', () => {
  const { container } = render(
    <NetworkView
      analysis={ANALYSIS_FIXTURE}
      positions={{}}
      frame={{ time: 0, state: [1, 0] }}
      partition={[
        { nodeId: 'a', value: Math.SQRT1_2, group: 'positive' },
        { nodeId: 'b', value: -Math.SQRT1_2, group: 'negative' },
      ]}
    />,
  )

  expect(container.querySelector('[data-flux-edge]')).not.toBeInTheDocument()
  expect(screen.queryByText(/dashes advance with the heat/i)).not.toBeInTheDocument()
})
