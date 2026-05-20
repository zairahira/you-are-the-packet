import { PACKET_SIZE } from './constants.js'

const DARK_THEME = {
  canvasBg:         '#0a0a23',
  gridBg:           '#1b1b32',
  gridLine:         'rgba(59,59,79,0.3)',
  edgeDefault:      '#4a4a6a',
  edgeVisited:      'rgba(172,209,87,0.65)',
  edgeUnstableRgb:  '255,173,173',
  nodeFill:         '#2a2a40',
  ifaceBg:          '#0a0a23',
  ifaceText:        '#858591',
  nodeLabel:        '#858591',
  labelBg:          'rgba(27,27,50,0.85)',
  labelText:        '#f5f6f7',
  packetColor:      '#dbb8ff',
  packetOutline:    '#ffffff',
  infoBadgeFill:    '#1b1b32',
  infoBadgeBorder:  '#dbb8ff',
  infoBadgeText:    '#dbb8ff',
  nodeColors: {
    spawn:           '#acd157',
    router:          '#99c9ff',
    firewall:        '#ffadad',
    'dns-resolver':  '#dbb8ff',
    'nat-gateway':   '#f1be32',
    'tcp-node':      '#99c9ff',
    'dhcp-server':   '#f1be32',
    'tls-node':      '#dbb8ff',
    'http-node':     '#acd157',
    'session-gate':  '#dbb8ff',
    'as-node':       '#99c9ff',
    'rate-limit':    '#ffadad',
    exit:            '#4a4a6a',
    destination:     '#acd157',
  },
  labelColors: {
    'ip-label':      '#99c9ff',
    'cidr-label':    '#f1be32',
    'port-label':    '#ffadad',
    'routing-entry': '#d0d0d5',
    'rule-text':     '#ffadad',
  },
}

const LIGHT_THEME = {
  canvasBg:         '#f5f6f7',
  gridBg:           '#e8e8ed',
  gridLine:         'rgba(192,192,204,0.4)',
  edgeDefault:      '#c0c0cc',
  edgeVisited:      'rgba(0,71,27,0.55)',
  edgeUnstableRgb:  '133,0,0',
  nodeFill:         '#ffffff',
  ifaceBg:          '#f5f6f7',
  ifaceText:        '#3b3b4f',
  nodeLabel:        '#6b6b80',
  labelBg:          'rgba(232,232,237,0.95)',
  labelText:        '#1b1b32',
  packetColor:      '#5a01a7',
  packetOutline:    '#0a0a23',
  infoBadgeFill:    '#ffffff',
  infoBadgeBorder:  '#5a01a7',
  infoBadgeText:    '#5a01a7',
  nodeColors: {
    spawn:           '#00471b',
    router:          '#002ead',
    firewall:        '#850000',
    'dns-resolver':  '#5a01a7',
    'nat-gateway':   '#4d3800',
    'tcp-node':      '#002ead',
    'dhcp-server':   '#4d3800',
    'tls-node':      '#5a01a7',
    'http-node':     '#00471b',
    'session-gate':  '#5a01a7',
    'as-node':       '#002ead',
    'rate-limit':    '#850000',
    exit:            '#6b6b80',
    destination:     '#00471b',
  },
  labelColors: {
    'ip-label':      '#002ead',
    'cidr-label':    '#4d3800',
    'port-label':    '#850000',
    'routing-entry': '#3b3b4f',
    'rule-text':     '#850000',
  },
}

function getThemeColors() {
  return document.documentElement.dataset.theme === 'light' ? LIGHT_THEME : DARK_THEME
}

const NODE_ICONS = {
  spawn:           '>',
  router:          'R',
  firewall:        'FW',
  'dns-resolver':  'DNS',
  'nat-gateway':   'NAT',
  'tcp-node':      'TCP',
  'dhcp-server':   'DHCP',
  'tls-node':      'TLS',
  'http-node':     'HTTP',
  'session-gate':  'SES',
  'as-node':       'AS',
  'rate-limit':    'RL',
  exit:            '?',
  destination:     'SRV',
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

export function drawWorld(ctx, w, h, levelData, levelState, packet, visitedEdges) {
  const T = getThemeColors()

  ctx.fillStyle = T.canvasBg
  ctx.fillRect(0, 0, w, h)

  const ts = levelData.tileSize
  const ox = levelState.offsetX
  const oy = levelState.offsetY
  const gw = levelData.gridWidth  * ts
  const gh = levelData.gridHeight * ts

  ctx.fillStyle = T.gridBg
  ctx.fillRect(ox, oy, gw, gh)

  ctx.strokeStyle = T.gridLine
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

  _drawEdges(ctx, levelData, levelState, visitedEdges, T)
  _drawNodes(ctx, levelData, levelState, T)
  _drawLabels(ctx, levelData, levelState, T)
  _drawPacket(ctx, packet, T)
}

function _drawEdges(ctx, levelData, levelState, visitedEdges, T) {
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
    const visited  = visitedEdges?.has(`${edge.from}→${edge.to}`) ||
                     visitedEdges?.has(`${edge.to}→${edge.from}`)

    if (unstable) {
      const alpha = (0.4 + 0.3 * Math.sin(Date.now() / 350)).toFixed(2)
      ctx.strokeStyle = `rgba(${T.edgeUnstableRgb},${alpha})`
    } else if (visited) {
      ctx.strokeStyle = T.edgeVisited
    } else {
      ctx.strokeStyle = T.edgeDefault
    }
    ctx.lineWidth = visited ? 4 : 3
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()

    const iface = ifaceMap.get(edge.from)?.get(edge.to)
    if (iface) {
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

      ctx.fillStyle = T.ifaceBg
      ctx.fillRect(tx - tw / 2 - px, ty - ph / 2, tw + px * 2, ph)

      ctx.fillStyle    = T.ifaceText
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(iface, tx, ty)
    }
  })
}

function _drawNodes(ctx, levelData, levelState, T) {
  const ts = levelData.tileSize
  const r  = Math.floor(ts * 0.33)

  levelData.nodes.forEach(node => {
    const pos = levelState.getNodeWorldPos(node.id)
    if (!pos) return
    const { x, y } = pos
    const color = T.nodeColors[node.type] || T.nodeLabel

    ctx.beginPath()
    ctx.arc(x, y, r + 6, 0, Math.PI * 2)
    ctx.fillStyle = color + '26'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = T.nodeFill
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    const icon     = NODE_ICONS[node.type] || '?'
    const fontSize = icon.length > 2 ? 11 : icon.length > 1 ? 13 : 15
    ctx.font        = `bold ${fontSize}px ${MONO}`
    ctx.textAlign   = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle   = color
    ctx.fillText(icon, x, y)

    if (node.label) {
      ctx.font         = `11px ${MONO}`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle    = T.nodeLabel
      ctx.fillText(node.label, x, y + r + 6)
    }
  })
}


function _drawLabels(ctx, levelData, levelState, T) {
  ;(levelData.labels || []).forEach(lbl => {
    const pos = levelState.getNodeWorldPos(lbl.attachToNode)
    if (!pos) return
    const x = pos.x + (lbl.offsetX || 0)
    const y = pos.y + (lbl.offsetY || -32)

    ctx.font = `12px ${MONO}`
    const tw = ctx.measureText(lbl.text).width
    const ph = 20
    const px = 6

    ctx.fillStyle = T.labelBg
    ctx.fillRect(x - tw / 2 - px, y - ph / 2, tw + px * 2, ph)

    ctx.fillStyle    = T.labelColors[lbl.style] || T.labelText
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(lbl.text, x, y)
  })
}

function _drawPacket(ctx, packet, T) {
  const { renderX: x, renderY: y, flashState } = packet
  const size = PACKET_SIZE

  let color    = T.packetColor
  let glowSize = 6

  if (flashState) {
    const pulse = flashState.progress < 0.5
      ? flashState.progress * 2
      : (1 - flashState.progress) * 2
    color    = flashState.color
    glowSize = 6 + pulse * 6
  }

  ctx.fillStyle = color + '40'
  ctx.fillRect(x - size / 2 - glowSize, y - size / 2 - glowSize, size + glowSize * 2, size + glowSize * 2)

  ctx.fillStyle = color
  ctx.fillRect(x - size / 2, y - size / 2, size, size)

  ctx.strokeStyle = T.packetOutline
  ctx.lineWidth   = 1.5
  ctx.strokeRect(x - size / 2, y - size / 2, size, size)
}

export const INFO_BADGE_R = 9

export function getInfoBadgeCenter(pos, nodeR) {
  return { x: pos.x + nodeR + 6, y: pos.y - nodeR - 4 }
}

export function drawInfoBadges(ctx, levelData, levelState, infoNodes) {
  if (!infoNodes?.size) return
  const T     = getThemeColors()
  const ts    = levelData.tileSize
  const nodeR = Math.floor(ts * 0.33)

  infoNodes.forEach((_, nodeId) => {
    const pos = levelState.getNodeWorldPos(nodeId)
    if (!pos) return
    const { x: bx, y: by } = getInfoBadgeCenter(pos, nodeR)

    ctx.beginPath()
    ctx.arc(bx, by, INFO_BADGE_R, 0, Math.PI * 2)
    ctx.fillStyle = T.infoBadgeFill
    ctx.fill()
    ctx.strokeStyle = T.infoBadgeBorder
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.font             = `bold 11px ${MONO}`
    ctx.fillStyle        = T.infoBadgeText
    ctx.textAlign        = 'center'
    ctx.textBaseline     = 'middle'
    ctx.fillText('i', bx, by + 0.5)
  })
}
