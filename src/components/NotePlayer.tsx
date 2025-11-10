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
  // TypeScript note: useRef<Tone.Synth | null> allows the ref to hold either
  // a Synth instance or null (before initialization)
  const synthRef = useRef<Tone.Synth | null>(null)

  // Initialize the synth when component mounts
  useEffect(() => {
    // Create a new Tone.js Synth instance
    // Synth is a basic synthesizer that can play musical notes
    synthRef.current = new Tone.Synth()
    
    // Connect the synth to the audio output (speakers)
    // This is required for the synth to produce sound
    // Tone.Destination represents the audio output device
    synthRef.current.toDestination()

    // Cleanup function: dispose of the synth when component unmounts
    // This prevents memory leaks by properly cleaning up audio resources
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose()
        synthRef.current = null
      }
    }
  }, []) // Empty dependency array means this runs once on mount

  /**
   * Starts the Tone.js audio context (required by browser autoplay policies)
   * This must be called on user interaction (like a button click)
   */
  const startAudioContext = async (): Promise<void> => {
    if (isContextStarted) return

    try {
      // Tone.start() initializes the Web Audio API context
      // It returns a Promise that resolves when the context is ready
      await Tone.start()
      setIsContextStarted(true)
    } catch (error) {
      // Error handling: log any issues starting the audio context
      // TypeScript note: error is of type 'unknown', so we check if it's an Error
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
    // Ensure audio context is started before playing
    if (!isContextStarted) {
      await startAudioContext()
      // Wait a tiny bit to ensure context is fully ready
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    if (!synthRef.current) {
      console.error('Synth not initialized')
      return
    }

    try {
      setIsPlaying(true)
      
      // Verify the audio context is actually running
      if (Tone.context.state !== 'running') {
        console.warn('Audio context not running, attempting to start...')
        await Tone.start()
      }
      
      // triggerAttackRelease plays a note with attack and release phases
      // Parameters: note name ("C4"), duration ("8n" = eighth note)
      // TypeScript note: Tone.js methods are typed, so TypeScript knows
      // the expected parameter types
      synthRef.current.triggerAttackRelease('C4', '8n')
      
      console.log('Note played: C4') // Debug log to verify function is called
      
      // Reset playing state after the note duration
      // "8n" at 120 BPM is 0.25 seconds, but we'll wait a bit longer
      // to ensure the note finishes playing
      setTimeout(() => {
        setIsPlaying(false)
      }, 300) // 300ms gives enough time for the note to play
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
        {isPlaying ? 'Playing...' : 'Play Middle C (C4)'}
      </button>
      {!isContextStarted && (
        <p className="audio-hint">
          Click the button to start audio and play the note
        </p>
      )}
    </div>
  )
}

