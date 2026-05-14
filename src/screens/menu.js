// Curriculum follows the packet life cycle, grouped into 4 acts.
// IDs match the LEVELS map in src/levels/index.js and each JSON's internal `id` field.
const ACTS = [
  {
    name: 'Act I - Streets and Addresses',
    levels: [
      { id: 1, title: 'First Hop',             concept: 'Basic Routing'      },
      { id: 2, title: 'Chain Reaction',        concept: 'Multiple Hops'      },
      { id: 3, title: 'The Subnet Maze',       concept: 'Longest Prefix'     },
    ],
  },
  {
    name: 'Act II - Who Am I, Where Am I Going?',
    levels: [
      { id: 4, title: 'Getting on the Network', concept: 'DHCP'              },
      { id: 5, title: 'Name Resolution',        concept: 'DNS'               },
      { id: 6, title: 'The Disguise',           concept: 'NAT'               },
    ],
  },
  {
    name: 'Act III - The Hostile Internet',
    levels: [
      { id: 7, title: 'Port of Entry',          concept: 'Ports & Firewalls' },
      { id: 8, title: 'Lost in Transit',        concept: 'Packet Loss'       },
      { id: 9, title: 'The Divided Campus',     concept: 'VLANs'             },
    ],
  },
  {
    name: 'Act IV - Trust and Transit',
    levels: [
      { id: 10, title: 'The Traffic Distributor', concept: 'Load Balancing'  },
      { id: 11, title: 'Shake on It',             concept: 'TCP Handshake'   },
      { id: 12, title: 'The Encrypted Channel',   concept: 'TLS'             },
    ],
  },
  {
    name: 'Act V - What You Carry',
    levels: [
      { id: 13, title: 'The Request',         concept: 'HTTP'              },
      { id: 14, title: 'Remember Me',         concept: 'Cookies & Sessions'},
      { id: 15, title: 'The Shortcut',        concept: 'CDN & Caching'     },
      { id: 16, title: 'Follow the Redirect', concept: 'HTTP Redirects'    },
    ],
  },
  {
    name: 'Act VI - The Open Internet',
    levels: [
      { id: 17, title: 'Crossing Borders', concept: 'BGP'     },
      { id: 18, title: 'Nearest Wins',     concept: 'Anycast' },
      { id: 19, title: 'The Meeting Point',concept: 'IXP'     },
    ],
  },
  {
    name: 'Act VII - Under Threat',
    levels: [
      { id: 20, title: 'The Impersonator', concept: 'MITM & HSTS'    },
      { id: 21, title: 'The Flood',        concept: 'DDoS & Rate Limiting' },
      { id: 22, title: 'Signed Ground',    concept: 'DNSSEC'          },
    ],
  },
]

export function mountMenu(container, onSelect) {
  const progress = _loadProgress()

  container.innerHTML = `
    <h1 class="menu-title">YOU ARE THE PACKET.</h1>
    <p class="menu-sub">Navigate the network. Deliver the message.</p>
    <div id="acts-wrap"></div>
    <p class="menu-footer">Use arrow keys to navigate your packet</p>
  `

  const wrap = container.querySelector('#acts-wrap')

  ACTS.forEach(act => {
    const section = document.createElement('section')
    section.className = 'act-section'
    section.innerHTML = `
      <h2 class="act-title">${act.name}</h2>
      <div class="level-grid"></div>
    `
    const grid = section.querySelector('.level-grid')

    act.levels.forEach(lvl => {
      const unlocked = lvl.id === 1 || !!progress[lvl.id - 1]
      const btn = document.createElement('button')
      btn.className = `level-card ${unlocked ? 'unlocked' : 'locked'}`
      btn.disabled  = !unlocked
      btn.innerHTML = `
        <span class="card-title">${lvl.id}. ${lvl.title}</span>
        ${!unlocked ? '<span class="card-lock">&#x1F512;</span>' : ''}
        <span class="card-concept">${lvl.concept}</span>
      `
      if (unlocked) btn.addEventListener('click', () => onSelect(lvl.id))
      grid.appendChild(btn)
    })

    wrap.appendChild(section)
  })
}

export function unmountMenu(container) {
  container.innerHTML = ''
}

function _loadProgress() {
  try { return JSON.parse(localStorage.getItem('yatp_progress') || '{}') }
  catch { return {} }
}
