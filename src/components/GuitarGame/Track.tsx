import type { NotePreview } from '../../types/note'
import { HitLine } from './HitLine'
import { NoteToken } from './NoteToken'

const STRING_NAMES = ['E', 'B', 'G', 'D', 'A', 'E']

export interface TrackProps {
  /**
   * Notes to render in the static preview. Each note is positioned by its
   * relative `position` value (0 at the hit line, 1 at the far right).
   */
  notes: NotePreview[]
  hasActiveNote?: boolean
}

export function Track({ notes, hasActiveNote = false }: TrackProps) {
  return (
    <div className="track" role="presentation">
      <div className="track__inner">
        <HitLine isActive={hasActiveNote} />

        <div className="track__string-grid" aria-hidden>
          {STRING_NAMES.map((stringName, index) => (
            <div key={`${stringName}-${index}`} className="track__string-row">
              <span className="track__string-label">{stringName}</span>
            </div>
          ))}
        </div>

        <div className="track__notes-layer">
          {notes.map((note) => {
            const key = note.id ?? `${note.label}-${note.stringIndex ?? 'x'}-${note.fret ?? 'x'}`
            return (
              <NoteToken
                key={key}
                note={note}
                totalStrings={STRING_NAMES.length}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
