import { useMemo } from 'react'
import type { AnalysisResponse } from '../api'
import { interpolateDiffusionFrame } from '../diffusionFrame'
import type { ExperimentId } from '../experiments'
import { deriveFiedlerPartition } from '../fiedler'
import { equilibriumDistances, timeToMix } from '../mixing'
import { usePlayback } from '../usePlayback'
import { CommunityBalance } from './CommunityBalance'
import { LiveReadout } from './LiveReadout'
import { MixingCurve } from './MixingCurve'
import { ModeToggle, type NetworkMode } from './ModeToggle'
import { NetworkView, type NodePosition } from './NetworkView'
import { PlaybackControls } from './PlaybackControls'
import { SpectrumView } from './SpectrumView'

interface SimulationViewProps {
  analysis: AnalysisResponse
  comparison?: AnalysisResponse
  experimentId: ExperimentId
  title: string
  positions: Record<string, NodePosition>
  mode: NetworkMode
  updating?: boolean
  onModeChange: (mode: NetworkMode) => void
  onSelectSource?: (nodeId: string) => void
}

export function SimulationView({
  analysis,
  comparison,
  experimentId,
  title,
  positions,
  mode,
  updating = false,
  onModeChange,
  onSelectSource,
}: SimulationViewProps) {
  const { diffusion, spectrum } = analysis
  const playback = usePlayback(diffusion.times)
  const partition = deriveFiedlerPartition(analysis)
  const frame = interpolateDiffusionFrame(diffusion.times, diffusion.states, playback.currentTime)
  const sourceIndex = diffusion.initialState.indexOf(Math.max(...diffusion.initialState))
  const sourceId = analysis.nodeOrder[sourceIndex] ?? ''
  const distances = useMemo(() => equilibriumDistances(diffusion.states), [diffusion.states])
  const comparisonCurve = useMemo(() => {
    if (!comparison || comparison === analysis) return undefined
    const lambdaTwo = comparison.spectrum.algebraicConnectivity
    return {
      times: comparison.diffusion.times,
      values: equilibriumDistances(comparison.diffusion.states),
      label: `previous λ₂ = ${lambdaTwo === null ? '—' : lambdaTwo.toFixed(3)}`,
    }
  }, [analysis, comparison])
  const currentDistance = equilibriumDistances([diffusion.initialState, frame.state])[1] ?? 0
  const decayRate = spectrum.zeroEigenvalueMultiplicity === 1 && spectrum.algebraicConnectivity
    ? diffusion.diffusionCoefficient * spectrum.algebraicConnectivity
    : undefined

  return (
    <>
      <div
        className={`lab-stage${updating ? ' lab-stage--updating' : ''}`}
        aria-busy={updating}
      >
        <header className="stage-header">
          <p className="stage-title">
            {title}
            <span className="stage-status" role="status">
              {updating ? 'Recomputing spectrum' : 'Live'}
            </span>
          </p>
          <ModeToggle mode={mode} partition={partition} onModeChange={onModeChange} />
        </header>
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
          chart={(
            <MixingCurve
              times={diffusion.times}
              values={distances}
              currentTime={frame.time}
              currentValue={currentDistance}
              decayRate={decayRate}
              comparison={comparisonCurve}
            />
          )}
        />
        <NetworkView
          analysis={analysis}
          positions={positions}
          frame={frame}
          announceChanges={!playback.isPlaying}
          onSelectNode={onSelectSource}
          partition={
            mode === 'partition' && partition.status === 'available'
              ? partition.entries
              : undefined
          }
        />
      </div>
      <div className="lab-side">
        <LiveReadout
          algebraicConnectivity={spectrum.algebraicConnectivity}
          zeroModes={spectrum.zeroEigenvalueMultiplicity}
          mixingTime={timeToMix(diffusion.times, distances)}
          endTime={playback.endTime}
          distance={currentDistance}
        />
        {experimentId === 'bottleneck' && (
          <CommunityBalance
            nodeOrder={analysis.nodeOrder}
            state={frame.state}
            sourceId={sourceId}
            announceChanges={!playback.isPlaying}
          />
        )}
      </div>
      <SpectrumView
        spectrum={spectrum}
        initialState={diffusion.initialState}
        state={frame.state}
      />
    </>
  )
}
