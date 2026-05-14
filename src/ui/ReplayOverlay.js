export default class ReplayOverlay {
  constructor() {
    this._badge   = document.getElementById('replay-badge')
    this._panel   = document.getElementById('recap-step')
    this._text    = document.getElementById('recap-step-text')
    this._counter = document.getElementById('replay-step-counter')
    this._hint    = document.getElementById('recap-step-hint')
    this._btn     = document.getElementById('btn-replay-next')
    this._prevBtn = document.getElementById('btn-replay-prev')
  }

  showIntro() {
    this._show()
    if (this._counter) this._counter.textContent = ''
    if (this._text)    this._text.textContent    = 'Watch the correct path. Step through each hop to see the decisions being made.'
    if (this._hint)    this._hint.textContent    = '[space] to begin'
    if (this._btn)     this._btn.textContent     = '→'
    if (this._prevBtn) this._prevBtn.style.visibility = 'hidden'
  }

  showStep(stepNum, total, explanation, isLast) {
    this._show()
    if (this._counter) this._counter.textContent = `${stepNum} / ${total}`
    if (this._text)    this._text.textContent    = explanation
    if (this._hint)    this._hint.textContent    = isLast ? '[←] back  [space] finish' : '[←] back  [space] next'
    if (this._btn)     this._btn.textContent     = isLast ? '✓' : '→'
    if (this._prevBtn) this._prevBtn.style.visibility = 'visible'
  }

  hide() {
    if (this._badge)   this._badge.style.display = 'none'
    if (this._panel)   this._panel.style.display = 'none'
  }

  _show() {
    if (this._badge) this._badge.style.display = 'block'
    if (this._panel) this._panel.style.display = 'flex'
  }

  onNext(fn) { if (this._btn)     this._btn.onclick     = fn }
  onPrev(fn) { if (this._prevBtn) this._prevBtn.onclick = fn }
}
