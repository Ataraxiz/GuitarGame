import type { NotePreview } from '../../types/note'
import { VIEW_LEAD_IN_BEATS, VIEW_TAIL_BEATS } from './constants'

export interface NoteTokenProps {
  note: NotePreview
  totalStrings: number
  marginRatio?: number
  hitLinePercent: number
}

export function NoteToken({
  note,
  totalStrings,
  marginRatio = 0,
  hitLinePercent,
}: NoteTokenProps) {
  const span = 1 - marginRatio * 2
  const ratio = note.stringIndex === null
    ? 0.5
    : (note.stringIndex + 0.5) / totalStrings
  const verticalPercent = (marginRatio + ratio * span) * 100
  const verticalPosition = `${verticalPercent}%`

  const trackSpanPercent = 100 - hitLinePercent
  const leftSpanPercent = hitLinePercent

  const distanceToHit = note.distanceToHit ?? Number.POSITIVE_INFINITY
  let state: 'past' | 'present' | 'future' = 'present'
  if (Number.isFinite(distanceToHit)) {
    const numeric = Number(distanceToHit)
    if (numeric < -0.01) {
      state = 'past'
    } else if (numeric > 0.01) {
      state = 'future'
    }
  }

  const clampedPosition = Math.max(Math.min(note.position, 1.2), -1.2)
  const horizontalPercent = hitLinePercent + clampedPosition * (clampedPosition >= 0 ? trackSpanPercent : leftSpanPercent)
  const horizontalPosition = `${horizontalPercent}%`

  const fretLabel = note.fret === null ? '—' : note.fret === 0 ? 'Open' : `Fret ${note.fret}`
  const className = note.isActive ? 'note-token note-token--active' : 'note-token'

  return (
    <div
      className={className}
      style={{ left: horizontalPosition, top: verticalPosition }}
      aria-label={`${note.label}, ${fretLabel}`}
      data-active={note.isActive ? 'true' : 'false'}
      data-state={state}
    >
      <span className="note-token__label">{note.label}</span>
      <span className="note-token__detail">{fretLabel}</span>
    </div>
  )
}
