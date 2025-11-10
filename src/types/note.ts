/**
 * Shared TypeScript types for representing notes within the Guitar Game UI.
 *
 * Keeping this in a separate file makes it easier to reuse across components
 * and offers a single point of truth as the data model grows in complexity.
 */

/**
 * ExerciseNote represents a note inside an exercise definition. It contains the
 * musical metadata plus timing information used by the transport.
 *
 * - label: Display name shown to the player (e.g. "C4").
 * - stringIndex: Guitar string index (0 = high E ... 5 = low E). null means
 *   "not tied to a specific string" (useful for future chord markers).
 * - fret: Fret number to play (null for placeholders/open chords). 0 is rendered
 *   as "Open" within the UI.
 * - entryBeat: When the note should reach the hit line, expressed in beats
 *   relative to the start of the exercise. Using beats keeps the value tempo
 *   agnostic and easy to map onto Tone.Transport later.
 * - durationBeats (optional): How long the note should sustain. Not used yet,
 *   but documented for future legato or sustain visuals.
 */
export interface ExerciseNote {
  label: string
  stringIndex: number | null
  fret: number | null
  entryBeat: number
  durationBeats?: number
}

/**
 * NotePreview describes the information needed to render a note token in the
 * static track layout or its animated successor.
 *
 * - id: Optional stable identifier for React rendering (defaults derived when
 *   omitted).
 * - label: The musical name shown to the user (e.g. "C4" or "E string").
 * - stringIndex: Which guitar string the note belongs to (0 = high E, 5 = low E)
 *   Using `number | null` keeps the type flexible if we later show non-string
 *   specific info such as chords.
 * - fret: Which fret to play; nullable for open strings or placeholder notes.
 * - position: Relative horizontal position in the track (0 = at hit line, 1 = far right).
 * - isActive: Optional flag for when the note is crossing the hit line (used for
 *   glow/highlight animations).
 */
export interface NotePreview {
  id?: string
  label: string
  stringIndex: number | null
  fret: number | null
  position: number
  isActive?: boolean
}
