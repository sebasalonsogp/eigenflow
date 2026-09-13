import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { PATH_COMPLETE_EXPERIMENT } from '../experiments/pathComplete'
import { PathCompleteControls } from './PathCompleteControls'

test('switches topology while keeping the initial heat source explicit', () => {
  const onTopologyChange = vi.fn()
  const onReset = vi.fn()
  render(
    <PathCompleteControls
      topology="path"
      heatSource="node-0"
      control={PATH_COMPLETE_EXPERIMENT.control}
      onTopologyChange={onTopologyChange}
      onReset={onReset}
    />,
  )

  expect(screen.getByLabelText(/fixed source node-0/i)).toBeVisible()
  expect(screen.getByRole('button', { name: /^path$/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(screen.getByRole('button', { name: /^reset experiment$/i })).toBeDisabled()

  fireEvent.click(screen.getByRole('button', { name: /^complete$/i }))
  expect(onTopologyChange).toHaveBeenCalledWith('complete')
})

test('resets a non-default topology', () => {
  const onReset = vi.fn()
  render(
    <PathCompleteControls
      topology="complete"
      heatSource="node-0"
      control={PATH_COMPLETE_EXPERIMENT.control}
      onTopologyChange={vi.fn()}
      onReset={onReset}
    />,
  )

  const reset = screen.getByRole('button', { name: /^reset experiment$/i })
  expect(reset).toBeEnabled()
  fireEvent.click(reset)
  expect(onReset).toHaveBeenCalledOnce()
})
