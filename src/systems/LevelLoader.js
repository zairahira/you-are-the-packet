import LevelState from './LevelState.js'

export default class LevelLoader {
  load(levelData, canvasW, canvasH) {
    const state = new LevelState(levelData)
    this.recomputeOffsets(canvasW, canvasH, state)
    return state
  }

  recomputeOffsets(canvasW, canvasH, state) {
    const { tileSize, gridWidth, gridHeight } = state.data
    const gw = gridWidth  * tileSize
    const gh = gridHeight * tileSize
    state.offsetX = Math.floor((canvasW - gw) / 2)
    state.offsetY = Math.floor((canvasH - gh) / 2)

    state.data.nodes.forEach(node => {
      const wx = state.offsetX + node.col * tileSize + tileSize / 2
      const wy = state.offsetY + node.row * tileSize + tileSize / 2
      state.setNodeWorldPos(node.id, wx, wy)
    })
  }
}
