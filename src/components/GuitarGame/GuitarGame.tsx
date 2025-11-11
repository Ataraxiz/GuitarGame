import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Tone from 'tone'
import type { NotePreview, ExerciseNote } from '../../types/note'
import './GuitarGame.css'
import { Track } from './Track'
import { ControlPanel } from './ControlPanel'
import { NotePlayer } from '../NotePlayer'
import { basicExercise } from '../../data/exercises'
import type { ExerciseDefinition } from '../../data/exercises/basicExercise'
import { useTransport } from '../../hooks/useTransport'

const VIEW_LEAD_IN_BEATS = 6
const VIEW_TAIL_BEATS = 2
const ACTIVE_THRESHOLD_BEATS = 0.05

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

const clampTempo = (value: number): number => {
  const min = 40
  const max = 200
  return Math.min(max, Math.max(min, Math.round(value)))
}

const totalSixteenthsFromBeats = (beats: number): number => Math.max(0, Math.round(beats * 4))

const beatsToTransportPosition = (beats: number): string => {
  const sixteenths = totalSixteenthsFromBeats(beats)
  const bars = Math.floor(sixteenths / 16)
  const remainder = sixteenths - bars * 16
  const quarters = Math.floor(remainder / 4)
  const sixteenthRemainder = remainder % 4

  return `${bars}:${quarters}:${sixteenthRemainder}`
}

const mapExerciseToStaticPreview = (
  exercise: ExerciseDefinition,
): NotePreview[] => {
  const { notes, totalBeats } = exercise
  const denominator = Math.max(totalBeats, 1)

  return notes.map((note: ExerciseNote) => {
    const beatsFromStart = note.entryBeat
    const rawPosition = beatsFromStart / denominator

    return {
      id: `${exercise.id}-${note.label}-${note.entryBeat}`,
      label: note.label,
      stringIndex: note.stringIndex,
      fret: note.fret,
      position: clamp01(rawPosition),
      isActive: false,
    }
  })
}

const mapExerciseToAnimatedPreview = (
  exercise: ExerciseDefinition,
  currentBeat: number,
) => {
  const leadInBeats = exercise.leadInBeats ?? 0
  const windowLead = VIEW_LEAD_IN_BEATS
  const windowTail = VIEW_TAIL_BEATS

  let hasActiveNote = false

  const notes = exercise.notes
    .map((note: ExerciseNote) => {
      const targetBeat = note.entryBeat + leadInBeats
      const distanceToHit = targetBeat - currentBeat

      if (distanceToHit > windowLead) {
        return null
      }

      if (distanceToHit < -windowTail) {
        return null
      }

      const position = distanceToHit / windowLead
      const isActive = Math.abs(distanceToHit) <= ACTIVE_THRESHOLD_BEATS

      if (isActive) {
        hasActiveNote = true
      }

      return {
        id: `${exercise.id}-${note.label}-${note.entryBeat}`,
        label: note.label,
        stringIndex: note.stringIndex,
        fret: note.fret,
        position,
        isActive,
      } satisfies NotePreview
    })
    .filter((note): note is NotePreview => note !== null)

  return { notes, hasActiveNote }
}

export function GuitarGame() {
  const [exercise] = useState<ExerciseDefinition>(() => basicExercise)
  const [currentBeat, setCurrentBeat] = useState<number>(0)

  const { tempo, setTempo, isRunning, position, start, stop } = useTransport({
    initialTempo: 90,
  })

  const synthRef = useRef<Tone.Synth | null>(null)

  useEffect(() => {
    const synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { release: 0.2, attack: 0.01, decay: 0.1, sustain: 0.6 },
    }).toDestination()

    synthRef.current = synth

    return () => {
      synth.dispose()
      synthRef.current = null
    }
  }, [])

  const staticPreview = useMemo(
    () => mapExerciseToStaticPreview(exercise),
    [exercise],
  )

  const animatedPreview = useMemo(() => {
    if (!isRunning) {
      return { notes: staticPreview, hasActiveNote: false }
    }

    return mapExerciseToAnimatedPreview(exercise, currentBeat)
  }, [exercise, currentBeat, isRunning, staticPreview])

  const scheduledEventIds = useRef<number[]>([])

  const clearScheduledEvents = useCallback(() => {
    scheduledEventIds.current.forEach((id) => Tone.Transport.clear(id))
    scheduledEventIds.current = []
  }, [])

  const scheduleExerciseNotes = useCallback(() => {
    clearScheduledEvents()

    const leadInBeats = exercise.leadInBeats ?? 0
    const eventIds: number[] = []

    exercise.notes.forEach((note) => {
      const beatsFromStart = note.entryBeat + leadInBeats
      const transportPosition = beatsToTransportPosition(beatsFromStart)

      const eventId = Tone.Transport.schedule((time) => {
        synthRef.current?.triggerAttackRelease(note.label, '8n', time)
      }, transportPosition)

      eventIds.push(eventId)
    })

    scheduledEventIds.current = eventIds
    Tone.Transport.position = beatsToTransportPosition(0)
    setCurrentBeat(0)
  }, [clearScheduledEvents, exercise])

  useEffect(() => {
    scheduleExerciseNotes()

    return () => {
      clearScheduledEvents()
    }
  }, [scheduleExerciseNotes, clearScheduledEvents])

  useEffect(() => {
    if (!isRunning) {
      setCurrentBeat(0)
      return
    }

    let frame: number
    const update = () => {
      const beats = Tone.Transport.ticks / Tone.Transport.PPQ
      setCurrentBeat(beats)
      frame = requestAnimationFrame(update)
    }

    frame = requestAnimationFrame(update)

    return () => {
      if (frame) {
        cancelAnimationFrame(frame)
      }
    }
  }, [isRunning])

  const handleTempoChange = useCallback(
    (nextTempo: number) => {
      setTempo(clampTempo(nextTempo))
    },
    [setTempo],
  )

  const handleStart = useCallback(async () => {
    scheduleExerciseNotes()
    await start()
  }, [scheduleExerciseNotes, start])

  const handleStop = useCallback(() => {
    stop()
    Tone.Transport.position = beatsToTransportPosition(0)
    setCurrentBeat(0)
  }, [stop])

  return (
    <div className="guitar-game">
      <header className="guitar-game__header">
        <h1 className="guitar-game__title">Guitar Game</h1>
        <p className="guitar-game__subtitle">
          A guided practice track where notes flow left toward the hit line.
        </p>
      </header>

      <main className="guitar-game__main">
        <section className="guitar-game__track" aria-label="Practice track preview">
          <Track
            notes={animatedPreview.notes}
            hasActiveNote={animatedPreview.hasActiveNote}
          />
        </section>

        <aside className="guitar-game__sidebar" aria-label="Practice controls">
          <ControlPanel
            tempo={tempo}
            isRunning={isRunning}
            position={position}
            onTempoChange={handleTempoChange}
            onStart={handleStart}
            onStop={handleStop}
          >
            <NotePlayer />
          </ControlPanel>
        </aside>
      </main>
    </div>
  )
}
