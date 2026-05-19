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

function _termLabel(key) {
  return String(key).replace(/-/g, ' ').toUpperCase()
}

function _highlightIPs(text, srcIP, destIP) {
  const escape = s => s.replace(/\./g, '\\.')
  let result = text
  if (srcIP)  result = result.replace(new RegExp(escape(srcIP),  'g'), `<span class="ip-val">${srcIP}</span>`)
  if (destIP) result = result.replace(new RegExp(escape(destIP), 'g'), `<span class="ip-val">${destIP}</span>`)
  return result
}

function _buildTablesHtml(nodes, destIP) {
  const routerNodes = (nodes || []).filter(n => n.routingTable?.length)
  return routerNodes.map(node => {
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
}

export default class TheoryPanel {
  constructor() {
    this._el         = document.getElementById('theory-panel')
    this._briefingEl = document.getElementById('briefing-overlay')
    this._clearTimer = null
    this._errorTimer = null
  }

  /* ── Idea 3: full-screen mission briefing ─────────────────────────────── */
  showBriefing(levelData, onReady) {
    if (!levelData?.theory) return
    const { theory, id, player } = levelData
    const destIP    = player?.destIP
    const srcIP     = player?.srcIP
    const isMidGame = onReady === null

    const recapHtml = theory.recap
      ? `<div class="brief-section">
           <div class="brief-label">Recap</div>
           <p class="brief-recap">${_highlightIPs(theory.recap, srcIP, destIP)}</p>
         </div>`
      : ''

    const conceptHtml = theory.bodyParagraphs?.length
      ? `<div class="brief-section">
           <div class="brief-label">Concept${theory.newConcept ? ': ' + _termLabel(theory.newConcept) : ''}</div>
           <div class="theory-body">
             ${theory.bodyParagraphs.map(p => `
               <div class="theory-para">
                 ${p.heading ? `<div class="theory-para-heading">${p.heading}</div>` : ''}
                 <div class="theory-body-p">${p.text}</div>
               </div>`).join('')}
           </div>
         </div>`
      : ''

    const tablesHtml = _buildTablesHtml(levelData.nodes, destIP)
    const tablesSection = tablesHtml
      ? `<div class="brief-section">
           <div class="brief-label">Routing Tables</div>
           ${tablesHtml}
         </div>`
      : ''

    const missionHtml = theory.mission
      ? `<div class="brief-section">
           <div class="brief-label">Mission Objective</div>
           ${theory.mission.split('\n\n').map(p =>
             `<p class="brief-mission">${_highlightIPs(p, srcIP, destIP)}</p>`
           ).join('')}
         </div>`
      : ''

    const btnLabel = isMidGame ? 'Back to Game' : 'Start Mission'

    this._briefingEl.innerHTML = `
      <div class="briefing-inner">
        <div class="brief-header">
          <span class="brief-tag">Mission Brief &middot; Level ${id}</span>
          <h1 class="brief-title">${theory.title}</h1>
        </div>
        ${recapHtml}
        ${conceptHtml}
        ${tablesSection}
        ${missionHtml}
        <button class="btn-primary brief-start-btn" id="btn-briefing-start">${btnLabel}</button>
      </div>
    `
    this._briefingEl.style.display = 'flex'

    document.getElementById('btn-briefing-start').addEventListener('click', () => {
      this._briefingEl.style.display = 'none'
      if (!isMidGame) {
        this._renderIdleState(levelData)
        onReady()
      }
    }, { once: true })
  }

  /* ── Mid-game "?" button: re-show the briefing as read-only reference ─── */
  showMidGame(levelData) {
    this.showBriefing(levelData, null)
  }

  /* ── Idle state: compact reference panel shown during gameplay ─────────── */
  showIdleState(levelData) { this._renderIdleState(levelData) }

  _renderIdleState(levelData) {
    const { theory, id, player } = levelData
    const destIP = player?.destIP
    const srcIP  = player?.srcIP

    const tablesHtml = _buildTablesHtml(levelData.nodes, destIP)

    const missionReminderHtml = theory.plainObjective
      ? `<p class="theory-mission">${_highlightIPs(theory.plainObjective, srcIP, destIP)}</p>`
      : ''

    this._el.innerHTML = `
      <div class="theory-tag">LEVEL ${id}</div>
      <div class="theory-title">${theory.title}</div>

      ${missionReminderHtml ? `<div class="theory-section-label">Your Mission</div><div class="theory-body">${missionReminderHtml}</div>` : ''}

      ${tablesHtml ? `<div class="theory-section-label">Routing Tables</div>${tablesHtml}` : ''}
    `
  }

  /* ── Idea 1: focus panel on current router ─────────────────────────────── */
  focusRouter(nodeId, destIP) {
    this._clearFocusState()
    if (!nodeId) return

    const table = this._el.querySelector(`.rt-table[data-node-id="${nodeId}"]`)
    if (!table) return

    const wrapper = table.closest('.theory-router')
    if (wrapper) {
      wrapper.classList.add('rt-router-focus')
      const nameEl = wrapper.querySelector('.theory-router-name')
      if (nameEl && !nameEl.querySelector('.rt-here-badge')) {
        const badge = document.createElement('span')
        badge.className = 'rt-here-badge'
        badge.textContent = 'you are here'
        nameEl.appendChild(badge)
      }
    }

    if (destIP) {
      let bestRow = null, bestLen = -1
      table.querySelectorAll('tbody tr[data-prefix]').forEach(row => {
        const prefix    = row.getAttribute('data-prefix')
        const prefixLen = parseInt(prefix.split('/')[1], 10)
        if (ipInCIDR(destIP, prefix) && prefixLen > bestLen) {
          bestLen = prefixLen; bestRow = row
        }
      })
      if (bestRow) bestRow.classList.add('rt-active-match')
    }

    wrapper?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  clearFocus() { this._clearFocusState() }

  _clearFocusState() {
    this._el.querySelectorAll('.rt-router-focus').forEach(el => el.classList.remove('rt-router-focus'))
    this._el.querySelectorAll('.rt-here-badge').forEach(el => el.remove())
    this._el.querySelectorAll('.rt-active-match').forEach(el => el.classList.remove('rt-active-match'))
  }

  /* ── Idea 6: wrong-move explanation in panel ───────────────────────────── */
  showWrongRoute(fromNodeId, destIP, matchedRoute) {
    this._el.querySelector('.theory-error-notice')?.remove()

    const matchText = matchedRoute
      ? `The correct route is <strong>${matchedRoute.prefix} &rarr; ${matchedRoute.interface}</strong>.`
      : 'No matching route found.'

    const notice = document.createElement('div')
    notice.className = 'theory-error-notice'
    notice.innerHTML = `<strong>Wrong exit:</strong> ${destIP} doesn't match that route. ${matchText}`
    this._el.prepend(notice)
    this._el.scrollTop = 0

    clearTimeout(this._errorTimer)
    this._errorTimer = setTimeout(() => notice.remove(), 4000)

    this.focusRouter(fromNodeId, destIP)
  }

  /* ── Existing highlight (for firewall errors) ───────────────────────────── */
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
    clearTimeout(this._errorTimer)
    this._briefingEl.style.display = 'none'
    this._el.innerHTML = ''
  }
}
