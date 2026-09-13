import { useId } from 'react'
import type { FiedlerPartition, PartitionGroup } from '../fiedler'
import './ModeToggle.css'

export type NetworkMode = 'heat' | 'partition'

interface ModeToggleProps {
  mode: NetworkMode
  partition: FiedlerPartition
  onModeChange: (mode: NetworkMode) => void
}

const GROUP_LABELS: Record<PartitionGroup, string> = {
  negative: 'Negative group',
  boundary: 'Boundary',
  positive: 'Positive group',
}

export function ModeToggle({ mode, partition, onModeChange }: ModeToggleProps) {
  const limitationId = `${useId().replaceAll(':', '')}-fiedler-limitation`
  const activeMode = partition.status === 'available' ? mode : 'heat'

  return (
    <section className="mode-toggle" aria-label="Network encoding">
      <div className="mode-toggle-buttons" role="group" aria-label="Network encoding">
        <button
          type="button"
          aria-pressed={activeMode === 'heat'}
          onClick={() => onModeChange('heat')}
        >
          Heat diffusion
        </button>
        <button
          type="button"
          aria-pressed={activeMode === 'partition'}
          aria-describedby={partition.status === 'unavailable' ? limitationId : undefined}
          disabled={partition.status === 'unavailable'}
          onClick={() => onModeChange('partition')}
        >
          Fiedler partition
        </button>
      </div>

      {partition.status === 'unavailable' && (
        <p className="mode-limitation" id={limitationId}>{partition.message}</p>
      )}

      {partition.status === 'available' && activeMode === 'partition' && (
        <dl className="partition-membership" aria-label="Fiedler partition membership">
          {(['negative', 'boundary', 'positive'] as const).map((group) => {
            const nodeIds = partition.entries
              .filter((entry) => entry.group === group)
              .map((entry) => entry.nodeId)
            if (nodeIds.length === 0) return null
            return (
              <div key={group} data-partition-group={group}>
                <dt>{GROUP_LABELS[group]}</dt>
                <dd>{nodeIds.join(', ')}</dd>
              </div>
            )
          })}
        </dl>
      )}
    </section>
  )
}
