const LEVELS = [
  { id: 1,  title: 'First Hop',                concept: 'Basic Routing'    },
  { id: 2,  title: 'Chain Reaction',           concept: 'Multiple Hops'    },
  { id: 3,  title: 'The Subnet Maze',          concept: 'Subnets & CIDR'   },
  { id: 4,  title: 'Port of Entry',            concept: 'Ports & Firewalls'},
  { id: 5,  title: "What's the Address?",      concept: 'DNS'              },
  { id: 6,  title: 'Shake on It',              concept: 'TCP Handshake'    },
  { id: 7,  title: 'Lost in Transit',          concept: 'Packet Loss'      },
  { id: 8,  title: 'The Disguise',             concept: 'NAT'              },
  { id: 9,  title: 'Getting on the Network',   concept: 'DHCP'             },
  { id: 10, title: 'The Divided Campus',       concept: 'VLANs'            },
  { id: 11, title: 'The Traffic Distributor',  concept: 'Load Balancing'   },
  { id: 12, title: 'The Encrypted Channel',    concept: 'TLS'              },
]

export function mountMenu(container, onSelect) {
  const progress = _loadProgress()

  container.innerHTML = `
    <h1 class="menu-title">YOU ARE THE PACKET.</h1>
    <p class="menu-sub">Navigate the network. Deliver the message.</p>
    <div class="level-grid" id="level-grid"></div>
    <p class="menu-footer">Use arrow keys to navigate your packet</p>
  `

  const grid = container.querySelector('#level-grid')

  LEVELS.forEach((lvl, i) => {
    // level i+1 is unlocked if it's the first level, or if level i was completed
    const unlocked = i === 0 || !!progress[i]
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
}

export function unmountMenu(container) {
  container.innerHTML = ''
}

function _loadProgress() {
  try { return JSON.parse(localStorage.getItem('yatp_progress') || '{}') }
  catch { return {} }
}
