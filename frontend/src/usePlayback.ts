import { useCallback, useEffect, useState } from 'react'

interface PlaybackOptions {
  durationMilliseconds?: number
  reducedMotion?: boolean
}

export interface PlaybackState {
  currentTime: number
  startTime: number
  endTime: number
  isPlaying: boolean
  reducedMotion: boolean
  play: () => void
  pause: () => void
  reset: () => void
  seek: (time: number) => void
}

const DEFAULT_DURATION_MILLISECONDS = 16_000

export function usePlayback(
  times: number[],
  options: PlaybackOptions = {},
): PlaybackState {
  const startTime = times[0] ?? 0
  const endTime = times.at(-1) ?? startTime
  const durationMilliseconds = options.durationMilliseconds
    ?? DEFAULT_DURATION_MILLISECONDS
  const reducedMotion = options.reducedMotion ?? prefersReducedMotion()
  const [currentTime, setCurrentTime] = useState(startTime)
  const [isPlaying, setIsPlaying] = useState(false)

  const pause = useCallback(() => setIsPlaying(false), [])

  const reset = useCallback(() => {
    setIsPlaying(false)
    setCurrentTime(startTime)
  }, [startTime])

  const seek = useCallback((time: number) => {
    setIsPlaying(false)
    setCurrentTime(clamp(time, startTime, endTime))
  }, [endTime, startTime])

  const play = useCallback(() => {
    if (reducedMotion || endTime <= startTime || durationMilliseconds <= 0) return
    setCurrentTime((time) => time >= endTime ? startTime : time)
    setIsPlaying(true)
  }, [durationMilliseconds, endTime, reducedMotion, startTime])

  useEffect(() => {
    if (!isPlaying) return

    let animationFrameId = 0
    let previousTimestamp: number | undefined

    const advance = (timestamp: number) => {
      if (previousTimestamp === undefined) {
        previousTimestamp = timestamp
        animationFrameId = requestAnimationFrame(advance)
        return
      }

      const elapsedMilliseconds = timestamp - previousTimestamp
      previousTimestamp = timestamp
      const timeIncrement = elapsedMilliseconds
        / durationMilliseconds
        * (endTime - startTime)

      setCurrentTime((time) => {
        const nextTime = Math.min(time + timeIncrement, endTime)
        if (nextTime >= endTime) setIsPlaying(false)
        return nextTime
      })
      animationFrameId = requestAnimationFrame(advance)
    }

    animationFrameId = requestAnimationFrame(advance)
    return () => cancelAnimationFrame(animationFrameId)
  }, [durationMilliseconds, endTime, isPlaying, startTime])

  return {
    currentTime,
    startTime,
    endTime,
    isPlaying,
    reducedMotion,
    play,
    pause,
    reset,
    seek,
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}
