export default class AudioSystem {
  constructor() {
    this._ctx = null
  }

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)()
    }
    return this._ctx
  }

  _tone(freq, duration, type = 'sine', gain = 0.12, startOffset = 0) {
    const ctx = this._getCtx()
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.connect(env)
    env.connect(ctx.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset)
    env.gain.setValueAtTime(gain, ctx.currentTime + startOffset)
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration)
    osc.start(ctx.currentTime + startOffset)
    osc.stop(ctx.currentTime + startOffset + duration)
  }

  hop() {
    this._tone(440, 0.07, 'square', 0.07)
  }

  blocked() {
    const ctx = this._getCtx()
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.connect(env)
    env.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.22)
    env.gain.setValueAtTime(0.14, ctx.currentTime)
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.22)
  }

  success() {
    // C-E-G-C ascending arpeggio
    [523, 659, 784, 1047].forEach((freq, i) => {
      this._tone(freq, 0.22, 'sine', 0.14, i * 0.09)
    })
  }

  syn() {
    this._tone(560, 0.09, 'sine', 0.12)
  }

  synAck() {
    this._tone(560, 0.07, 'sine', 0.12)
    this._tone(720, 0.09, 'sine', 0.12, 0.08)
  }

  ack() {
    this._tone(720, 0.07, 'sine', 0.12)
    this._tone(880, 0.12, 'sine', 0.12, 0.08)
  }
}
