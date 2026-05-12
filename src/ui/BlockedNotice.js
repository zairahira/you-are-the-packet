export default class BlockedNotice {
  constructor() {
    this._el    = document.getElementById('blocked-notice')
    this._timer = null
  }

  show(message) {
    if (!this._el) return
    this._el.textContent  = message
    this._el.style.opacity = '1'
    this._el.style.display = 'block'

    if (this._timer) clearTimeout(this._timer)
    this._timer = setTimeout(() => this._fadeOut(), 2000)
  }

  _fadeOut() {
    if (!this._el) return
    this._el.style.opacity = '0'
    this._timer = setTimeout(() => {
      if (this._el) this._el.style.display = 'none'
      this._timer = null
    }, 400)
  }

  hide() {
    if (!this._el) return
    if (this._timer) { clearTimeout(this._timer); this._timer = null }
    this._el.style.display  = 'none'
    this._el.style.opacity  = '1'
  }
}
