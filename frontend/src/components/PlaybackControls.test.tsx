import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { PlaybackControls } from './PlaybackControls'

test('plays, pauses, scrubs, and resets with an explicit time value', () => {
  const onPlay = vi.fn()
  const onPause = vi.fn()
  const onSeek = vi.fn()
  const onReset = vi.fn()
  const { rerender } = render(
    <PlaybackControls
      currentTime={1.25}
      startTime={0}
      endTime={3}
      isPlaying={false}
      reducedMotion={false}
      onPlay={onPlay}
      onPause={onPause}
      onSeek={onSeek}
      onReset={onReset}
    />,
  )

  expect(screen.getByText('t = 1.25')).toBeVisible()
  expect(screen.getByRole('slider', { name: /simulation time/i })).toHaveAttribute(
    'step',
    '0.01',
  )
  fireEvent.click(screen.getByRole('button', { name: /^play$/i }))
  expect(onPlay).toHaveBeenCalledOnce()

  rerender(
    <PlaybackControls
      currentTime={1.25}
      startTime={0}
      endTime={3}
      isPlaying
      reducedMotion={false}
      onPlay={onPlay}
      onPause={onPause}
      onSeek={onSeek}
      onReset={onReset}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: /^pause$/i }))
  fireEvent.change(screen.getByRole('slider', { name: /simulation time/i }), {
    target: { value: '2.5' },
  })
  fireEvent.click(screen.getByRole('button', { name: /reset timeline/i }))

  expect(onPause).toHaveBeenCalledOnce()
  expect(onSeek).toHaveBeenCalledWith(2.5)
  expect(onReset).toHaveBeenCalledOnce()
})

test('keeps manual scrubbing available when reduced motion disables playback', () => {
  render(
    <PlaybackControls
      currentTime={0}
      startTime={0}
      endTime={3}
      isPlaying={false}
      reducedMotion
      onPlay={vi.fn()}
      onPause={vi.fn()}
      onSeek={vi.fn()}
      onReset={vi.fn()}
    />,
  )

  expect(screen.getByRole('button', { name: /^play$/i })).toBeDisabled()
  expect(screen.getByRole('slider', { name: /simulation time/i })).toBeEnabled()
  expect(screen.getByText(/automatic playback is off/i)).toBeVisible()
})
