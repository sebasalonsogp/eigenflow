import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'

afterEach(() => {
  vi.restoreAllMocks()
})

test('introduces the spectral diffusion project', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ status: 'ok', service: 'eigenflow-api' }),
  }))

  render(<App />)

  expect(screen.getByRole('heading', { name: /structure shapes how signals move/i })).toBeVisible()
  expect(await screen.findByText(/numerical engine ready/i)).toBeVisible()
})
