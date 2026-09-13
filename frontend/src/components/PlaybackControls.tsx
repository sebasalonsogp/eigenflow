import './PlaybackControls.css'

interface PlaybackControlsProps {
  currentTime: number
  startTime: number
  endTime: number
  isPlaying: boolean
  reducedMotion: boolean
  onPlay: () => void
  onPause: () => void
  onSeek: (time: number) => void
  onReset: () => void
}

export function PlaybackControls({
  currentTime,
  startTime,
  endTime,
  isPlaying,
  reducedMotion,
  onPlay,
  onPause,
  onSeek,
  onReset,
}: PlaybackControlsProps) {
  return (
    <section className="playback-controls" aria-label="Diffusion playback">
      <button
        className="playback-primary"
        type="button"
        onClick={isPlaying ? onPause : onPlay}
        disabled={reducedMotion && !isPlaying}
      >
        <span aria-hidden="true">{isPlaying ? 'Ⅱ' : '▶'}</span>
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      <div className="playback-timeline">
        <label htmlFor="simulation-time">
          Simulation time
          <output htmlFor="simulation-time" aria-live="off">
            t = {currentTime.toFixed(2)}
          </output>
        </label>
        <input
          id="simulation-time"
          type="range"
          min={startTime}
          max={endTime}
          step={0.01}
          value={currentTime}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
      </div>

      <button
        className="playback-reset"
        type="button"
        onClick={onReset}
        disabled={currentTime === startTime && !isPlaying}
      >
        Reset timeline
      </button>

      {reducedMotion && (
        <p className="playback-motion-note">
          Automatic playback is off for reduced motion. Scrubbing remains available.
        </p>
      )}
    </section>
  )
}
