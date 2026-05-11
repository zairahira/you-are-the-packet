export default class CheckpointSystem {
  constructor() {
    this.savedState = null
  }

  init(packet) {
    // Save initial spawn as first checkpoint
    this.save(packet)
  }

  save(packet) {
    this.savedState = {
      nodeId:    packet.currentNodeId,
      srcIP:     packet.srcIP,
      destIP:    packet.destIP,
      portTag:   packet.portTag,
      tcpState:  packet.tcpState,
    }
  }

  respawn(packet) {
    if (!this.savedState) return
    packet.currentNodeId = this.savedState.nodeId
    packet.srcIP         = this.savedState.srcIP
    packet.destIP        = this.savedState.destIP
    packet.portTag       = this.savedState.portTag
    packet.tcpState      = this.savedState.tcpState
    packet.snapToNode()
  }
}
