import { useEffect, useState } from 'react'
import { getHealth, type HealthState } from './api'
import { ExperimentExperience } from './components/ExperimentExperience'
import './App.css'

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

      <ExperimentExperience />
    </main>
  )
}

export default App
