export default class TermTracker {
  constructor() {
    this._seen = new Set()
  }

  seen(termKey) {
    return this._seen.has(termKey)
  }

  markSeen(termKey) {
    this._seen.add(termKey)
  }
}
