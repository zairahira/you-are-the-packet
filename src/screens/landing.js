const SEEN_KEY     = 'yatp_seen_intro'
const PROGRESS_KEY = 'yatp_progress'

export function shouldSkipLanding() {
  try {
    if (localStorage.getItem(SEEN_KEY)) return true
    const p = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')
    return Object.keys(p).length > 0
  } catch { return false }
}

export function mountLanding(container, onBegin) {
  container.style.display = 'block'
  _setupObserver()
  _setupKeys()
  _setupBegin(onBegin)
}

export function unmountLanding(container) {
  container.style.display = 'none'
  _teardown()
}

let _observer = null, _keyHandler = null, _beginHandler = null

function _setupObserver() {
  const scroller = document.getElementById('landing-scroller')
  if (!scroller) return

  const slides = scroller.querySelectorAll('.l-slide')

  // Slide 1 visible immediately - no scroll needed
  slides[0]?.querySelector('.l-content')?.classList.add('is-visible')

  _observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelector('.l-content')?.classList.add('is-visible')
        _observer.unobserve(e.target)
      }
    })
  }, { root: scroller, threshold: 0.45 })

  for (let i = 1; i < slides.length; i++) _observer.observe(slides[i])
}

function _setupKeys() {
  const scroller = document.getElementById('landing-scroller')
  if (!scroller) return
  _keyHandler = e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key === 'Tab') return
    const h = window.innerHeight
    const cur = Math.round(scroller.scrollTop / h)
    if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      scroller.scrollTo({ top: Math.min(cur + 1, 4) * h, behavior: 'smooth' })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      scroller.scrollTo({ top: Math.max(cur - 1, 0) * h, behavior: 'smooth' })
    } else if (cur === 0) {
      // Any key on slide 1 advances to slide 2
      e.preventDefault()
      scroller.scrollTo({ top: h, behavior: 'smooth' })
    }
  }
  document.addEventListener('keydown', _keyHandler)
}

function _setupBegin(onBegin) {
  const btn = document.getElementById('btn-begin')
  if (!btn) return
  _beginHandler = () => {
    try { localStorage.setItem(SEEN_KEY, '1') } catch {}
    onBegin()
  }
  btn.addEventListener('click', _beginHandler)
}

function _teardown() {
  _observer?.disconnect(); _observer = null
  if (_keyHandler) { document.removeEventListener('keydown', _keyHandler); _keyHandler = null }
  const btn = document.getElementById('btn-begin')
  if (btn && _beginHandler) { btn.removeEventListener('click', _beginHandler); _beginHandler = null }
}
