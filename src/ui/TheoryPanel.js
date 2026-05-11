import { ipInCIDR } from '../systems/RoutingEngine.js'

function _bestMatchPrefix(destIP, routingTable) {
  let bestPrefix = null
  let bestLen = -1
  for (const route of routingTable) {
    const prefixLen = parseInt(route.prefix.split('/')[1], 10)
    if (ipInCIDR(destIP, route.prefix) && prefixLen > bestLen) {
      bestLen = prefixLen
      bestPrefix = route.prefix
    }
  }
  return bestPrefix
}

function _highlightIPs(text, srcIP, destIP) {
  const escape = s => s.replace(/\./g, '\\.')
  let result = text
  if (srcIP)  result = result.replace(new RegExp(escape(srcIP),  'g'), `<span class="ip-val">${srcIP}</span>`)
  if (destIP) result = result.replace(new RegExp(escape(destIP), 'g'), `<span class="ip-val">${destIP}</span>`)
  return result
}

export default class TheoryPanel {
  constructor() {
    this._el = document.getElementById('theory-panel')
    this._onContinue = null
    this._clearTimer = null
  }

  show(levelData, onContinue) {
    this._onContinue = onContinue
    const { theory, id, player } = levelData
    const destIP = player?.destIP
    const srcIP = player?.srcIP

    const conceptHtml = theory.bodyParagraphs
      ? theory.bodyParagraphs.map(p => `
          <div class="theory-para">
            ${p.heading ? `<div class="theory-para-heading">${p.heading}</div>` : ''}
            <p class="theory-body-p">${p.text}</p>
          </div>`).join('')
      : `<p class="theory-body-p">${theory.body}</p>`

    const missionHtml = theory.mission
      ? theory.mission
          .split('\n\n')
          .map(p => `<p class="theory-mission">${_highlightIPs(p, srcIP, destIP)}</p>`)
          .join('')
      : ''

    const routerNodes = (levelData.nodes || []).filter(n => n.routingTable?.length)
    const tablesHtml = routerNodes.map(node => {
      const matchPrefix = destIP ? _bestMatchPrefix(destIP, node.routingTable) : null
      const rows = node.routingTable.map(r => {
        const isMatch = r.prefix === matchPrefix
        return `<tr data-prefix="${r.prefix}"${isMatch ? ' class="rt-match"' : ''}>
          <td>${r.prefix}</td><td>${r.interface}</td>
        </tr>`
      }).join('')
      return `
        <div class="theory-router">
          <div class="theory-router-name">Router ${node.label || node.id}</div>
          <table class="rt-table" data-node-id="${node.id}">
            <thead><tr><th>PREFIX</th><th>IFACE</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`
    }).join('')

    this._el.innerHTML = `
      <div class="theory-tag">LEVEL ${id}</div>
      <div class="theory-title">${theory.title}</div>

      <div class="theory-section-label">Concept</div>
      <div class="theory-body">${conceptHtml}</div>

      ${missionHtml ? `<div class="theory-section-label">Your Mission</div><div class="theory-body">${missionHtml}</div>` : ''}

      ${tablesHtml ? `<div class="theory-section-label">Routing Tables</div>${tablesHtml}` : ''}

      <button class="btn-primary" id="btn-theory-continue">Start Level</button>
    `

    document.getElementById('btn-theory-continue').addEventListener('click', () => {
      const btn = document.getElementById('btn-theory-continue')
      if (btn) { btn.disabled = true; btn.style.opacity = '0.5' }
      this._onContinue?.()
    }, { once: true })
  }

  highlight(nodeId, prefix) {
    this.clearHighlight()
    if (!nodeId) return
    const table = this._el.querySelector(`.rt-table[data-node-id="${nodeId}"]`)
    if (!table) return
    const row = prefix ? table.querySelector(`tr[data-prefix="${prefix}"]`) : null
    if (row) row.classList.add('rt-highlight')
    else table.classList.add('rt-highlight-table')

    clearTimeout(this._clearTimer)
    this._clearTimer = setTimeout(() => this.clearHighlight(), 3000)
  }

  clearHighlight() {
    this._el.querySelectorAll('.rt-highlight, .rt-highlight-table').forEach(el => {
      el.classList.remove('rt-highlight', 'rt-highlight-table')
    })
  }

  hide() {
    clearTimeout(this._clearTimer)
    this._el.innerHTML = ''
  }
}
