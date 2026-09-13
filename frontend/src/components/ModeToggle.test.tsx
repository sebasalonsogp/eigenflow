import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import type { FiedlerPartition } from '../fiedler'
import { ModeToggle } from './ModeToggle'

const CONNECTED_PARTITION: FiedlerPartition = {
  status: 'available',
  entries: [
    { nodeId: 'left-0', value: -0.5, group: 'negative' },
    { nodeId: 'bridge', value: 0, group: 'boundary' },
    { nodeId: 'right-0', value: 0.5, group: 'positive' },
  ],
}

test('switches from heat to an available Fiedler overlay', () => {
  const onModeChange = vi.fn()
  const { rerender } = render(
    <ModeToggle mode="heat" partition={CONNECTED_PARTITION} onModeChange={onModeChange} />,
  )

  expect(screen.getByRole('button', { name: /heat diffusion/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  fireEvent.click(screen.getByRole('button', { name: /fiedler partition/i }))
  expect(onModeChange).toHaveBeenCalledWith('partition')

  rerender(
    <ModeToggle
      mode="partition"
      partition={CONNECTED_PARTITION}
      onModeChange={onModeChange}
    />,
  )
  expect(screen.getByRole('button', { name: /fiedler partition/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(screen.getByRole('group', { name: /fiedler partition membership/i })).toHaveTextContent(
    'Negative groupleft-0BoundarybridgePositive groupright-0',
  )
})

test('disables the overlay with a truthful disconnected-graph message', () => {
  render(
    <ModeToggle
      mode="heat"
      partition={{
        status: 'unavailable',
        message: 'The graph is disconnected, so one Fiedler partition would be misleading.',
      }}
      onModeChange={vi.fn()}
    />,
  )

  expect(screen.getByRole('button', { name: /fiedler partition/i })).toBeDisabled()
  expect(screen.getByText(/graph is disconnected/i)).toBeVisible()
})

test('explains why a degenerate Fiedler eigenspace has no unique overlay', () => {
  render(
    <ModeToggle
      mode="heat"
      partition={{
        status: 'unavailable',
        message: 'λ₂ belongs to a repeated eigenspace, so this basis vector is not a unique partition.',
      }}
      onModeChange={vi.fn()}
    />,
  )

  expect(screen.getByText(/not a unique partition/i)).toBeVisible()
})
