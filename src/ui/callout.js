export default class Callout {
  constructor() {
    this.isVisible = false
    this._el       = document.getElementById('callout')
  }

  show(termData, canvasRect, worldPos) {
    if (this.isVisible || !this._el) return
    this.isVisible = true

    const panelW = 340
    const panelH = 160
    const margin = 16

    let left = canvasRect.left + worldPos.x + 64
    let top  = canvasRect.top  + worldPos.y - panelH / 2

    // Clamp to viewport
    if (left + panelW > window.innerWidth  - margin) left = canvasRect.left + worldPos.x - panelW - 64
    if (left < margin)                                left = margin
    if (top  < margin)                                top  = margin
    if (top  + panelH > window.innerHeight - margin)  top  = window.innerHeight - panelH - margin

    this._el.innerHTML = `
      <div class="callout-headline">${termData.headline}</div>
      <div class="callout-body">${termData.body}</div>
      <div class="callout-dismiss">Press [space] or click to continue</div>
    `
    this._el.style.left    = `${Math.round(left)}px`
    this._el.style.top     = `${Math.round(top)}px`
    this._el.style.display = 'block'

    this._el.onclick = () => this.hide()
  }

  hide() {
    if (!this._el) return
    this.isVisible         = false
    this._el.style.display = 'none'
    this._el.onclick       = null
  }
}
