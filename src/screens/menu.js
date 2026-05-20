const ACTS = [
  {
    name: 'Act I - Streets and Addresses',
    color: '#99c9ff',
    levels: [
      { id: 1,  title: 'First Hop',               concept: 'Basic Routing'        },
      { id: 2,  title: 'Chain Reaction',           concept: 'Multiple Hops'        },
      { id: 3,  title: 'The Subnet Maze',          concept: 'Longest Prefix'       },
    ],
  },
  {
    name: 'Act II - Who Am I, Where Am I Going?',
    color: '#acd157',
    levels: [
      { id: 4,  title: 'Getting on the Network',   concept: 'DHCP'                 },
      { id: 5,  title: 'Name Resolution',          concept: 'DNS'                  },
      { id: 6,  title: 'The Disguise',             concept: 'NAT'                  },
    ],
  },
  {
    name: 'Act III - The Hostile Internet',
    color: '#ffadad',
    levels: [
      { id: 7,  title: 'Port of Entry',            concept: 'Ports & Firewalls'    },
      { id: 8,  title: 'Lost in Transit',          concept: 'Packet Loss'          },
      { id: 9,  title: 'The Divided Campus',       concept: 'VLANs'               },
    ],
  },
  {
    name: 'Act IV - Trust and Transit',
    color: '#dbb8ff',
    levels: [
      { id: 10, title: 'The Traffic Distributor',  concept: 'Load Balancing'       },
      { id: 11, title: 'Shake on It',              concept: 'TCP Handshake'        },
      { id: 12, title: 'The Encrypted Channel',    concept: 'TLS'                  },
    ],
  },
  {
    name: 'Act V - What You Carry',
    color: '#f1be32',
    levels: [
      { id: 13, title: 'The Request',              concept: 'HTTP'                 },
      { id: 14, title: 'Remember Me',              concept: 'Cookies & Sessions'   },
      { id: 15, title: 'The Shortcut',             concept: 'CDN & Caching'        },
      { id: 16, title: 'Follow the Redirect',      concept: 'HTTP Redirects'       },
    ],
  },
  {
    name: 'Act VI - The Open Internet',
    color: '#5bc8af',
    levels: [
      { id: 17, title: 'Crossing Borders',         concept: 'BGP'                  },
      { id: 18, title: 'Nearest Wins',             concept: 'Anycast'              },
      { id: 19, title: 'The Meeting Point',        concept: 'IXP'                  },
    ],
  },
  {
    name: 'Act VII - Under Threat',
    color: '#ff7676',
    levels: [
      { id: 20, title: 'The Impersonator',         concept: 'MITM & HSTS'          },
      { id: 21, title: 'The Flood',                concept: 'DDoS & Rate Limiting' },
      { id: 22, title: 'Signed Ground',            concept: 'DNSSEC'               },
    ],
  },
]

const CONCEPT_ICONS = {
  'Basic Routing':          '⬡',
  'Multiple Hops':          '⬡',
  'Longest Prefix':         '⬡',
  'DHCP':                   '◫',
  'DNS':                    '◫',
  'NAT':                    '⇄',
  'Ports & Firewalls':      '⊡',
  'Packet Loss':            '≋',
  'VLANs':                  '⊞',
  'Load Balancing':         '⊕',
  'TCP Handshake':          '↔',
  'TLS':                    '⊗',
  'HTTP':                   '≡',
  'Cookies & Sessions':     '≡',
  'CDN & Caching':          '⊕',
  'HTTP Redirects':         '⇄',
  'BGP':                    '⬡',
  'Anycast':                '⬡',
  'IXP':                    '⬡',
  'MITM & HSTS':            '⚠',
  'DDoS & Rate Limiting':   '⚠',
  'DNSSEC':                 '◫',
}

export function mountMenu(container, onSelect) {
  const progress = _loadProgress()

  container.innerHTML = `
    <h1 class="menu-title">YOU ARE THE PACKET.</h1>
    <p class="menu-sub">Navigate the network. Deliver the message.</p>
    <div id="acts-wrap"></div>
    <p class="menu-footer">Use arrow keys to navigate your packet</p>
  `

  const wrap = container.querySelector('#acts-wrap')

  ACTS.forEach((act, actIdx) => {
    const isRtl = actIdx % 2 === 1

    const band = document.createElement('div')
    band.className = `zone-band${isRtl ? ' rtl' : ''}`
    band.style.cssText = `--zc: ${act.color}; background-color: ${act.color}0d;`

    const label = document.createElement('div')
    label.className = 'zone-label'
    label.textContent = act.name

    const row = document.createElement('div')
    row.className = `map-row${isRtl ? ' rtl' : ''}`

    act.levels.forEach((lvl, i) => {
      const done     = !!progress[lvl.id]
      const unlocked = lvl.id === 1 || !!progress[lvl.id - 1]
      const state    = done ? 'done' : unlocked ? 'unlocked' : 'locked'
      const icon     = CONCEPT_ICONS[lvl.concept] || '⬡'

      const btn = document.createElement('button')
      btn.className = `map-stop ${state}`
      btn.disabled  = !unlocked
      btn.setAttribute('aria-label', `Level ${lvl.id}: ${lvl.title}`)
      btn.innerHTML = `
        <span class="stop-num">${String(lvl.id).padStart(2, '0')}</span>
        <span class="stop-icon">${icon}</span>
        ${done ? '<span class="stop-check">&#x2713;</span>' : ''}
        <span class="stop-label">${lvl.title}</span>
      `
      if (unlocked) btn.addEventListener('click', () => onSelect(lvl.id))
      row.appendChild(btn)

      if (i < act.levels.length - 1) {
        const nextLvl      = act.levels[i + 1]
        const nextUnlocked = nextLvl.id === 1 || !!progress[nextLvl.id - 1]
        const seg = document.createElement('div')
        seg.className = `path-seg${nextUnlocked ? ' lit' : ''}`
        row.appendChild(seg)
      }
    })

    band.appendChild(label)
    band.appendChild(row)
    wrap.appendChild(band)

    if (actIdx < ACTS.length - 1) {
      const conn = document.createElement('div')
      conn.className = 'zone-connector'
      conn.textContent = '- - -'
      wrap.appendChild(conn)
    }
  })
}

export function unmountMenu(container) {
  container.innerHTML = ''
}

function _loadProgress() {
  try { return JSON.parse(localStorage.getItem('yatp_progress') || '{}') }
  catch { return {} }
}
