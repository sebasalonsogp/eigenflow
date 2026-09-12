import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnalysisApiError, analyzeGraph } from './api'
import { ANALYSIS_FIXTURE, ANALYSIS_REQUEST } from './test/analysisFixture'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('analyzeGraph', () => {
  it('returns an aligned analysis response from the API boundary', async () => {
    const signal = new AbortController().signal
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ANALYSIS_FIXTURE,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(analyzeGraph(ANALYSIS_REQUEST, signal)).resolves.toEqual(ANALYSIS_FIXTURE)
    expect(fetchMock).toHaveBeenCalledWith('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ANALYSIS_REQUEST),
      signal,
    })
  })

  it('rejects a successful response whose aligned dimensions are invalid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...ANALYSIS_FIXTURE, nodeOrder: ['a'] }),
    }))

    await expect(analyzeGraph(ANALYSIS_REQUEST)).rejects.toMatchObject({
      kind: 'invalid-response',
      message: 'Analysis returned an invalid response',
    })
  })

  it('preserves an actionable API validation message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        detail: [{
          type: 'graph_validation',
          loc: ['body', 'graph'],
          msg: "self-loop is not supported: 'a'",
        }],
      }),
    }))

    const error = await analyzeGraph(ANALYSIS_REQUEST).catch((reason: unknown) => reason)

    expect(error).toBeInstanceOf(AnalysisApiError)
    expect(error).toMatchObject({
      kind: 'validation',
      message: "self-loop is not supported: 'a'",
    })
  })
})
