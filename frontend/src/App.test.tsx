import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'
import { ANALYSIS_FIXTURE } from './test/analysisFixture'

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

  fireEvent.click(screen.getByRole('button', { name: /^play$/i }))
  fireEvent.change(screen.getByRole('slider', { name: /simulation time/i }), {
    target: { value: '1' },
  })

  expect(screen.getAllByText(/t = 1.00/i)).toHaveLength(2)
  expect(fetchMock.mock.calls.filter(([url]) => url === '/api/analysis')).toHaveLength(
    analysisCallCount,
  )
})
