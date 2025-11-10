import { useCallback, useEffect, useState } from 'react'
import * as Tone from 'tone'

export interface UseTransportOptions {
  initialTempo?: number
}

/**
 * Small React hook that wraps Tone.Transport control so components can start,
 * stop, and observe tempo/position changes. Keeping it isolated simplifies
 * reuse and keeps React concerns (state) separate from Tone.js globals.
 */
export function useTransport({ initialTempo = 90 }: UseTransportOptions = {}) {
  const [tempo, setTempo] = useState<number>(initialTempo)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [position, setPosition] = useState<string>('0:0:0')

  // Apply tempo changes to Tone.Transport whenever the React state updates.
  useEffect(() => {
    Tone.Transport.bpm.value = tempo
  }, [tempo])

  // Subscribe to the transport position so we can show a live readout in the UI.
  useEffect(() => {
    const id = Tone.Transport.scheduleRepeat(() => {
      setPosition(Tone.Transport.position)
    }, '16n')

    return () => {
      Tone.Transport.clear(id)
    }
  }, [])

  const start = useCallback(async () => {
    await Tone.start()
    Tone.Transport.start()
    setIsRunning(true)
  }, [])

  const stop = useCallback(() => {
    Tone.Transport.stop()
    Tone.Transport.position = 0
    setPosition('0:0:0')
    setIsRunning(false)
  }, [])

  const toggle = useCallback(async () => {
    if (isRunning) {
      stop()
    } else {
      await start()
    }
  }, [isRunning, start, stop])

  return {
    tempo,
    setTempo,
    isRunning,
    position,
    start,
    stop,
    toggle,
  }
}
