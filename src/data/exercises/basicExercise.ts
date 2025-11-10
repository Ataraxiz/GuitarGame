import type { ExerciseNote } from '../../types/note'

/**
 * Example exercise data used to drive the static Guitar Game layout. Keeping
 * this in a separate module makes it easier to swap exercises later (and keeps
 * React components focused on rendering rather than data definition).
 */
export interface ExerciseDefinition {
  /** Stable identifier so we can reference this exercise later on. */
  id: string
  /** Human friendly name shown in selections or headers. */
  name: string
  /** Total number of beats spanned by the exercise (does not include lead-in). */
  totalBeats: number
  /** Optional number of beats that should elapse before the first note. */
  leadInBeats?: number
  /**
   * Sequence of notes that make up the exercise. Timing is described in beats
   * so it stays tempo agnostic; we can multiply by BPM later to schedule
   * playback.
   */
  notes: ExerciseNote[]
}

/**
 * A gentle, ascending exercise covering open strings and a few fretted notes.
 *
 * entryBeat values are specified in beats, starting at 0. A value of 0 would
 * place the note on the hit line immediately. Higher entryBeat values position
 * notes progressively further to the right when translated into the current
 * preview layout (position = entryBeat / totalBeats).
 */
const notes: ExerciseNote[] = [
  { label: 'E4', stringIndex: 0, fret: 0, entryBeat: 1 },
  { label: 'C4', stringIndex: 2, fret: 5, entryBeat: 2.75 },
  { label: 'G3', stringIndex: 3, fret: 0, entryBeat: 4 },
  { label: 'A3', stringIndex: 4, fret: 2, entryBeat: 5.5 },
  { label: 'E3', stringIndex: 5, fret: 0, entryBeat: 6.75 },
]

export const basicExercise: ExerciseDefinition = {
  id: 'basic-ascending-open-fifths',
  name: 'Ascending Fifths (Open to Low E)',
  totalBeats: 8,
  leadInBeats: 0,
  notes,
}
