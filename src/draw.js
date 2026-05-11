import { PACKET_SIZE } from './constants.js'

const NODE_COLORS = {
  spawn:          '#acd157',
  router:         '#99c9ff',
  firewall:       '#ffadad',
  'dns-resolver': '#dbb8ff',
  'nat-gateway':  '#f1be32',
  'tcp-node':     '#99c9ff',
  exit:           '#4a4a6a',
  destination:    '#acd157',
}

const NODE_ICONS = {
  spawn:          '>',
  router:         'R',
  firewall:       'FW',
  'dns-resolver': 'DNS',
  'nat-gateway':  'NAT',
  'tcp-node':     'TCP',
  exit:           '?',
  destination:    'SRV',
}

const LABEL_COLORS = {
  'ip-label':      '#99c9ff',
  'cidr-label':    '#f1be32',
  'port-label':    '#ffadad',
  'routing-entry': '#d0d0d5',
  'rule-text':     '#ffadad',
}

const MONO = "'Fira Mono', Consolas, 'Courier New', monospace"

export function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1
  const w   = canvas.clientWidth
  const h   = canvas.clientHeight
  canvas.width  = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  return { ctx, w, h }
}

export function drawWorld(ctx, w, h, levelData, levelState, packet) {
  ctx.fillStyle = '#0a0a23'
  ctx.fillRect(0, 0, w, h)

  const ts = levelData.tileSize
  const ox = levelState.offsetX
  const oy = levelState.offsetY
  const gw = levelData.gridWidth  * ts
  const gh = levelData.gridHeight * ts

  // Grid background
  ctx.fillStyle = '#1b1b32'
  ctx.fillRect(ox, oy, gw, gh)

  ctx.strokeStyle = 'rgba(59,59,79,0.3)'
  ctx.lineWidth = 1
  for (let c = 0; c <= levelData.gridWidth; c++) {
    ctx.beginPath()
    ctx.moveTo(ox + c * ts, oy)
    ctx.lineTo(ox + c * ts, oy + gh)
    ctx.stroke()
  }
  for (let r = 0; r <= levelData.gridHeight; r++) {
    ctx.beginPath()
    ctx.moveTo(ox, oy + r * ts)
    ctx.lineTo(ox + gw, oy + r * ts)
    ctx.stroke()
  }

  _drawEdges(ctx, levelData, levelState)
  _drawNodes(ctx, levelData, levelState)
  _drawLabels(ctx, levelData, levelState)
  _drawPacket(ctx, packet)
}

function _drawEdges(ctx, levelData, levelState) {
  // Build map: nodeId -> (nextHopId -> interfaceName) from routing tables
  const ifaceMap = new Map()
  ;(levelData.nodes || []).forEach(node => {
    if (node.routingTable?.length) {
      const hopToIface = new Map()
      node.routingTable.forEach(r => hopToIface.set(r.nextHop, r.interface))
      ifaceMap.set(node.id, hopToIface)
    }
  })

  levelData.edges.forEach(edge => {
    const a = levelState.getNodeWorldPos(edge.from)
    const b = levelState.getNodeWorldPos(edge.to)
    if (!a || !b) return

    const unstable = (edge.dropRate || 0) > 0
    if (unstable) {
      const alpha = (0.4 + 0.3 * Math.sin(Date.now() / 350)).toFixed(2)
      ctx.strokeStyle = `rgba(255,173,173,${alpha})`
    } else {
      ctx.strokeStyle = '#4a4a6a'
    }
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()

    // Draw interface label where the edge leaves the router
    const iface = ifaceMap.get(edge.from)?.get(edge.to)
    if (iface) {
      // Fixed pixel distance from router center: past the circle (r≈21) + node label below (~17px)
      const nodeR = Math.floor(levelData.tileSize * 0.33)
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len = Math.sqrt(dx * dx + dy * dy)
      const dist = nodeR + 30
      const tx = a.x + (dx / len) * dist
      const ty = a.y + (dy / len) * dist

      ctx.font = `bold 10px ${MONO}`
      const tw = ctx.measureText(iface).width
      const ph = 15
      const px = 5

      ctx.fillStyle = '#0a0a23'
      ctx.fillRect(tx - tw / 2 - px, ty - ph / 2, tw + px * 2, ph)

      ctx.fillStyle    = '#858591'
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(iface, tx, ty)
    }
  })
}

function _drawNodes(ctx, levelData, levelState) {
  const ts = levelData.tileSize
  const r  = Math.floor(ts * 0.33)

  levelData.nodes.forEach(node => {
    const pos = levelState.getNodeWorldPos(node.id)
    if (!pos) return
    const { x, y } = pos
    const color = NODE_COLORS[node.type] || '#858591'

    // Glow ring
    ctx.beginPath()
    ctx.arc(x, y, r + 6, 0, Math.PI * 2)
    ctx.fillStyle = color + '26'
    ctx.fill()

    // Body circle
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = '#2a2a40'
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    // Icon text
    const icon     = NODE_ICONS[node.type] || '?'
    const fontSize = icon.length > 2 ? 11 : icon.length > 1 ? 13 : 15
    ctx.font        = `bold ${fontSize}px ${MONO}`
    ctx.textAlign   = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle   = color
    ctx.fillText(icon, x, y)

    // Label below
    if (node.label) {
      ctx.font         = `11px ${MONO}`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle    = '#858591'
      ctx.fillText(node.label, x, y + r + 6)
    }
  })
}


function _drawLabels(ctx, levelData, levelState) {
  ;(levelData.labels || []).forEach(lbl => {
    const pos = levelState.getNodeWorldPos(lbl.attachToNode)
    if (!pos) return
    const x = pos.x + (lbl.offsetX || 0)
    const y = pos.y + (lbl.offsetY || -32)

    ctx.font = `12px ${MONO}`
    const tw = ctx.measureText(lbl.text).width
    const ph = 20
    const px = 6

    ctx.fillStyle = 'rgba(27,27,50,0.85)'
    ctx.fillRect(x - tw / 2 - px, y - ph / 2, tw + px * 2, ph)

    ctx.fillStyle    = LABEL_COLORS[lbl.style] || '#f5f6f7'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(lbl.text, x, y)
  })
}

function _drawPacket(ctx, packet) {
  const { renderX: x, renderY: y, flashState } = packet
  const size = PACKET_SIZE

  let color    = '#dbb8ff'
  let glowSize = 6

  if (flashState) {
    const pulse = flashState.progress < 0.5
      ? flashState.progress * 2
      : (1 - flashState.progress) * 2
    color    = flashState.color
    glowSize = 6 + pulse * 6
  }

  // Glow
  ctx.fillStyle = color + '40'
  ctx.fillRect(x - size / 2 - glowSize, y - size / 2 - glowSize, size + glowSize * 2, size + glowSize * 2)

  // Body
  ctx.fillStyle = color
  ctx.fillRect(x - size / 2, y - size / 2, size, size)

  // Outline
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth   = 1.5
  ctx.strokeRect(x - size / 2, y - size / 2, size, size)
}
