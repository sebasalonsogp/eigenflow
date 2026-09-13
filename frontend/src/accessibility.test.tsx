import axe from 'axe-core'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'
import type { AnalysisRequest } from './api'
import { ANALYSIS_FIXTURE } from './test/analysisFixture'
import { analysisForRequest } from './test/analysisForRequest'

afterEach(() => {
  vi.restoreAllMocks()
})

test('has no automated accessibility violations in each experiment', async () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (url === '/api/health') return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', service: 'eigenflow-api' }),
    })

    const request = JSON.parse(options?.body as string) as AnalysisRequest
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => request.nodes.length === 8
        ? ANALYSIS_FIXTURE
        : analysisForRequest(request),
    })
  }))

  render(<App />)
  await screen.findByRole('img', { name: /heat diffusion across 2 graph nodes/i })
  await expectNoViolations()

  fireEvent.click(screen.getByRole('button', { name: /fiedler partition/i }))
  await expectNoViolations()

  fireEvent.click(screen.getByRole('button', { name: /02 path vs complete/i }))
  await screen.findByRole('heading', { name: /local links make distance matter/i })
  await expectNoViolations()

  fireEvent.click(screen.getByRole('button', { name: /^complete$/i }))
  await screen.findByRole('heading', { name: /every node talks to every other/i })
  await expectNoViolations()

  fireEvent.click(screen.getByRole('button', { name: /03 hub vs leaf/i }))
  await screen.findByRole('heading', { name: /hub spreads heat symmetrically/i })
  await expectNoViolations()

  fireEvent.click(screen.getByRole('button', { name: /^leaf$/i }))
  await screen.findByRole('heading', { name: /leaf creates a directional transient/i })
  await expectNoViolations()
})

async function expectNoViolations() {
  const results = await axe.run(document.body, {
    rules: {
      // axe-core cannot calculate rendered contrast under JSDOM; browser QA covers it.
      'color-contrast': { enabled: false },
    },
  })

  expect(results.violations.map(({ id, help, nodes }) => ({
    id,
    help,
    targets: nodes.map((node) => node.target),
  }))).toEqual([])
}
