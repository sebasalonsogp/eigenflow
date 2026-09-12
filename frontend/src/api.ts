export interface HealthResponse {
  status: 'ok'
  service: 'eigenflow-api'
}

export type HealthState =
  | { status: 'checking' }
  | { status: 'ready' }
  | { status: 'unavailable' }

function isHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return candidate.status === 'ok' && candidate.service === 'eigenflow-api'
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch('/api/health', { signal })
  if (!response.ok) throw new Error(`Health check failed with status ${response.status}`)

  const payload: unknown = await response.json()
  if (!isHealthResponse(payload)) throw new Error('Health check returned an invalid response')
  return payload
}
