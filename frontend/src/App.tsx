import { useEffect, useState } from 'react'
import { getHealth, type HealthState } from './api'
import { NetworkView } from './components/NetworkView'
import {
  BOTTLENECK_DISPLAY_SAMPLE_INDEX,
  BOTTLENECK_LAYOUT,
  BOTTLENECK_REQUEST,
} from './experiments/bottleneck'
import { useAnalysis, type AnalysisState } from './useAnalysis'
import './App.css'

function App() {
  const [health, setHealth] = useState<HealthState>({ status: 'checking' })
  const analysis = useAnalysis(BOTTLENECK_REQUEST)

  useEffect(() => {
    const controller = new AbortController()

    getHealth(controller.signal)
      .then(() => setHealth({ status: 'ready' }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setHealth({ status: 'unavailable' })
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Eigenflow home">
          <span className="brand-mark" aria-hidden="true">λ</span>
          Eigenflow
        </a>
        <div className={`engine-status engine-status--${health.status}`} role="status">
          <span aria-hidden="true" />
          {health.status === 'checking' && 'Checking numerical engine'}
          {health.status === 'ready' && 'Numerical engine ready'}
          {health.status === 'unavailable' && 'Start the Python API to connect'}
        </div>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Spectral graph diffusion</p>
          <h1 id="hero-title">Structure shapes how signals move.</h1>
          <p className="hero-summary">
            An interactive study of heat flow, bottlenecks, and the Laplacian
            eigenmodes that make a network’s hidden geometry visible.
          </p>
          <div className="formula" aria-label="x of t equals e to the negative L t times x of zero">
            x(t) = e<sup>−Lt</sup>x(0)
          </div>
        </div>

        <div className="experiment-panel">
          <div className="experiment-label">
            <span>Experiment 01 · weak bridge</span>
            <span>Computed sample</span>
          </div>
          <AnalysisVisual state={analysis} />
        </div>
      </section>

      <section className="project-intent" aria-labelledby="intent-title">
        <p className="section-index">01 / Working model</p>
        <div>
          <h2 id="intent-title">Python computes. D3 makes it visible.</h2>
          <p>
            The numerical engine validates the graph, constructs its Laplacian,
            decomposes the spectrum, and solves heat flow. The network above is the
            first view driven by that single aligned result—not a decorative sketch.
          </p>
        </div>
      </section>
    </main>
  )
}

function AnalysisVisual({ state }: { state: AnalysisState }) {
  if (state.status === 'success') {
    return (
      <NetworkView
        analysis={state.data}
        positions={BOTTLENECK_LAYOUT}
        sampleIndex={BOTTLENECK_DISPLAY_SAMPLE_INDEX}
      />
    )
  }

  if (state.status === 'loading') {
    return (
      <div className="analysis-state" role="status" aria-busy="true">
        <span className="analysis-state-mark" aria-hidden="true">λ</span>
        <strong>Solving the Laplacian system</strong>
        <span>Validating graph · decomposing spectrum · sampling heat</span>
      </div>
    )
  }

  if (state.status === 'validation-error') {
    return (
      <div className="analysis-state analysis-state--error" role="alert">
        <span className="analysis-state-mark" aria-hidden="true">!</span>
        <strong>Analysis request rejected</strong>
        <span>{state.message}</span>
      </div>
    )
  }

  return (
    <div className="analysis-state analysis-state--error" role="alert">
      <span className="analysis-state-mark" aria-hidden="true">!</span>
      <strong>Analysis unavailable</strong>
      <span>Start the Python API and reload to compute the experiment.</span>
    </div>
  )
}

export default App
