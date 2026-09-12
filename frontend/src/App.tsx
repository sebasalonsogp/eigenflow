import { useEffect, useState } from 'react'
import { getHealth, type HealthState } from './api'
import './App.css'

const nodes = [
  [82, 70],
  [136, 48],
  [142, 104],
  [194, 74],
  [294, 74],
  [346, 44],
  [352, 102],
  [404, 72],
] as const

const edges = [
  [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3],
  [3, 4],
  [4, 5], [4, 6], [4, 7], [5, 6], [5, 7], [6, 7],
] as const

function App() {
  const [health, setHealth] = useState<HealthState>({ status: 'checking' })

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

        <figure className="graph-preview">
          <svg viewBox="0 0 486 150" role="img" aria-labelledby="preview-title preview-description">
            <title id="preview-title">Two graph communities connected by one bridge</title>
            <desc id="preview-description">
              Eight nodes form two dense groups. A single amber edge connects the groups.
            </desc>
            {edges.map(([source, target], index) => (
              <line
                key={`${source}-${target}`}
                className={index === 6 ? 'bridge' : undefined}
                x1={nodes[source][0]}
                y1={nodes[source][1]}
                x2={nodes[target][0]}
                y2={nodes[target][1]}
              />
            ))}
            {nodes.map(([x, y], index) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="10" data-community={index < 4 ? 'left' : 'right'} />
            ))}
          </svg>
          <figcaption>
            <span>Fast local mixing</span>
            <span className="bridge-label">Slow bridge</span>
            <span>Fast local mixing</span>
          </figcaption>
        </figure>
      </section>

      <section className="project-intent" aria-labelledby="intent-title">
        <p className="section-index">01 / Foundation</p>
        <div>
          <h2 id="intent-title">One model. Three coordinated views.</h2>
          <p>
            The scaffold is ready for the graph, spectrum, and diffusion timeline.
            Each view will be driven by the same Python analysis result so the visual
            story remains mathematically consistent.
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
