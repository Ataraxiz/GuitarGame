import type { NotePreview } from '../../types/note'

export interface NoteTokenProps {
  note: NotePreview
  totalStrings: number
  marginRatio?: number
}

export function NoteToken({ note, totalStrings, marginRatio = 0 }: NoteTokenProps) {
  const horizontalPosition = `${note.position * 100}%`

  const ratio = note.stringIndex === null
    ? 0.5
    : (note.stringIndex + 0.5) / totalStrings
  const span = 1 - marginRatio * 2
  const verticalPercent = (marginRatio + ratio * span) * 100
  const verticalPosition = `${verticalPercent}%`

  const fretLabel = note.fret === null ? '—' : note.fret === 0 ? 'Open' : `Fret ${note.fret}`
  const className = note.isActive ? 'note-token note-token--active' : 'note-token'

  const state = note.position < 0 ? 'past' : note.position > 1 ? 'future' : 'present'

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
