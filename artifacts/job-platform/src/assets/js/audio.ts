
type ToneOptions = {
  frequency: number
  duration: number
  type?: OscillatorType
  volume?: number
}

let sharedContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext

  if (!AudioCtx) return null

  if (!sharedContext) {
    sharedContext = new AudioCtx()
  }

  if (sharedContext.state === "suspended") {
    // Resume on the next user gesture handling pass; ignore failures
    // (e.g. autoplay restrictions before any user interaction).
    sharedContext.resume().catch(() => {})
  }

  return sharedContext
}

function playTone({ frequency, duration, type = "sine", volume = 0.08 }: ToneOptions) {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch {
    // Never let audio failures break the UI (e.g. unsupported browsers,
    // autoplay policy blocks, headless/test environments).
  }
}

export const AudioPlayer = {
  playSuccess(): void {
    playTone({ frequency: 880, duration: 0.12, type: "sine" })
    setTimeout(() => playTone({ frequency: 1175, duration: 0.15, type: "sine" }), 90)
  },

  playError(): void {
    playTone({ frequency: 220, duration: 0.18, type: "square", volume: 0.06 })
    setTimeout(() => playTone({ frequency: 165, duration: 0.22, type: "square", volume: 0.06 }), 120)
  },

  playNotification(): void {
    playTone({ frequency: 660, duration: 0.1, type: "sine", volume: 0.06 })
  },
}

export default AudioPlayer
