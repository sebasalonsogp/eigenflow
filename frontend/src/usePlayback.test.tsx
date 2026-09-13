import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePlayback } from './usePlayback'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePlayback', () => {
  it('scrubs, pauses, and resets deterministically', () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const { result } = renderHook(() => usePlayback([0, 1, 3], {
      durationMilliseconds: 3000,
      reducedMotion: false,
    }))

    act(() => result.current.seek(1.5))
    expect(result.current).toMatchObject({ currentTime: 1.5, isPlaying: false })

    act(() => result.current.play())
    expect(result.current.isPlaying).toBe(true)
    act(() => result.current.pause())
    expect(result.current).toMatchObject({ currentTime: 1.5, isPlaying: false })

    act(() => result.current.reset())
    expect(result.current).toMatchObject({ currentTime: 0, isPlaying: false })
  })

  it('advances through the simulation domain and stops at the end', () => {
    let nextFrame: FrameRequestCallback | undefined
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      nextFrame = callback
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const { result } = renderHook(() => usePlayback([0, 1, 3], {
      durationMilliseconds: 3000,
      reducedMotion: false,
    }))

    act(() => result.current.play())
    act(() => nextFrame?.(1000))
    act(() => nextFrame?.(2000))
    expect(result.current.currentTime).toBeCloseTo(1)

    act(() => nextFrame?.(4000))
    expect(result.current).toMatchObject({ currentTime: 3, isPlaying: false })
  })

  it('gives the default bottleneck transient enough time to be observed', () => {
    let nextFrame: FrameRequestCallback | undefined
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      nextFrame = callback
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const { result } = renderHook(() => usePlayback([0, 24], {
      reducedMotion: false,
    }))

    act(() => result.current.play())
    act(() => nextFrame?.(1000))
    act(() => nextFrame?.(2000))

    expect(result.current.currentTime).toBeCloseTo(1.5)
  })

  it('blocks automatic playback but keeps manual scrubbing under reduced motion', () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const { result } = renderHook(() => usePlayback([0, 2], {
      reducedMotion: true,
    }))

    act(() => result.current.play())
    expect(result.current.isPlaying).toBe(false)

    act(() => result.current.seek(1))
    expect(result.current.currentTime).toBe(1)
  })
})
