import type { AnalysisResponse } from '../api'
import { usePlayback } from '../usePlayback'
import { NetworkView, type NodePosition } from './NetworkView'
import { PlaybackControls } from './PlaybackControls'

interface SimulationViewProps {
  analysis: AnalysisResponse
  positions: Record<string, NodePosition>
}

export function SimulationView({ analysis, positions }: SimulationViewProps) {
  const playback = usePlayback(analysis.diffusion.times)
  const sampleIndex = sampleIndexAtTime(
    analysis.diffusion.times,
    playback.currentTime,
  )

  return (
    <>
      <NetworkView
        analysis={analysis}
        positions={positions}
        sampleIndex={sampleIndex}
      />
      <PlaybackControls
        currentTime={playback.currentTime}
        startTime={playback.startTime}
        endTime={playback.endTime}
        isPlaying={playback.isPlaying}
        reducedMotion={playback.reducedMotion}
        onPlay={playback.play}
        onPause={playback.pause}
        onSeek={playback.seek}
        onReset={playback.reset}
      />
    </>
  )
}

function sampleIndexAtTime(times: number[], currentTime: number): number {
  const nextSampleIndex = times.findIndex((time) => time > currentTime)
  return nextSampleIndex < 0
    ? Math.max(times.length - 1, 0)
    : Math.max(nextSampleIndex - 1, 0)
}
