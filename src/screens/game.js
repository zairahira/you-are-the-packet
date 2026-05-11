import { LEVELS }         from '../levels/index.js'
import LevelLoader         from '../systems/LevelLoader.js'
import RoutingEngine       from '../systems/RoutingEngine.js'
import FirewallChecker     from '../systems/FirewallChecker.js'
import CheckpointSystem    from '../systems/CheckpointSystem.js'
import TermTracker         from '../systems/TermTracker.js'
import Packet              from '../entities/Packet.js'
import { setupCanvas, drawWorld } from '../draw.js'
import HUD                 from '../ui/hud.js'
import Callout             from '../ui/callout.js'
import TheoryPanel         from '../ui/TheoryPanel.js'

let _canvas, _ctx, _canvasW, _canvasH
let _levelData, _levelState, _packet
let _levelLoader
let _routingEngine, _firewallChecker, _checkpointSystem, _termTracker
let _hud, _callout, _theoryPanel
let _rafId       = null
let _lastTime    = 0
let _ro          = null
let _inputCooldown = 0
let _running     = false
let _onExit      = null

export function initGame(onExit) {
  _canvas      = document.getElementById('game-canvas')
  _hud         = new HUD()
  _callout     = new Callout()
  _theoryPanel = new TheoryPanel()
  _onExit      = onExit
}

export function startLevel(levelId) {
  _teardown()

  _levelData = LEVELS[levelId]
  if (!_levelData) { _onExit?.(); return }

  _levelLoader      = new LevelLoader()
  _routingEngine    = new RoutingEngine()
  _firewallChecker  = new FirewallChecker()
  _checkpointSystem = new CheckpointSystem()
  _termTracker      = new TermTracker()

  const { ctx, w, h } = setupCanvas(_canvas)
  _ctx = ctx; _canvasW = w; _canvasH = h

  _levelState = _levelLoader.load(_levelData, _canvasW, _canvasH)
  _packet     = new Packet(_levelState)
  _checkpointSystem.init(_packet)

  _hud.init(_levelData, _packet)

  if (_levelData.theory) {
    _packet.inputLocked = true
    _theoryPanel.show(_levelData, () => {
      _packet.inputLocked = false
      _firePendingIntros(_levelState.playerStartNode)
    })
  } else {
    _firePendingIntros(_levelState.playerStartNode)
  }

  _ro = new ResizeObserver(() => {
    const r = setupCanvas(_canvas)
    _ctx = r.ctx; _canvasW = r.w; _canvasH = r.h
    _levelLoader.recomputeOffsets(_canvasW, _canvasH, _levelState)
    _packet.snapToNode()
  })
  _ro.observe(_canvas)

  document.addEventListener('keydown', _onKey)

  _running       = true
  _inputCooldown = 0
  _lastTime      = performance.now()
  _rafId         = requestAnimationFrame(_tick)
}

export function stopGame() {
  _teardown()
  _hud?.clear()
  _callout?.hide()
  _theoryPanel?.hide()
}

function _teardown() {
  _running = false
  if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null }
  if (_ro)    { _ro.disconnect(); _ro = null }
  document.removeEventListener('keydown', _onKey)
  _hideModal()
}

function _tick(now) {
  if (!_running) return
  const dt = Math.min(now - _lastTime, 50)
  _lastTime = now

  _inputCooldown = Math.max(0, _inputCooldown - dt)

  _packet.update(dt)
  drawWorld(_ctx, _canvasW, _canvasH, _levelData, _levelState, _packet)

  _rafId = requestAnimationFrame(_tick)
}

function _onKey(e) {
  if (_callout.isVisible) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); _callout.hide() }
    return
  }

  if (e.key === 'Escape') { _showPause(); return }

  if (_packet._moving || _packet.inputLocked || _inputCooldown > 0) return

  const dirs = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }
  const dir  = dirs[e.key]
  if (!dir) return
  e.preventDefault()

  const targetNode = _levelState.getAdjacentNode(_packet.currentNodeId, dir)
  if (!targetNode) return

  const fromNode = _levelState.getNode(_packet.currentNodeId)

  // Firewall check
  if (targetNode.type === 'firewall' && targetNode.firewallRules?.length) {
    const result = _firewallChecker.check(_packet, targetNode)
    if (!result.allowed) {
      _theoryPanel.highlight(targetNode.id, result.blockingRule?.prefix)
      _packet.playBlocked()
      _checkpointSystem.respawn(_packet)
      _hud.update(_packet)
      _inputCooldown = 400
      return
    }
  }

  // Routing check when leaving a router
  if (fromNode.type === 'router' && fromNode.routingTable?.length) {
    const result = _routingEngine.validateMove(_packet, fromNode, targetNode)
    if (!result.valid) {
      _theoryPanel.highlight(fromNode.id, result.matchedRoute?.prefix)
      _packet.playBlocked()
      _checkpointSystem.respawn(_packet)
      _hud.update(_packet)
      _inputCooldown = 400
      return
    }
  }

  _inputCooldown = 180
  _packet.moveTo(targetNode, () => _onArrived(targetNode))
}

function _onArrived(node) {
  if (node.checkpoint) _checkpointSystem.save(_packet)
  _firePendingIntros(node)
  if (node.type === 'destination') { _onLevelComplete(); return }
  _hud.update(_packet)
}

function _firePendingIntros(node) {
  const intros = _levelData.termIntroductions?.filter(t => t.triggerNode === node.id) || []
  intros.forEach(term => {
    if (!_termTracker.seen(term.termKey)) {
      _termTracker.markSeen(term.termKey)
      const worldPos    = _levelState.getNodeWorldPos(node.id)
      const canvasRect  = _canvas.getBoundingClientRect()
      _callout.show(term, canvasRect, worldPos)
    }
  })
}

function _onLevelComplete() {
  _packet.playSuccess()
  try {
    const p = JSON.parse(localStorage.getItem('yatp_progress') || '{}')
    p[_levelData.id] = true
    localStorage.setItem('yatp_progress', JSON.stringify(p))
  } catch {}

  setTimeout(() => {
    _showTransition(_levelData.id, _levelData.title, _levelData.id < 8 ? _levelData.id + 1 : null)
  }, 700)
}

function _showPause() {
  _running = false
  if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null }
  document.removeEventListener('keydown', _onKey)

  _showModal(`
    <h2>PAUSED</h2>
    <button class="btn-primary" id="btn-resume">Resume</button>
    <button class="btn-ghost"   id="btn-restart">Restart Level</button>
    <button class="btn-ghost"   id="btn-menu-p">Main Menu</button>
  `)

  document.getElementById('btn-resume').onclick = () => {
    _hideModal()
    _running  = true
    _lastTime = performance.now()
    document.addEventListener('keydown', _onKey)
    _rafId = requestAnimationFrame(_tick)
  }
  document.getElementById('btn-restart').onclick = () => { _hideModal(); startLevel(_levelData.id) }
  document.getElementById('btn-menu-p').onclick  = () => { stopGame(); _onExit?.() }
}

function _showTransition(levelId, title, nextId) {
  _running = false
  if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null }
  document.removeEventListener('keydown', _onKey)

  const nextBtn = nextId
    ? `<button class="btn-primary" id="btn-next">Next Level &rarr;</button>`
    : `<button class="btn-primary" id="btn-menu-t">Back to Menu</button>`

  _showModal(`
    <div class="modal-badge">PACKET DELIVERED</div>
    <p class="modal-sub">Level ${levelId}: ${title}</p>
    ${nextBtn}
    <button class="btn-ghost" id="btn-menu-t2">Main Menu</button>
  `)

  if (nextId) document.getElementById('btn-next').onclick = () => { _hideModal(); startLevel(nextId) }
  else        document.getElementById('btn-menu-t').onclick = () => { stopGame(); _onExit?.() }
  document.getElementById('btn-menu-t2').onclick = () => { stopGame(); _onExit?.() }
}

function _showModal(html) {
  const el = document.getElementById('modal-overlay')
  el.innerHTML       = `<div class="modal-panel">${html}</div>`
  el.style.display   = 'flex'
}

function _hideModal() {
  const el = document.getElementById('modal-overlay')
  if (el) { el.style.display = 'none'; el.innerHTML = '' }
}
