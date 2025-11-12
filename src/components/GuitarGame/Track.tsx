import { useCallback, useLayoutEffect, useRef } from 'react'
import type { NotePreview } from '../../types/note'
import { HitLine } from './HitLine'
import { NoteToken } from './NoteToken'

const STRING_NAMES = ['E', 'B', 'G', 'D', 'A', 'E']
const STRING_MARGIN_RATIO = 0.08

const getStringPercent = (index: number, totalStrings: number): number => {
  const ratio = (index + 0.5) / totalStrings
  const span = 1 - STRING_MARGIN_RATIO * 2
  return (STRING_MARGIN_RATIO + ratio * span) * 100
}

export interface TrackProps {
  /**
   * Notes to render in the static preview. Each note is positioned by its
   * relative `position` value (0 at the hit line, 1 at the far right).
   */
  notes: NotePreview[]
  hasActiveNote?: boolean
  hitLinePercent: number
  onNoteMetricsChange?: (metrics: { noteWidthPercent: number }) => void
}

export function Track({
  notes,
  hasActiveNote = false,
  hitLinePercent,
  onNoteMetricsChange,
}: TrackProps) {
  const totalStrings = STRING_NAMES.length
  const notesLayerRef = useRef<HTMLDivElement>(null)

  const reportMetrics = useCallback(() => {
    if (!onNoteMetricsChange) return
    const layer = notesLayerRef.current
    if (!layer) return

    const sampleNote = layer.querySelector<HTMLElement>('.note-token')
    if (!sampleNote) return

    const layerRect = layer.getBoundingClientRect()
    const noteRect = sampleNote.getBoundingClientRect()
    if (layerRect.width === 0) return

    const percent = (noteRect.width / layerRect.width) * 100
    onNoteMetricsChange({ noteWidthPercent: percent })
  }, [onNoteMetricsChange])

  useLayoutEffect(() => {
    reportMetrics()
  }, [reportMetrics, notes.length])

  useLayoutEffect(() => {
    if (!onNoteMetricsChange) return
    const layer = notesLayerRef.current
    if (!layer) return

    const observer = new ResizeObserver(() => {
      reportMetrics()
    })

    observer.observe(layer)

    return () => {
      observer.disconnect()
    }
  }, [onNoteMetricsChange, reportMetrics])

  return (
    <div className="track" role="presentation">
      <div className="track__inner">
        <HitLine isActive={hasActiveNote} />

        <div className="track__content">
          <div className="track__string-grid" aria-hidden>
            {STRING_NAMES.map((stringName, index) => (
              <div
                key={`${stringName}-${index}`}
                className="track__string-line"
                style={{ top: `${getStringPercent(index, totalStrings)}%` }}
              >
                <span className="track__string-badge">{stringName}</span>
                <span className="track__string-wire" />
              </div>
            ))}
          </div>

          <div className="track__notes-layer" ref={notesLayerRef}>
            {notes.map((note) => {
              const key = note.id ?? `${note.label}-${note.stringIndex ?? 'x'}-${note.fret ?? 'x'}`
              return (
                <NoteToken
                  key={key}
                  note={note}
                  totalStrings={totalStrings}
                  marginRatio={STRING_MARGIN_RATIO}
                  hitLinePercent={hitLinePercent}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
