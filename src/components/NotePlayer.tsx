import { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'

/**
 * NotePlayer Component
 *
 * A simple test component that plays middle C (C4) using Tone.js
 * when a button is clicked. Demonstrates proper Tone.js integration
 * with error handling and visual feedback.
 */
export function NotePlayer() {
  // Track whether the Tone.js audio context has been started
  // TypeScript note: useState<boolean> explicitly types the state as boolean
  const [isContextStarted, setIsContextStarted] = useState<boolean>(false)

  // Track whether a note is currently playing for visual feedback
  const [isPlaying, setIsPlaying] = useState<boolean>(false)

  // Store the synth instance in a ref so it persists across renders
  // TypeScript note: useRef<Tone.PluckSynth | null> allows the ref to hold either
  // a PluckSynth instance or null (before initialization)
  const synthRef = useRef<Tone.PluckSynth | null>(null)

  // Initialize the synth when component mounts
  useEffect(() => {
    // Tone.PluckSynth implements a Karplus-Strong string model suited for
    // guitar-like percussive tones.
    synthRef.current = new Tone.PluckSynth({
      attackNoise: 1.2,
      dampening: 3200,
      resonance: 0.92,
    }).toDestination()

    // Cleanup function: dispose of the synth when component unmounts
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose()
        synthRef.current = null
      }
    }
  }, [])

  /**
   * Starts the Tone.js audio context (required by browser autoplay policies)
   * This must be called on user interaction (like a button click)
   */
  const startAudioContext = async (): Promise<void> => {
    if (isContextStarted) return

    try {
      await Tone.start()
      setIsContextStarted(true)
    } catch (error) {
      console.error('Failed to start audio context:', error)
      if (error instanceof Error) {
        alert(`Audio initialization failed: ${error.message}`)
      }
    }
  }

  /**
   * Plays middle C (C4) note
   * C4 has a frequency of approximately 261.63 Hz
   */
  const playNote = async (): Promise<void> => {
    if (!isContextStarted) {
      await startAudioContext()
    }

    if (!synthRef.current) {
      console.error('Synth not initialized')
      return
    }

    try {
      setIsPlaying(true)

      if (Tone.context.state !== 'running') {
        await Tone.start()
      }

      synthRef.current.triggerAttackRelease('C4', '8n')

      setTimeout(() => {
        setIsPlaying(false)
      }, 300)
    } catch (error) {
      console.error('Failed to play note:', error)
      setIsPlaying(false)
      if (error instanceof Error) {
        alert(`Failed to play note: ${error.message}`)
      }
    }
  }

  return (
    <div className="note-player">
      <button
        onClick={playNote}
        disabled={isPlaying}
        className="play-note-button"
      >
        {isPlaying ? 'Playing…' : 'Play Middle C (C4)'}
      </button>
      {!isContextStarted && (
        <p className="audio-hint">
          Click the button to start audio and hear a plucked tone
        </p>
      )}
    </div>
  )
}

