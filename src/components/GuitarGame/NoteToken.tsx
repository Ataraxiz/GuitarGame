import type { NotePreview } from '../../types/note'

export interface NoteTokenProps {
  note: NotePreview
  totalStrings: number
}

export function NoteToken({ note, totalStrings }: NoteTokenProps) {
  const horizontalPosition = `${note.position * 100}%`

  const verticalPosition = note.stringIndex === null
    ? '50%'
    : `${(note.stringIndex / Math.max(totalStrings - 1, 1)) * 100}%`

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
