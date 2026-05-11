export default class LevelState {
  constructor(levelData) {
    this.data = levelData
    this._nodes = {}
    this._nodeWorldPos = {}
    this._adjacency = {}

    levelData.nodes.forEach(n => {
      this._nodes[n.id] = n
      this._adjacency[n.id] = []
    })

    levelData.edges.forEach(e => {
      this._adjacency[e.from] = this._adjacency[e.from] || []
      this._adjacency[e.to]   = this._adjacency[e.to]   || []
      this._adjacency[e.from].push({ nodeId: e.to,   dropRate: e.dropRate || 0 })
      if (!e.directed) {
        this._adjacency[e.to].push({ nodeId: e.from, dropRate: e.dropRate || 0 })
      }
    })
  }

  getNode(id) {
    return this._nodes[id]
  }

  getAdjacentNode(fromId, dir) {
    const from = this._nodes[fromId]
    if (!from) return null

    const neighbors = this._adjacency[fromId] || []
    for (const { nodeId } of neighbors) {
      const to = this._nodes[nodeId]
      if (!to) continue
      const dc = to.col - from.col
      const dr = to.row - from.row
      if (dir === 'right' && dc > 0 && dr === 0) return to
      if (dir === 'left'  && dc < 0 && dr === 0) return to
      if (dir === 'down'  && dr > 0 && dc === 0) return to
      if (dir === 'up'    && dr < 0 && dc === 0) return to
    }
    return null
  }

  getEdge(fromId, toId) {
    return this.data.edges.find(
      e => (e.from === fromId && e.to === toId) || (!e.directed && e.from === toId && e.to === fromId)
    )
  }

  setNodeWorldPos(id, x, y) {
    this._nodeWorldPos[id] = { x, y }
  }

  getNodeWorldPos(id) {
    return this._nodeWorldPos[id] || null
  }

  get playerStartNode() {
    return this._nodes[this.data.player.startNode]
  }

  get destinationNodeId() {
    return this.data.destination.nodeId
  }

  get firewallRules() {
    return this.data.firewallRules || []
  }
}
