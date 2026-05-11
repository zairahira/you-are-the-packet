import { COLORS } from '../constants.js'

export default class RuleHighlight {
  constructor(scene, levelState) {
    this.scene = scene
    this.levelState = levelState
  }

  show(rule, node) {
    if (!rule || !node) return

    const rows = this.levelState.getRoutingTableTexts(node.id)
    if (!rows || rows.length === 0) return

    // Find the row matching this route
    const match = rows.find(r => r.route === rule || r.route.prefix === rule.prefix)
    if (!match) return

    const txt = match.text
    const origColor = txt.style.color

    txt.setColor('#f1be32')
    this.scene.time.delayedCall(3000, () => {
      if (txt && txt.active) txt.setColor(origColor)
    })
  }
}
