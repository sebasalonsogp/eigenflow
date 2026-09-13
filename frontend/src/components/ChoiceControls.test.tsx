import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { STAR_EXPERIMENT } from '../experiments/star'
import { ChoiceControls } from './ChoiceControls'

test('renders a bounded experiment choice and its fixed context', () => {
  const onChange = vi.fn()
  const onReset = vi.fn()
  render(
    <ChoiceControls
      value="hub"
      fixedLabel="Fixed network"
      fixedValue="Six-node star"
      control={STAR_EXPERIMENT.control}
      onChange={onChange}
      onReset={onReset}
    />,
  )

  expect(screen.getByLabelText(/fixed network six-node star/i)).toBeVisible()
  expect(screen.getByRole('button', { name: /^hub$/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(screen.getByRole('button', { name: /^reset experiment$/i })).toBeDisabled()

  fireEvent.click(screen.getByRole('button', { name: /^leaf$/i }))
  expect(onChange).toHaveBeenCalledWith('leaf-0')
})

test('resets a non-default choice', () => {
  const onReset = vi.fn()
  render(
    <ChoiceControls
      value="leaf-0"
      fixedLabel="Fixed network"
      fixedValue="Six-node star"
      control={STAR_EXPERIMENT.control}
      onChange={vi.fn()}
      onReset={onReset}
    />,
  )

  const reset = screen.getByRole('button', { name: /^reset experiment$/i })
  expect(reset).toBeEnabled()
  fireEvent.click(reset)
  expect(onReset).toHaveBeenCalledOnce()
})
