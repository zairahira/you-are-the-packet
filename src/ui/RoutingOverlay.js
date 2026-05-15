import { ipInCIDR } from '../systems/RoutingEngine.js'

function _bestMatch(destIP, routingTable) {
  if (!destIP) return null
  let best = null, bestLen = -1
  for (const r of routingTable) {
    const len = parseInt(r.prefix.split('/')[1], 10)
    if (ipInCIDR(destIP, r.prefix) && len > bestLen) { bestLen = len; best = r }
  }
  return best
}

export default class RoutingOverlay {
  constructor() {
    this._el       = document.getElementById('canvas-routing-overlay')
    this.isVisible = false
    this._errTimer = null
  }

  show(node, destIP, canvasWrap, worldPos, onRouteClick) {
    if (!node?.routingTable?.length) return
    this.isVisible   = true
    this._bestRoute  = _bestMatch(destIP, node.routingTable)

    const rows = node.routingTable.map(r => `
      <tr class="cro-row" data-nexthop="${r.nextHop}" data-prefix="${r.prefix}">
        <td>${r.prefix}</td><td>${r.interface}</td>
      </tr>`).join('')

    this._el.innerHTML = `
      <div class="cro-title">Router ${node.label || node.id}</div>
      <table class="cro-table">
        <thead><tr><th>PREFIX</th><th>IFACE</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="cro-hint">Click a row to route your packet</div>
    `

    this._el.querySelectorAll('tr.cro-row').forEach(row => {
      row.addEventListener('click', () => {
        const nextHop = row.getAttribute('data-nexthop')
        const route   = node.routingTable.find(r => r.nextHop === nextHop)
        if (route) onRouteClick(route, this._bestRoute)
      })
    })

    this._el.style.display = 'block'
    this._position(worldPos, canvasWrap)
  }

  _position(worldPos, canvasWrap) {
    const margin  = 16
    const overlayW = 260
    const wrapW   = canvasWrap.clientWidth
    const wrapH   = canvasWrap.clientHeight

    let left = worldPos.x + 68
    let top  = worldPos.y - 56

    if (left + overlayW > wrapW - margin) left = worldPos.x - overlayW - 68
    if (left < margin)                    left = margin
    if (top  < margin)                    top  = margin
    if (top  > wrapH  - margin - 130)     top  = wrapH - margin - 130

    this._el.style.left = `${Math.round(left)}px`
    this._el.style.top  = `${Math.round(top)}px`
  }

  showError(message) {
    let errEl = this._el.querySelector('.cro-error')
    if (!errEl) {
      errEl = document.createElement('div')
      errEl.className = 'cro-error'
      this._el.appendChild(errEl)
    }
    errEl.textContent = message
    clearTimeout(this._errTimer)
    this._errTimer = setTimeout(() => errEl?.remove(), 3500)
  }

  hide() {
    this._el.style.display = 'none'
    this._el.innerHTML     = ''
    this.isVisible         = false
    clearTimeout(this._errTimer)
  }
}
