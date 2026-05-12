import { ANIM_DURATION } from '../constants.js'

function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t }
function lerp(a, b, t) { return a + (b - a) * t }

export default class Packet {
  constructor(levelState) {
    this.levelState = levelState
    const playerData = levelState.data.player
    const startNode  = levelState.playerStartNode

    this.currentNodeId = startNode.id
    this.srcIP         = playerData.srcIP
    this.destIP        = playerData.destIP
    this.portTag       = playerData.portTag    || null
    this.tcpState      = null
    this.tlsState      = playerData.tlsState   || null
    this.domainName    = playerData.domainName || null
    this.inputLocked   = false

    const pos = levelState.getNodeWorldPos(startNode.id)
    this.renderX = pos.x
    this.renderY = pos.y

    this._startX        = pos.x
    this._startY        = pos.y
    this._targetX       = pos.x
    this._targetY       = pos.y
    this._animProgress  = 1
    this._moving        = false
    this._pendingNodeId = startNode.id
    this._onComplete    = null

    this.flashState = null  // { color: string, progress: 0..1 }
  }

  update(dt) {
    if (this._moving) {
      this._animProgress = Math.min(1, this._animProgress + dt / ANIM_DURATION)
      const t = easeInOut(this._animProgress)
      this.renderX = lerp(this._startX, this._targetX, t)
      this.renderY = lerp(this._startY, this._targetY, t)
      if (this._animProgress >= 1) {
        this._moving = false
        this.currentNodeId = this._pendingNodeId
        if (this._onComplete) { this._onComplete(); this._onComplete = null }
      }
    }

    if (this.flashState) {
      this.flashState.progress = Math.min(1, this.flashState.progress + dt / 300)
      if (this.flashState.progress >= 1) this.flashState = null
    }
  }

  moveTo(targetNode, onComplete) {
    if (this._moving || this.inputLocked) return
    const pos = this.levelState.getNodeWorldPos(targetNode.id)
    this._startX        = this.renderX
    this._startY        = this.renderY
    this._targetX       = pos.x
    this._targetY       = pos.y
    this._animProgress  = 0
    this._moving        = true
    this._pendingNodeId = targetNode.id
    this._onComplete    = onComplete || null
  }

  snapToNode() {
    const pos = this.levelState.getNodeWorldPos(this.currentNodeId)
    if (!pos) return
    this.renderX       = pos.x
    this.renderY       = pos.y
    this._startX       = pos.x
    this._startY       = pos.y
    this._targetX      = pos.x
    this._targetY      = pos.y
    this._animProgress = 1
    this._moving       = false
  }

  playBlocked() { this.flashState = { color: '#ffadad', progress: 0 } }
  playSuccess() { this.flashState = { color: '#acd157', progress: 0 } }
}
