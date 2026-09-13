import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { ExperimentPicker } from './ExperimentPicker'

const experiments = [
  {
    id: 'bottleneck' as const,
    sequence: '01',
    label: 'Bottleneck',
    question: 'How much can one weak edge slow global diffusion?',
  },
  {
    id: 'path-complete' as const,
    sequence: '02',
    label: 'Path vs complete',
    question: 'How much does connectivity change diffusion at the same graph size?',
  },
]

test('presents the active experiment question and changes experiments explicitly', () => {
  const onSelect = vi.fn()
  render(
    <ExperimentPicker
      experiments={experiments}
      activeId="bottleneck"
      onSelect={onSelect}
    />,
  )

  expect(screen.getByRole('button', { name: /01 bottleneck/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(screen.getByText(/one weak edge slow global diffusion/i)).toBeVisible()

  fireEvent.click(screen.getByRole('button', { name: /02 path vs complete/i }))
  expect(onSelect).toHaveBeenCalledWith('path-complete')
})
