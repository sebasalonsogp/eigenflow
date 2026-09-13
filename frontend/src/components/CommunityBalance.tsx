import './CommunityBalance.css'

interface CommunityBalanceProps {
  nodeOrder: string[]
  state: number[]
  sourceId: string
  announceChanges: boolean
}

export function CommunityBalance({
  nodeOrder,
  state,
  sourceId,
  announceChanges,
}: CommunityBalanceProps) {
  const leftHeat = sumCommunityHeat(nodeOrder, state, 'left-')
  const rightHeat = sumCommunityHeat(nodeOrder, state, 'right-')
  const totalHeat = leftHeat + rightHeat
  const leftShare = totalHeat > 0 ? leftHeat / totalHeat : 0
  const rightShare = totalHeat > 0 ? rightHeat / totalHeat : 0
  const crossedShare = sourceId.startsWith('right-') ? leftShare : rightShare
  const leftPercent = leftShare * 100
  const rightPercent = rightShare * 100

  return (
    <section className="community-balance" aria-label="Community heat balance">
      <div className="community-balance-intro">
        <span>What to watch</span>
        <p>Track how much heat crosses the single bridge.</p>
      </div>

      <div className="community-balance-values" aria-hidden="true">
        <span>Left cluster <strong>{formatPercent(leftShare)}</strong></span>
        <span>Right cluster <strong>{formatPercent(rightShare)}</strong></span>
      </div>

      <svg
        className="community-balance-track"
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        role="img"
        aria-label={
          `Left cluster holds ${formatPercent(leftShare)}. `
          + `Right cluster holds ${formatPercent(rightShare)}.`
        }
      >
        <rect className="community-balance-left" width={leftPercent} height="8" />
        <rect
          className="community-balance-right"
          x={leftPercent}
          width={rightPercent}
          height="8"
        />
      </svg>

      <p className="community-balance-crossed">
        <span>Across the bridge</span>
        <output aria-live={announceChanges ? 'polite' : 'off'}>
          {formatPercent(crossedShare)}
        </output>
      </p>
    </section>
  )
}

function sumCommunityHeat(
  nodeOrder: string[],
  state: number[],
  prefix: string,
): number {
  return nodeOrder.reduce((total, nodeId, index) => (
    nodeId.startsWith(prefix) ? total + Math.max(state[index] ?? 0, 0) : total
  ), 0)
}

function formatPercent(share: number): string {
  return `${(share * 100).toFixed(1)}%`
}
