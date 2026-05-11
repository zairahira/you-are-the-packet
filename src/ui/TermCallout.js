import Phaser from 'phaser'
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants.js'

const CSS = {
  TEXT_MAIN:     '#f5f6f7',
  TEXT_DIM:      '#d0d0d5',
  ACCENT_PURPLE: '#dbb8ff',
  TEXT_MUTED:    '#858591',
}

export default class TermCallout {
  constructor(scene) {
    this.scene = scene
    this.isVisible = false
    this._container = null
    this._dismissKey = null
  }

  show(termData, worldPos) {
    if (this.isVisible) return
    this.isVisible = true

    const { scene } = this
    const { width, height } = scene.scale

    const panelW = 320
    const panelH = 140
    const margin = 20

    // Position: prefer right of node, flip if too close to edge
    let px = (worldPos.x + 60)
    let py = worldPos.y - panelH / 2
    if (px + panelW > width - margin) px = worldPos.x - panelW - 60
    if (py < margin) py = margin
    if (py + panelH > height - margin) py = height - panelH - margin

    const container = scene.add.container(0, 0)
    container.setAlpha(0)

    const bg = scene.add.graphics()
    bg.fillStyle(COLORS.BG_EDITOR)
    bg.lineStyle(2, COLORS.ACCENT_PURPLE)
    bg.strokeRect(px, py, panelW, panelH)
    bg.fillRect(px, py, panelW, panelH)

    const headline = scene.add.text(px + 14, py + 14, termData.headline, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: CSS.ACCENT_PURPLE,
      fontStyle: 'bold',
    })

    const body = scene.add.text(px + 14, py + 42, termData.body, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: CSS.TEXT_DIM,
      wordWrap: { width: panelW - 28 },
    })

    const dismiss = scene.add.text(px + panelW - 14, py + panelH - 14, '[space] dismiss', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: CSS.TEXT_MUTED,
    }).setOrigin(1, 1)

    container.add([bg, headline, body, dismiss])
    this._container = container

    // Tween in
    scene.tweens.add({
      targets: container,
      alpha: 1,
      duration: 200,
      ease: 'Sine.easeOut',
    })

    // Auto-dismiss after 6 seconds
    this._autoTimer = scene.time.delayedCall(6000, () => this.hide())

    // Dismiss on space/enter/click
    this._dismissKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this._enterKey   = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this._clickHandler = () => this.hide()
    scene.input.once('pointerdown', this._clickHandler)

    scene.events.once('dismiss-callout', () => this.hide())
  }

  hide() {
    if (!this.isVisible || !this._container) return

    const { scene } = this
    if (this._autoTimer) { this._autoTimer.remove(); this._autoTimer = null }
    if (this._dismissKey) scene.input.keyboard.removeKey(this._dismissKey)
    if (this._enterKey)   scene.input.keyboard.removeKey(this._enterKey)

    scene.tweens.add({
      targets: this._container,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        if (this._container) { this._container.destroy(); this._container = null }
        this.isVisible = false
      },
    })
  }

  update() {
    if (!this.isVisible) return
    if (this._dismissKey && Phaser.Input.Keyboard.JustDown(this._dismissKey)) this.hide()
    if (this._enterKey   && Phaser.Input.Keyboard.JustDown(this._enterKey))   this.hide()
  }
}
