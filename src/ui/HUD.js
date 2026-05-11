import { COLORS, GAME_WIDTH, HUD_HEIGHT } from '../constants.js'

const CSS = {
  BG_SURFACE:    '#1b1b32',
  BORDER:        '#3b3b4f',
  TEXT_MUTED:    '#858591',
  TEXT_MAIN:     '#f5f6f7',
  ACCENT_BLUE:   '#99c9ff',
  ACCENT_YELLOW: '#f1be32',
  ACCENT_GREEN:  '#acd157',
  ACCENT_PURPLE: '#dbb8ff',
}

export default class HUD {
  constructor(scene, levelState, packet) {
    this.scene = scene
    this.levelState = levelState
    this.packet = packet

    const data = levelState.data

    // Background bar
    const g = scene.add.graphics()
    g.fillStyle(COLORS.BG_SURFACE)
    g.lineStyle(1, COLORS.BORDER)
    g.fillRect(0, 0, GAME_WIDTH, HUD_HEIGHT)
    g.lineBetween(0, HUD_HEIGHT, GAME_WIDTH, HUD_HEIGHT)

    // Level label
    scene.add.text(12, HUD_HEIGHT / 2, `LVL ${data.id}: ${data.title}`, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: CSS.TEXT_MUTED,
    }).setOrigin(0, 0.5)

    // Source IP
    this._srcTxt = scene.add.text(GAME_WIDTH / 2 - 240, HUD_HEIGHT / 2, `YOU: ${packet.srcIP}`, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: CSS.ACCENT_BLUE,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5)

    // Arrow
    scene.add.text(GAME_WIDTH / 2 - 60, HUD_HEIGHT / 2, '->', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: CSS.TEXT_MUTED,
    }).setOrigin(0, 0.5)

    // Destination IP
    this._destTxt = scene.add.text(GAME_WIDTH / 2 - 30, HUD_HEIGHT / 2, `DEST: ${packet.destIP}`, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: CSS.ACCENT_GREEN,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5)

    // Port tag (right side)
    this._portTxt = scene.add.text(GAME_WIDTH - 160, HUD_HEIGHT / 2, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: CSS.ACCENT_YELLOW,
    }).setOrigin(0, 0.5)

    this.update(packet)
  }

  update(packet) {
    this._srcTxt.setText(`YOU: ${packet.srcIP}`)
    this._destTxt.setText(packet.domainName
      ? `DEST: ${packet.domainName}${packet.destIP ? ` (${packet.destIP})` : ''}`
      : `DEST: ${packet.destIP}`)
    this._portTxt.setText(packet.portTag ? `PORT: ${packet.portTag}` : '')
  }
}
