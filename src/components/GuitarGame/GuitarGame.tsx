import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Tone from 'tone'
import type { NotePreview } from '../../types/note'
import './GuitarGame.css'
import { Track } from './Track'
import { ControlPanel } from './ControlPanel'
import { useTransport } from '../../hooks/useTransport'
import {
  HIT_LINE_PERCENT,
  VIEW_LEAD_IN_BEATS,
  VIEW_TAIL_BEATS,
  ACTIVE_THRESHOLD_BEATS,
  AUDIO_FINE_TUNE_BEATS,
} from './constants'

interface ScheduledNote {
  id: string
  label: string
  stringIndex: number
  fret: number
  entryBeat: number
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const STRING_BASE_MIDI = [64, 59, 55, 50, 45, 40] // E4, B3, G3, D3, A2, E2
const MAX_FRET = 5
const LOOKAHEAD_BEATS = VIEW_LEAD_IN_BEATS + 4
const TRAIL_BEATS = VIEW_TAIL_BEATS + 4
const INITIAL_LEAD_IN_BEATS = Math.max(VIEW_LEAD_IN_BEATS - 2, 2)

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

const midiToLabel = (midi: number): string => {
  const noteName = NOTE_NAMES[midi % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${noteName}${octave}`
}

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const createRandomNote = (entryBeat: number): ScheduledNote => {
  const stringIndex = randomInt(0, STRING_BASE_MIDI.length - 1)
  const fret = randomInt(0, MAX_FRET)
  const midi = STRING_BASE_MIDI[stringIndex] + fret
  const label = midiToLabel(midi)

  return {
    id: `${entryBeat}-${stringIndex}-${fret}-${Math.random().toString(16).slice(2, 8)}`,
    label,
    stringIndex,
    fret,
    entryBeat,
  }
}

const mapNotesToAnimatedPreview = (
  notes: ScheduledNote[],
  currentBeat: number,
  noteEdgeOffsetBeats: number,
): { notes: NotePreview[]; hasActiveNote: boolean } => {
  let hasActiveNote = false
  const mappedNotes: NotePreview[] = notes.map((note) => {
    const targetEdgeBeat = note.entryBeat - noteEdgeOffsetBeats - AUDIO_FINE_TUNE_BEATS
    const distanceToEdge = targetEdgeBeat - currentBeat

    if (Math.abs(distanceToEdge) <= ACTIVE_THRESHOLD_BEATS) {
      hasActiveNote = true
    }

    const position = distanceToEdge / VIEW_LEAD_IN_BEATS

    return {
      id: note.id,
      label: note.label,
      stringIndex: note.stringIndex,
      fret: note.fret,
      position,
      isActive: Math.abs(distanceToEdge) <= ACTIVE_THRESHOLD_BEATS,
      distanceToHit: distanceToEdge,
    }
  })

  return { notes: mappedNotes, hasActiveNote }
}

export function GuitarGame() {
  const [currentBeat, setCurrentBeat] = useState<number>(0)
  const [noteEdgeOffsetBeats, setNoteEdgeOffsetBeats] = useState<number>(0)
  const [scheduledNotes, setScheduledNotes] = useState<ScheduledNote[]>([])

  const { tempo, setTempo, isRunning, start, stop } = useTransport({
    initialTempo: 90,
  })

  const synthRef = useRef<Tone.PluckSynth | null>(null)
  const kickRef = useRef<Tone.MembraneSynth | null>(null)
  const snareRef = useRef<Tone.NoiseSynth | null>(null)

  const notesRef = useRef<ScheduledNote[]>([])
  const nextEntryBeatRef = useRef<number>(INITIAL_LEAD_IN_BEATS)

  const scheduledEventIds = useRef<number[]>([])
  const drumLoopIdRef = useRef<number | null>(null)

  useEffect(() => {
    const pluck = new Tone.PluckSynth({
      attackNoise: 1.4,
      dampening: 2800,
      resonance: 0.9,
    })
    pluck.volume.value = 0

    const kick = new Tone.MembraneSynth({
      octaves: 4,
      pitchDecay: 0.05,
    })
    kick.volume.value = -6

    const snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
    })
    snare.volume.value = -8

    const master = new Tone.Gain(1).toDestination()
    pluck.connect(master)
    kick.connect(master)
    snare.connect(master)

    synthRef.current = pluck
    kickRef.current = kick
    snareRef.current = snare

    return () => {
      pluck.dispose()
      kick.dispose()
      snare.dispose()
      synthRef.current = null
      kickRef.current = null
      snareRef.current = null
    }
  }, [])

  const clearScheduledEvents = useCallback(() => {
    scheduledEventIds.current.forEach((id) => Tone.Transport.clear(id))
    scheduledEventIds.current = []
  }, [])

  const clearDrumLoop = useCallback(() => {
    if (drumLoopIdRef.current !== null) {
      Tone.Transport.clear(drumLoopIdRef.current)
      drumLoopIdRef.current = null
    }
  }, [])

  const scheduleNotePlayback = useCallback(
    (note: ScheduledNote) => {
      const scheduledBeat = Math.max(note.entryBeat - noteEdgeOffsetBeats - AUDIO_FINE_TUNE_BEATS, 0)
      const transportPosition = beatsToTransportPosition(scheduledBeat)

      const eventId = Tone.Transport.schedule((time) => {
        synthRef.current?.triggerAttackRelease(note.label, '8n', time)
      }, transportPosition)

      scheduledEventIds.current.push(eventId)
    },
    [noteEdgeOffsetBeats],
  )

  const ensureNoteQueue = useCallback(
    (current: number) => {
      let changed = false

      while (nextEntryBeatRef.current < current + LOOKAHEAD_BEATS) {
        const entryBeat = nextEntryBeatRef.current
        const note = createRandomNote(entryBeat)
        notesRef.current.push(note)
        scheduleNotePlayback(note)
        nextEntryBeatRef.current += 1
        changed = true
      }

      const minBeat = current - TRAIL_BEATS
      const filtered = notesRef.current.filter((note) => note.entryBeat >= minBeat)
      if (filtered.length !== notesRef.current.length) {
        notesRef.current = filtered
        changed = true
      }

      if (changed) {
        setScheduledNotes([...notesRef.current])
      }
    },
    [scheduleNotePlayback],
  )

  const startDrumLoop = useCallback(() => {
    clearDrumLoop()

    let step = 0
    const pattern: Array<'kick' | 'snare'> = ['kick', 'snare', 'kick', 'snare']

    const id = Tone.Transport.scheduleRepeat((time) => {
      const hit = pattern[step]
      if (hit === 'kick') {
        kickRef.current?.triggerAttackRelease('C2', '8n', time)
      } else {
        snareRef.current?.triggerAttackRelease('16n', time)
      }

      step = (step + 1) % pattern.length
    }, '4n')

    drumLoopIdRef.current = id
  }, [clearDrumLoop])

  const animatedPreview = useMemo(
    () => mapNotesToAnimatedPreview(scheduledNotes, currentBeat, noteEdgeOffsetBeats),
    [scheduledNotes, currentBeat, noteEdgeOffsetBeats],
  )

  const handleTempoChange = useCallback(
    (nextTempo: number) => {
      setTempo(clampTempo(nextTempo))
    },
    [setTempo],
  )

  const initializePlayback = useCallback(() => {
    clearScheduledEvents()
    clearDrumLoop()
    notesRef.current = []
    setScheduledNotes([])
    nextEntryBeatRef.current = INITIAL_LEAD_IN_BEATS
    setCurrentBeat(0)
    ensureNoteQueue(0)
    startDrumLoop()
  }, [clearScheduledEvents, clearDrumLoop, ensureNoteQueue, startDrumLoop])

  const handleStart = useCallback(async () => {
    initializePlayback()
    await start()
  }, [initializePlayback, start])

  const handleStop = useCallback(() => {
    stop()
    Tone.Transport.position = beatsToTransportPosition(0)
    setCurrentBeat(0)
  }, [stop])

  useEffect(() => {
    if (!isRunning) {
      return
    }

    let frame: number
    const update = () => {
      const beats = Tone.Transport.ticks / Tone.Transport.PPQ
      setCurrentBeat(beats)
      ensureNoteQueue(beats)
      frame = requestAnimationFrame(update)
    }

    frame = requestAnimationFrame(update)

    return () => {
      if (frame) {
        cancelAnimationFrame(frame)
      }
    }
  }, [isRunning, ensureNoteQueue])

  const handleNoteMetricsChange = useCallback(({ noteWidthPercent }: { noteWidthPercent: number }) => {
    const spanPercent = 100 - HIT_LINE_PERCENT
    if (spanPercent <= 0) {
      setNoteEdgeOffsetBeats(0)
      return
    }

    const halfWidthPercent = noteWidthPercent / 2
    const ratio = halfWidthPercent / spanPercent
    const offsetBeats = ratio <= 0 ? 0 : (ratio * VIEW_LEAD_IN_BEATS) / (1 + ratio)
    setNoteEdgeOffsetBeats((prev) => {
      if (Math.abs(prev - offsetBeats) < 0.001) {
        return prev
      }
      return offsetBeats
    })
  }, [])

  useEffect(() => {
    ensureNoteQueue(currentBeat)
  }, [ensureNoteQueue, currentBeat])

  useEffect(() => () => {
    clearScheduledEvents()
    clearDrumLoop()
  }, [clearScheduledEvents, clearDrumLoop])

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
            hitLinePercent={HIT_LINE_PERCENT}
            onNoteMetricsChange={handleNoteMetricsChange}
          />
        </section>

        <aside className="guitar-game__sidebar" aria-label="Practice controls">
          <ControlPanel
            tempo={tempo}
            isRunning={isRunning}
            onTempoChange={handleTempoChange}
            onStart={handleStart}
            onStop={handleStop}
          />
        </aside>
      </main>
    </div>
  )
}
