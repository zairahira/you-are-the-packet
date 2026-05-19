import { mountMenu, unmountMenu } from './screens/menu.js'
import { initGame, startLevel, stopGame } from './screens/game.js'
import { mountLanding, unmountLanding, shouldSkipLanding } from './screens/landing.js'

window.onerror = (msg, src, line, col, err) => {
  document.body.style.background = '#0a0a23'
  document.body.innerHTML = `<pre style="color:#ffadad;font-family:monospace;padding:24px;white-space:pre-wrap">[ERROR]\n${msg}\n${src}:${line}\n${err?.stack || ''}</pre>`
}
window.addEventListener('unhandledrejection', e => {
  document.body.style.background = '#0a0a23'
  document.body.innerHTML = `<pre style="color:#ffadad;font-family:monospace;padding:24px;white-space:pre-wrap">[ERROR]\n${e.reason}</pre>`
})

const screenMenu    = document.getElementById('screen-menu')
const screenGame    = document.getElementById('screen-game')
const screenLanding = document.getElementById('screen-landing')
let _landingDismissed = false

initGame(showMenu)
navigate()

window.addEventListener('hashchange', navigate)

function getHashLevel() {
  const m = window.location.hash.match(/^#level\/(\d+)$/)
  return m ? parseInt(m[1], 10) : null
}

function navigate() {
  const levelId = getHashLevel()
  if (levelId !== null) {
    unmountMenu(screenMenu)
    unmountLanding(screenLanding)
    showGame(levelId)
  } else if (!shouldSkipLanding() && !_landingDismissed) {
    showLanding()
  } else {
    showMenu()
  }
}

function showLanding() {
  stopGame()
  screenGame.style.display   = 'none'
  screenMenu.style.display   = 'none'
  mountLanding(screenLanding, () => {
    unmountLanding(screenLanding)
    _landingDismissed = true
    showMenu()
  })
}

function showMenu() {
  stopGame()
  screenGame.style.display = 'none'
  screenMenu.style.display = 'flex'
  if (window.location.hash !== '') {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
  mountMenu(screenMenu, levelId => {
    unmountMenu(screenMenu)
    window.location.hash = `#level/${levelId}`
  })
}

function showGame(levelId) {
  screenMenu.style.display = 'none'
  screenGame.style.display = 'flex'
  startLevel(levelId)
}
