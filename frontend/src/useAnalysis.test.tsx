import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AnalysisRequest, AnalysisResponse } from './api'
import { ANALYSIS_FIXTURE, ANALYSIS_REQUEST } from './test/analysisFixture'
import { useAnalysis } from './useAnalysis'

afterEach(() => {
  vi.restoreAllMocks()
})

function successResponse(payload: AnalysisResponse) {
  return { ok: true, status: 200, json: async () => payload }
}

describe('useAnalysis', () => {
  it('moves from loading to success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successResponse(ANALYSIS_FIXTURE)))

    const { result } = renderHook(() => useAnalysis(ANALYSIS_REQUEST))

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('success'))
  })

  it('represents validation and network failures separately', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ detail: [{ msg: 'duplicate undirected edge' }] }),
      })
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)

    const { result, rerender } = renderHook(
      ({ request }: { request: AnalysisRequest }) => useAnalysis(request),
      { initialProps: { request: ANALYSIS_REQUEST } },
    )
    await waitFor(() => expect(result.current).toMatchObject({
      status: 'validation-error',
      message: 'duplicate undirected edge',
    }))

    rerender({ request: { ...ANALYSIS_REQUEST, diffusionCoefficient: 0.5 } })
    await waitFor(() => expect(result.current.status).toBe('network-error'))
  })

  it('aborts superseded requests and ignores their late responses', async () => {
    const pending: Array<{
      signal: AbortSignal
      resolve: (response: ReturnType<typeof successResponse>) => void
    }> = []
    vi.stubGlobal('fetch', vi.fn().mockImplementation(
      (_url: string, options: RequestInit) => new Promise((resolve) => {
        pending.push({
          signal: options.signal as AbortSignal,
          resolve: resolve as (response: ReturnType<typeof successResponse>) => void,
        })
      }),
    ))
    const { result, rerender } = renderHook(
      ({ request }: { request: AnalysisRequest }) => useAnalysis(request),
      { initialProps: { request: ANALYSIS_REQUEST } },
    )

    rerender({ request: { ...ANALYSIS_REQUEST, diffusionCoefficient: 0.5 } })
    expect(pending[0].signal.aborted).toBe(true)

    const newest = {
      ...ANALYSIS_FIXTURE,
      diagnostics: { ...ANALYSIS_FIXTURE.diagnostics, maxHeatConservationError: 2e-15 },
    }
    await act(async () => pending[1].resolve(successResponse(newest)))
    await waitFor(() => expect(result.current).toMatchObject({
      status: 'success',
      data: { diagnostics: { maxHeatConservationError: 2e-15 } },
    }))

    await act(async () => pending[0].resolve(successResponse(ANALYSIS_FIXTURE)))
    expect(result.current).toMatchObject({
      status: 'success',
      data: { diagnostics: { maxHeatConservationError: 2e-15 } },
    })
  })

  it('debounces rapid request changes before calling the API', () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockImplementation(() => new Promise(() => undefined))
    vi.stubGlobal('fetch', fetchMock)
    const { rerender, unmount } = renderHook(
      ({ request }: { request: AnalysisRequest }) => useAnalysis(request, 120),
      { initialProps: { request: ANALYSIS_REQUEST } },
    )

    rerender({ request: { ...ANALYSIS_REQUEST, diffusionCoefficient: 0.5 } })
    rerender({ request: { ...ANALYSIS_REQUEST, diffusionCoefficient: 0.25 } })
    act(() => vi.advanceTimersByTime(119))
    expect(fetchMock).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(fetchMock).toHaveBeenCalledOnce()
    const submitted = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(submitted.diffusionCoefficient).toBe(0.25)

    unmount()
    vi.useRealTimers()
  })
})
