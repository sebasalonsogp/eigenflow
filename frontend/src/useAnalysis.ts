import { useEffect, useState } from 'react'
import {
  AnalysisApiError,
  analyzeGraph,
  type AnalysisRequest,
  type AnalysisResponse,
} from './api'

export type AnalysisState =
  | { status: 'loading' }
  | { status: 'success'; data: AnalysisResponse }
  | { status: 'validation-error'; message: string }
  | { status: 'network-error'; message: string }

interface RequestSnapshot {
  request: AnalysisRequest
  state: AnalysisState
}

const LOADING_STATE: AnalysisState = { status: 'loading' }

export function useAnalysis(request: AnalysisRequest): AnalysisState {
  const [snapshot, setSnapshot] = useState<RequestSnapshot>({
    request,
    state: LOADING_STATE,
  })

  useEffect(() => {
    const controller = new AbortController()
    let acceptsResult = true

    analyzeGraph(request, controller.signal)
      .then((data) => {
        if (acceptsResult) {
          setSnapshot({ request, state: { status: 'success', data } })
        }
      })
      .catch((error: unknown) => {
        if (!acceptsResult || isAbortError(error)) return
        if (error instanceof AnalysisApiError && error.kind === 'validation') {
          setSnapshot({
            request,
            state: { status: 'validation-error', message: error.message },
          })
          return
        }
        setSnapshot({
          request,
          state: {
            status: 'network-error',
            message: error instanceof Error ? error.message : 'Could not load graph analysis',
          },
        })
      })

    return () => {
      acceptsResult = false
      controller.abort()
    }
  }, [request])

  return snapshot.request === request ? snapshot.state : LOADING_STATE
}

function isAbortError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'name' in error
    && error.name === 'AbortError'
}
