import { render, screen } from '@testing-library/react'
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
