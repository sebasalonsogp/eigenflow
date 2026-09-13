import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'
import type { AnalysisRequest } from './api'
import { ANALYSIS_FIXTURE } from './test/analysisFixture'
import { analysisForRequest } from './test/analysisForRequest'

afterEach(() => {
  vi.restoreAllMocks()
})

test('introduces the spectral diffusion project', async () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => Promise.resolve({
    ok: true,
    status: 200,
    json: async () => url === '/api/health'
      ? { status: 'ok', service: 'eigenflow-api' }
      : ANALYSIS_FIXTURE,
  })))

  render(<App />)

  expect(screen.getByRole('heading', { name: /structure shapes how signals move/i })).toBeVisible()
  expect(await screen.findByText(/numerical engine ready/i)).toBeVisible()
  expect(await screen.findByRole('img', { name: /heat diffusion across 2 graph nodes/i })).toBeVisible()
  expect(screen.getByText(/python computes. d3 makes it visible/i)).toBeVisible()
})

test('offers a keyboard shortcut to the interactive experiment', () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if (url === '/api/health') return new Promise(() => undefined)
    return new Promise(() => undefined)
  }))

  render(<App />)

  expect(screen.getByRole('link', { name: /skip to interactive experiment/i })).toHaveAttribute(
    'href',
    '#experiment-workspace',
  )
  expect(screen.getByRole('region', { name: /interactive experiment/i })).toHaveAttribute(
    'tabindex',
    '-1',
  )
})

test('holds the visualization layout while analysis is loading', () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if (url === '/api/health') return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', service: 'eigenflow-api' }),
    })
    return new Promise(() => undefined)
  }))

  render(<App />)

  expect(screen.getByText(/solving the laplacian system/i)).toBeVisible()
})

test('shows an actionable error without collapsing the visualization', async () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if (url === '/api/health') return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', service: 'eigenflow-api' }),
    })
    return Promise.reject(new TypeError('Failed to fetch'))
  }))

  render(<App />)

  expect(await screen.findByText(/analysis unavailable/i)).toBeVisible()
  expect(screen.getByText(/start the python api and reload/i)).toBeVisible()
})

test('submits changed bottleneck parameters and resets the controls', async () => {
  const fetchMock = vi.fn().mockImplementation((url: string) => Promise.resolve({
    ok: true,
    status: 200,
    json: async () => url === '/api/health'
      ? { status: 'ok', service: 'eigenflow-api' }
      : ANALYSIS_FIXTURE,
  }))
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await screen.findByRole('img', { name: /heat diffusion across 2 graph nodes/i })

  fireEvent.change(screen.getByRole('slider', { name: /bridge strength/i }), {
    target: { value: '0.8' },
  })
  fireEvent.change(screen.getByRole('combobox', { name: /heat source/i }), {
    target: { value: 'right-2' },
  })

  await waitFor(() => {
    const analysisCalls = fetchMock.mock.calls.filter(([url]) => url === '/api/analysis')
    const latestRequest = JSON.parse(analysisCalls.at(-1)?.[1].body as string)
    expect(latestRequest.heatSource).toBe('right-2')
    expect(latestRequest.edges.find((edge: { weight: number }) => edge.weight < 1).weight).toBe(0.8)
  })

  fireEvent.click(screen.getByRole('button', { name: /01 bottleneck/i }))
  expect(screen.getByRole('slider', { name: /bridge strength/i })).toHaveValue('0.8')
  expect(screen.getByRole('combobox', { name: /heat source/i })).toHaveValue('right-2')

  fireEvent.click(screen.getByRole('button', { name: /reset experiment/i }))
  expect(screen.getByRole('slider', { name: /bridge strength/i })).toHaveValue('0.1')
  expect(screen.getByRole('combobox', { name: /heat source/i })).toHaveValue('left-0')
})

test('plays and scrubs returned samples without issuing another analysis request', async () => {
  const fetchMock = vi.fn().mockImplementation((url: string) => Promise.resolve({
    ok: true,
    status: 200,
    json: async () => url === '/api/health'
      ? { status: 'ok', service: 'eigenflow-api' }
      : ANALYSIS_FIXTURE,
  }))
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  render(<App />)
  await screen.findByRole('img', { name: /heat diffusion across 2 graph nodes/i })
  const analysisCallCount = fetchMock.mock.calls
    .filter(([url]) => url === '/api/analysis').length
  expect(screen.getAllByText(/t = 0.00/i)).toHaveLength(2)

  fireEvent.click(screen.getByRole('button', { name: /^play$/i }))
  fireEvent.change(screen.getByRole('slider', { name: /simulation time/i }), {
    target: { value: '0.5' },
  })
  expect(screen.getAllByText(/t = 0.50/i)).toHaveLength(2)

  fireEvent.change(screen.getByRole('slider', { name: /simulation time/i }), {
    target: { value: '1' },
  })
  expect(screen.getAllByText(/t = 1.00/i)).toHaveLength(2)

  fireEvent.click(screen.getByRole('button', { name: /reset timeline/i }))
  expect(screen.getAllByText(/t = 0.00/i)).toHaveLength(2)
  expect(fetchMock.mock.calls.filter(([url]) => url === '/api/analysis')).toHaveLength(
    analysisCallCount,
  )
})

test('keeps the community transfer readout focused on the bottleneck experiment', async () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => Promise.resolve({
    ok: true,
    status: 200,
    json: async () => url === '/api/health'
      ? { status: 'ok', service: 'eigenflow-api' }
      : ANALYSIS_FIXTURE,
  })))
  render(<App />)

  expect(await screen.findByRole('region', {
    name: /community heat balance/i,
  })).toBeVisible()
  expect(screen.getByText(/track how much heat crosses the single bridge/i)).toBeVisible()

  fireEvent.click(screen.getByRole('button', { name: /02 path vs complete/i }))

  await waitFor(() => {
    expect(screen.queryByRole('region', {
      name: /community heat balance/i,
    })).not.toBeInTheDocument()
  })
})

test('toggles the Fiedler overlay without changing the experiment request', async () => {
  const fetchMock = vi.fn().mockImplementation((url: string) => Promise.resolve({
    ok: true,
    status: 200,
    json: async () => url === '/api/health'
      ? { status: 'ok', service: 'eigenflow-api' }
      : ANALYSIS_FIXTURE,
  }))
  vi.stubGlobal('fetch', fetchMock)
  const { container } = render(<App />)
  await screen.findByRole('img', { name: /heat diffusion across 2 graph nodes/i })
  const analysisCallCount = fetchMock.mock.calls
    .filter(([url]) => url === '/api/analysis').length

  fireEvent.click(screen.getByRole('button', { name: /fiedler partition/i }))

  expect(screen.getByRole('button', { name: /fiedler partition/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(container.querySelector('[data-node-id="a"]')).toHaveAttribute(
    'data-partition',
    'positive',
  )
  expect(fetchMock.mock.calls.filter(([url]) => url === '/api/analysis')).toHaveLength(
    analysisCallCount,
  )
})

test('updates the spectral explanation from the active bridge analysis', async () => {
  const fetchMock = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (url === '/api/health') return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', service: 'eigenflow-api' }),
    })

    const request = JSON.parse(options?.body as string)
    const bridgeWeight = request.edges.find(
      (edge: { source: string; target: string }) =>
        edge.source === 'left-3' && edge.target === 'right-0',
    ).weight
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        ...ANALYSIS_FIXTURE,
        spectrum: {
          ...ANALYSIS_FIXTURE.spectrum,
          eigenvalues: [0, bridgeWeight === 1.5 ? 0.6 : 0.05],
          algebraicConnectivity: bridgeWeight === 1.5 ? 0.6 : 0.05,
        },
      }),
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)

  expect(await screen.findByRole('heading', { name: /one weak edge sets the pace/i })).toBeVisible()
  expect(screen.getByText(/backend reports λ₂ = 0.050/i)).toBeVisible()

  fireEvent.change(screen.getByRole('slider', { name: /bridge strength/i }), {
    target: { value: '1.5' },
  })

  expect(await screen.findByRole('heading', {
    name: /bridge is no longer the weakest edge/i,
  })).toBeVisible()
  expect(screen.getByText(/backend reports λ₂ = 0.600/i)).toBeVisible()
})

test('compares path and complete topology without carrying obsolete experiment state', async () => {
  const analysisRequests: AnalysisRequest[] = []
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (url === '/api/health') return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', service: 'eigenflow-api' }),
    })

    const request = JSON.parse(options?.body as string) as AnalysisRequest
    analysisRequests.push(request)
    const isComparison = request.nodes[0]?.id === 'node-0'
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => isComparison
        ? analysisForRequest(request)
        : ANALYSIS_FIXTURE,
    })
  }))
  render(<App />)
  await screen.findByRole('img', { name: /heat diffusion across 2 graph nodes/i })

  fireEvent.click(screen.getByRole('button', { name: /02 path vs complete/i }))

  expect(await screen.findByRole('heading', {
    name: /local links make distance matter/i,
  })).toBeVisible()
  expect(screen.getByText(/topology—not graph size/i)).toBeVisible()
  expect(screen.getByRole('button', { name: /^path$/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  const pathRequest = analysisRequests.at(-1)
  expect(pathRequest?.nodes).toHaveLength(6)
  expect(pathRequest?.edges).toHaveLength(5)
  expect(pathRequest?.heatSource).toBe('node-0')

  fireEvent.change(screen.getByRole('slider', { name: /simulation time/i }), {
    target: { value: '2' },
  })
  expect(screen.getByRole('slider', { name: /simulation time/i })).toHaveValue('2')
  fireEvent.click(screen.getByRole('button', { name: /^complete$/i }))

  expect(await screen.findByRole('heading', {
    name: /every node talks to every other/i,
  })).toBeVisible()
  const completeRequest = analysisRequests.at(-1)
  expect(completeRequest?.edges).toHaveLength(15)
  expect(completeRequest?.nodes).toEqual(pathRequest?.nodes)
  expect(completeRequest?.heatSource).toBe(pathRequest?.heatSource)
  expect(completeRequest?.times).toEqual(pathRequest?.times)
  expect(screen.getByRole('slider', { name: /simulation time/i })).toHaveValue('0')

  fireEvent.click(screen.getByRole('button', { name: /01 bottleneck/i }))
  fireEvent.click(screen.getByRole('button', { name: /02 path vs complete/i }))
  expect(await screen.findByRole('button', { name: /^path$/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('compares hub and leaf sources without changing the star graph', async () => {
  const analysisRequests: AnalysisRequest[] = []
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (url === '/api/health') return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', service: 'eigenflow-api' }),
    })

    const request = JSON.parse(options?.body as string) as AnalysisRequest
    analysisRequests.push(request)
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => request.nodes[0]?.id === 'hub'
        ? analysisForRequest(request)
        : ANALYSIS_FIXTURE,
    })
  }))
  render(<App />)
  await screen.findByRole('img', { name: /heat diffusion across 2 graph nodes/i })

  fireEvent.click(screen.getByRole('button', { name: /03 hub vs leaf/i }))

  expect(await screen.findByRole('heading', {
    name: /hub spreads heat symmetrically/i,
  })).toBeVisible()
  expect(screen.getByLabelText(/fixed network six-node star/i)).toBeVisible()
  expect(screen.getByRole('button', { name: /^hub$/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  const hubRequest = analysisRequests.at(-1)
  expect(hubRequest?.nodes).toHaveLength(6)
  expect(hubRequest?.edges).toHaveLength(5)
  expect(hubRequest?.heatSource).toBe('hub')

  fireEvent.change(screen.getByRole('slider', { name: /simulation time/i }), {
    target: { value: '0.5' },
  })
  fireEvent.click(screen.getByRole('button', { name: /^leaf$/i }))

  expect(await screen.findByRole('heading', {
    name: /leaf creates a directional transient/i,
  })).toBeVisible()
  const leafRequest = analysisRequests.at(-1)
  expect(leafRequest).toEqual({ ...hubRequest, heatSource: 'leaf-0' })
  expect(screen.getByRole('slider', { name: /simulation time/i })).toHaveValue('0')
  expect(screen.getByRole('button', { name: /fiedler partition/i })).toBeDisabled()

  fireEvent.click(screen.getByRole('button', { name: /01 bottleneck/i }))
  fireEvent.click(screen.getByRole('button', { name: /03 hub vs leaf/i }))
  expect(await screen.findByRole('button', { name: /^hub$/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
