import { useEffect, useState } from 'react'
import {
  AnalysisApiError,
  analyzeGraph,
  type AnalysisRequest,
  type AnalysisResponse,
} from './api'

export type AnalysisState =
  // previous keeps the last successful result drawable while a new request runs.
  | { status: 'loading'; previous?: AnalysisResponse }
  | { status: 'success'; data: AnalysisResponse }
  | { status: 'validation-error'; message: string }
  | { status: 'network-error'; message: string }

interface RequestSnapshot {
  request: AnalysisRequest
  state: AnalysisState
  lastSuccess?: AnalysisResponse
}

const LOADING_STATE: AnalysisState = { status: 'loading' }

export function useAnalysis(
  request: AnalysisRequest,
  debounceMilliseconds = 0,
): AnalysisState {
  const [snapshot, setSnapshot] = useState<RequestSnapshot>({
    request,
    state: LOADING_STATE,
  })

  useEffect(() => {
    const controller = new AbortController()
    let acceptsResult = true

    const startRequest = () => {
      analyzeGraph(request, controller.signal)
        .then((data) => {
          if (acceptsResult) {
            setSnapshot({ request, state: { status: 'success', data }, lastSuccess: data })
          }
        })
        .catch((error: unknown) => {
          if (!acceptsResult || isAbortError(error)) return
          if (error instanceof AnalysisApiError && error.kind === 'validation') {
            setSnapshot((previous) => ({
              request,
              state: { status: 'validation-error', message: error.message },
              lastSuccess: previous.lastSuccess,
            }))
            return
          }
          setSnapshot((previous) => ({
            request,
            state: {
              status: 'network-error',
              message: error instanceof Error ? error.message : 'Could not load graph analysis',
            },
            lastSuccess: previous.lastSuccess,
          }))
        })
    }
    const timeoutId = debounceMilliseconds > 0
      ? window.setTimeout(startRequest, debounceMilliseconds)
      : undefined
    if (timeoutId === undefined) startRequest()

    return () => {
      acceptsResult = false
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [debounceMilliseconds, request])

  if (snapshot.request === request) return snapshot.state
  return snapshot.lastSuccess
    ? { status: 'loading', previous: snapshot.lastSuccess }
    : LOADING_STATE
}

function isAbortError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'name' in error
    && error.name === 'AbortError'
}
