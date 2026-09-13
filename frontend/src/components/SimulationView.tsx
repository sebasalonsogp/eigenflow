import type { AnalysisResponse } from '../api'
import { interpolateDiffusionFrame } from '../diffusionFrame'
import { deriveFiedlerPartition } from '../fiedler'
import { usePlayback } from '../usePlayback'
import { ModeToggle, type NetworkMode } from './ModeToggle'
import { NetworkView, type NodePosition } from './NetworkView'
import { PlaybackControls } from './PlaybackControls'
import { SpectrumView } from './SpectrumView'

interface SimulationViewProps {
  analysis: AnalysisResponse
  positions: Record<string, NodePosition>
  mode: NetworkMode
  onModeChange: (mode: NetworkMode) => void
}

export function SimulationView({
  analysis,
  positions,
  mode,
  onModeChange,
}: SimulationViewProps) {
  const playback = usePlayback(analysis.diffusion.times)
  const partition = deriveFiedlerPartition(analysis)
  const frame = interpolateDiffusionFrame(
    analysis.diffusion.times,
    analysis.diffusion.states,
    playback.currentTime,
  )

  return (
    <>
      <ModeToggle
        mode={mode}
        partition={partition}
        onModeChange={onModeChange}
      />
      <NetworkView
        analysis={analysis}
        positions={positions}
        frame={frame}
        announceChanges={!playback.isPlaying}
        partition={
          mode === 'partition' && partition.status === 'available'
            ? partition.entries
            : undefined
        }
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
      <SpectrumView spectrum={analysis.spectrum} />
    </>
  )
}
