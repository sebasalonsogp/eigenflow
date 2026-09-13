import type { AnalysisResponse } from '../api'
import { interpolateDiffusionFrame } from '../diffusionFrame'
import { usePlayback } from '../usePlayback'
import { NetworkView, type NodePosition } from './NetworkView'
import { PlaybackControls } from './PlaybackControls'

interface SimulationViewProps {
  analysis: AnalysisResponse
  positions: Record<string, NodePosition>
}

export function SimulationView({ analysis, positions }: SimulationViewProps) {
  const playback = usePlayback(analysis.diffusion.times)
  const frame = interpolateDiffusionFrame(
    analysis.diffusion.times,
    analysis.diffusion.states,
    playback.currentTime,
  )

  return (
    <>
      <NetworkView
        analysis={analysis}
        positions={positions}
        frame={frame}
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
