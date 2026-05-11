import { mountMenu, unmountMenu } from './screens/menu.js'
import { initGame, startLevel, stopGame } from './screens/game.js'

window.onerror = (msg, src, line, col, err) => {
  document.body.style.background = '#0a0a23'
  document.body.innerHTML = `<pre style="color:#ffadad;font-family:monospace;padding:24px;white-space:pre-wrap">[ERROR]\n${msg}\n${src}:${line}\n${err?.stack || ''}</pre>`
}
window.addEventListener('unhandledrejection', e => {
  document.body.style.background = '#0a0a23'
  document.body.innerHTML = `<pre style="color:#ffadad;font-family:monospace;padding:24px;white-space:pre-wrap">[ERROR]\n${e.reason}</pre>`
})

const screenMenu = document.getElementById('screen-menu')
const screenGame = document.getElementById('screen-game')

initGame(showMenu)
showMenu()

function showMenu() {
  stopGame()
  screenGame.style.display = 'none'
  screenMenu.style.display = 'flex'
  mountMenu(screenMenu, levelId => {
    unmountMenu(screenMenu)
    showGame(levelId)
  })
}

function showGame(levelId) {
  screenMenu.style.display = 'none'
  screenGame.style.display = 'flex'
  startLevel(levelId)
}
