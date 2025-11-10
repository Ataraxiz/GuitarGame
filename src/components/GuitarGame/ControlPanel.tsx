import type { ReactNode, ChangeEvent } from 'react'

export interface ControlPanelProps {
  tempo: number
  isRunning: boolean
  position: string
  onTempoChange: (nextTempo: number) => void
  onStart: () => Promise<void>
  onStop: () => void
  children?: ReactNode
}

/**
 * ControlPanel groups together transport controls (start/stop, tempo) along
 * with any additional utilities (e.g. the existing NotePlayer test button).
 */
export function ControlPanel({
  tempo,
  isRunning,
  position,
  onTempoChange,
  onStart,
  onStop,
  children,
}: ControlPanelProps) {
  const handleTempoInput = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number.parseInt(event.target.value, 10)
    if (Number.isNaN(nextValue)) return
    onTempoChange(nextValue)
  }

  const adjustTempo = (delta: number) => {
    onTempoChange(tempo + delta)
  }

  const statusText = isRunning ? 'Running' : 'Stopped'

  const handleStartStop = async () => {
    if (isRunning) {
      onStop()
    } else {
      await onStart()
    }
  }

  return (
    <section className="control-panel">
      <div className="control-panel__heading-row">
        <h2 className="control-panel__heading">Session Controls</h2>
        <span className="control-panel__status" aria-live="polite">
          {statusText}
        </span>
      </div>

      <div className="control-panel__details">
        <div className="control-panel__stat">
          <span className="control-panel__stat-label">Current Position</span>
          <span className="control-panel__stat-value">{position}</span>
        </div>

        <div className="control-panel__tempo">
          <span className="control-panel__stat-label">Tempo</span>
          <div className="control-panel__tempo-controls">
            <button
              type="button"
              className="control-panel__tempo-button"
              onClick={() => adjustTempo(-5)}
              disabled={tempo <= 40}
              aria-label="Decrease tempo"
            >
              –
            </button>
            <input
              type="number"
              min={40}
              max={200}
              step={1}
              value={tempo}
              onChange={handleTempoInput}
              className="control-panel__tempo-input"
              aria-label="Tempo in beats per minute"
            />
            <button
              type="button"
              className="control-panel__tempo-button"
              onClick={() => adjustTempo(5)}
              disabled={tempo >= 200}
              aria-label="Increase tempo"
            >
              +
            </button>
          </div>
          <span className="control-panel__tempo-note">BPM</span>
        </div>

        <button
          type="button"
          className="control-panel__primary"
          onClick={handleStartStop}
        >
          {isRunning ? 'Stop Practice' : 'Start Practice'}
        </button>
      </div>

      <div className="control-panel__extras">
        <h3 className="control-panel__subheading">Audio Test</h3>
        <p className="control-panel__helper">
          Use the button below to confirm your audio setup before starting a session.
        </p>
        {children}
      </div>
    </section>
  )
}
