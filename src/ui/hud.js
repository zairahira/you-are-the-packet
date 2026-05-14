export default class HUD {
  init(levelData, packet) {
    this._levelEl = document.getElementById('hud-level')
    this._srcEl   = document.getElementById('hud-src')
    this._destEl  = document.getElementById('hud-dest')
    this._portEl  = document.getElementById('hud-port')

    if (this._levelEl) this._levelEl.textContent = `LVL ${levelData.id}: ${levelData.title}`
    this.update(packet)
  }

  update(packet) {
    if (this._srcEl)  this._srcEl.textContent  = packet.srcIP ? `YOU: ${packet.srcIP}` : 'YOU: (no IP yet)'
    if (this._destEl) this._destEl.textContent = packet.domainName
      ? `DEST: ${packet.domainName}${packet.destIP ? ` (${packet.destIP})` : ''}`
      : `DEST: ${packet.destIP}`
    if (this._portEl) {
      if (packet.tlsState)        this._portEl.textContent = `TLS: ${packet.tlsState}`
      else if (packet.tcpState)   this._portEl.textContent = `TCP: ${packet.tcpState}`
      else if (packet.httpMethod) this._portEl.textContent = `HTTP: ${packet.httpMethod} ${packet.httpPath || ''}`
      else                        this._portEl.textContent = packet.portTag ? `PORT: ${packet.portTag}` : ''
    }
  }

  clear() {
    if (this._levelEl) this._levelEl.textContent = ''
    if (this._srcEl)   this._srcEl.textContent   = ''
    if (this._destEl)  this._destEl.textContent  = ''
    if (this._portEl)  this._portEl.textContent  = ''
  }
}
