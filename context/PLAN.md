# Implementation Plan: You Are the Packet

## Context

An educational browser game where the player IS a data packet navigating a network grid. Built for curious adults with zero networking background who are pursuing a tech career. The game teaches internet/networking fundamentals through play - no scoring, discrete levels, readable technical text in the world. freeCodeCamp project using Command-line Chic dark aesthetic. Use the skill `command-line-chic` present in global skills only for ui.

---

## Tech Stack

- **Phaser 3.80+** - game renderer and input
- **Vite 5.x** - build tool (zero-config, fast HMR, static output)
- **Vanilla JS** - no framework overhead
- **No backend** - fully client-side, deploys as static files

```json
{
  "dependencies": { "phaser": "^3.80.1" },
  "devDependencies": { "vite": "^5.2.0" }
}
```

```js
// vite.config.js
export default { base: './', build: { outDir: 'dist', assetsInlineLimit: 0 } }
```

---

## Project Structure

```
you-are-the-packet/
  index.html
  vite.config.js
  package.json
  src/
    main.js                    # Vite entry, Phaser game config
    constants.js               # Color tokens, tile size, speeds
    scenes/
      BootScene.js             # Asset preloading
      MenuScene.js             # Title + level select
      GameScene.js             # Primary gameplay
      PauseScene.js            # Pause overlay
      TransitionScene.js       # Between-level recap
    entities/
      Packet.js                # Player - movement, state, tags
      Router.js                # Router node - holds routing table
      Firewall.js              # Firewall gate
      DNSResolver.js           # DNS node
      Link.js                  # Edge between nodes, drop rate
      Checkpoint.js            # Checkpoint marker
      TermLabel.js             # In-world text labels
    systems/
      RoutingEngine.js         # Validates path choices vs routing tables
      FirewallChecker.js       # Checks port/flags vs firewall rules
      DNSLookup.js             # Domain-to-IP resolution
      TCPStateMachine.js       # SYN/SYN-ACK/ACK state tracking
      NATTranslator.js         # Rewrites src IP at gateway
      TermTracker.js           # Tracks which terms introduced
      LevelLoader.js           # Parses JSON levels into Phaser objects
      CheckpointSystem.js      # Saves/restores respawn state
    ui/
      HUD.js                   # Minimal overlay: IP, destination, port tag
      TermCallout.js           # First-encounter term introduction callout
      RuleHighlight.js         # Highlights blocking rule on failure
    levels/
      level-01.json through level-08.json
    assets/
      sprites/   (packet, router, firewall, dns-resolver, gateway, checkpoint)
      tiles/     (bg tile, link sprites, broken link)
      audio/     (hop, blocked, success, syn, syn-ack, ack)
```

---

## Color Constants (`src/constants.js`)

```js
export const COLORS = {
  BG_DEEP:        0x0a0a23,
  BG_SURFACE:     0x1b1b32,
  BG_EDITOR:      0x2a2a40,
  BORDER:         0x3b3b4f,
  TEXT_MUTED:     0x858591,
  TEXT_DIM:       0xd0d0d5,
  TEXT_MAIN:      0xf5f6f7,
  TEXT_BRIGHT:    0xffffff,
  ACCENT_PURPLE:  0xdbb8ff,
  ACCENT_YELLOW:  0xf1be32,
  ACCENT_BLUE:    0x99c9ff,
  ACCENT_GREEN:   0xacd157,
  ACCENT_RED:     0xffadad,
}
```

---

## Core Systems

### Packet Entity (`entities/Packet.js`)

State tracked per packet:
- `srcIP` - current source IP (changes at NAT)
- `destIP` - destination IP
- `portTag` - port number carried (level 4+)
- `tcpState` - `null | 'SYN_SENT' | 'SYN_ACK_RECEIVED' | 'ESTABLISHED'`
- `domainName` - for DNS level only
- `position` - current grid tile `{col, row}`
- `checkpointPosition` - last saved checkpoint

Movement is **discrete**: arrow key -> animate one tile-step to adjacent node. No physics. `GameScene` dispatches move intent to `Packet.js`; `RoutingEngine` validates before committing.

### Routing Engine (`systems/RoutingEngine.js`)

```js
validateMove(packet, fromNode, toNode, routingTable)
  -> { valid: boolean, matchedRoute: Route | null }
```

Uses longest-prefix match. If invalid, returns the route that *should* have been taken - used by `RuleHighlight` to highlight the correct entry.

```js
function ipInCIDR(ip, cidr) {
  const [network, bits] = cidr.split('/')
  const mask = ~((1 << (32 - parseInt(bits))) - 1)
  return (ipToInt(ip) & mask) === (ipToInt(network) & mask)
}
```

### Firewall Checker (`systems/FirewallChecker.js`)

```js
checkFirewall(packet, firewallNode)
  -> { allowed: boolean, blockingRule: FirewallRule | null }
```

Rules evaluated in order (first match wins). Default: deny.

### Checkpoint System (`systems/CheckpointSystem.js`)

- On entering a checkpoint node: save `position`, `tcpState`, `srcIP`, `portTag`
- On failure: restore saved state, re-place sprite, call `RuleHighlight.show()` for 3 seconds
- No penalty shown, no lives, no score

### TCP State Machine (`systems/TCPStateMachine.js`)

States: `IDLE -> SYN_SENT -> SYN_ACK_RECEIVED -> ESTABLISHED`

Destination door only opens when `ESTABLISHED`. Out-of-order transitions are rejected with a "waiting for previous step" message.

### NAT Translator (`systems/NATTranslator.js`)

On crossing a `nat-gateway` node: save private IP, set `srcIP` to gateway's `publicIP`. Floating animation shows `192.168.1.5 -> 203.0.113.1`. HUD updates.

### Term Tracker (`systems/TermTracker.js`)

Maintains a `Set` of seen terms. `introduce(termKey)` queues a `TermCallout` if unseen, then marks seen. Stored per session.

---

## Level Data Schema

```json
{
  "id": 1,
  "title": "First Hop",
  "concept": "basic-routing",
  "gridWidth": 10,
  "gridHeight": 8,
  "tileSize": 64,
  "player": {
    "startNode": "node-spawn",
    "srcIP": "192.168.1.5",
    "destIP": "192.168.1.20",
    "portTag": null,
    "domainName": null
  },
  "destination": { "nodeId": "node-dest", "label": "192.168.1.20" },
  "nodes": [
    { "id": "node-spawn", "type": "spawn", "col": 1, "row": 4 },
    {
      "id": "node-router-a", "type": "router", "col": 4, "row": 4,
      "label": "R1", "checkpoint": true,
      "routingTable": [
        { "prefix": "192.168.1.0/24", "nextHop": "node-exit-a", "interface": "eth0" },
        { "prefix": "10.0.0.0/8",     "nextHop": "node-exit-b", "interface": "eth1" }
      ]
    },
    { "id": "node-exit-a", "type": "exit", "col": 7, "row": 2, "label": "192.168.1.0/24" },
    { "id": "node-exit-b", "type": "exit", "col": 7, "row": 6, "label": "10.0.0.0/8" },
    { "id": "node-dest",   "type": "destination", "col": 9, "row": 2 }
  ],
  "edges": [
    { "from": "node-spawn",    "to": "node-router-a", "directed": false, "dropRate": 0 },
    { "from": "node-router-a", "to": "node-exit-a",   "directed": false, "dropRate": 0 },
    { "from": "node-router-a", "to": "node-exit-b",   "directed": false, "dropRate": 0 },
    { "from": "node-exit-a",   "to": "node-dest",     "directed": false, "dropRate": 0 }
  ],
  "firewallRules": [],
  "labels": [
    { "id": "label-my-ip", "text": "You: 192.168.1.5", "attachToNode": "node-spawn", "offsetY": -24, "style": "ip-label" }
  ],
  "termIntroductions": [
    {
      "termKey": "routing-table",
      "triggerNode": "node-router-a",
      "headline": "Routing Table",
      "body": "A list of rules telling this router where to send packets. Match your destination to the right exit.",
      "highlightNodeId": "node-router-a"
    }
  ],
  "checkpointBehavior": "last-router",
  "completionCondition": "reach-destination"
}
```

**Node types:** `spawn`, `router`, `firewall`, `dns-resolver`, `nat-gateway`, `tcp-node`, `exit`, `destination`

**Label styles:** `ip-label`, `cidr-label`, `port-label`, `routing-entry`, `rule-text`

---

## In-World UI vs HUD

**HUD** (38px top bar, `BG_SURFACE` bg, monospace font):
- Current source IP
- Destination IP
- Port tag badge (when carrying one)
- Level name/concept

**In-world labels** (Phaser `Container`: `Graphics` bg + `Text` children, not DOM):
- Routing tables appear as sign panels next to routers
- CIDR labels float above exit nodes
- Port numbers on firewall door signs
- IP addresses label every addressed node

Routing table sign format:
```
+--------------------+
| ROUTING TABLE      |
| 192.168.1.0/24 eth0|
| 10.0.0.0/8     eth1|
+--------------------+
```

On failure, `RuleHighlight` tints the matching row `ACCENT_YELLOW` for 3 seconds.

---

## Term Introduction System (`ui/TermCallout.js`)

- Anchored callout box near the relevant node (not full-screen overlay)
- `BG_EDITOR` bg, `ACCENT_PURPLE` border, `TEXT_MAIN` headline, `TEXT_DIM` body
- Arrow pointer to highlighted node
- Game does NOT pause - input blocked (`Packet.inputLocked = true`), world stays live
- Dismiss: click anywhere, space/enter, or auto after 6 seconds
- Position logic: appears left of node if node is in right half of screen, above if in bottom third

---

## Level-by-Level Design

The curriculum follows the **packet life cycle** in four acts, with a **Spiral Principle**: every level past L3 reuses at least one prior mechanic as a warm-up before introducing its new one. Levels also carry a `theory.buildsOn` array and a one-paragraph `theory.recap` so the player sees prior concepts before the new one is taught.

### Act I - Streets and Addresses (pure routing)
| # | Concept | Key mechanic | New terms |
|---|---------|-------------|-----------|
| 1 | Basic routing | 1 router, 2 exits, pick matching subnet | IP address, routing table |
| 2 | Multiple hops | Router chain, read each table | TTL, hop |
| 3 | Longest prefix | Three overlapping prefixes at one router | CIDR, longest-prefix match |

### Act II - Who Am I, Where Am I Going? (identity)
| # | Concept | Key mechanic | New terms |
|---|---------|-------------|-----------|
| 4 | DHCP | Null srcIP, DHCP node assigns, then route through 2-router LPM chain | DHCP, scope, lease |
| 5 | DNS | Null destIP, domain name, DNS resolves, then route through LPM table | domain name, DNS, A record |
| 6 | NAT | Private srcIP + domain destIP: DNS resolves, then NAT rewrites src | private IP, NAT, public IP |

### Act III - The Hostile Internet (obstacles)
| # | Concept | Key mechanic | New terms |
|---|---------|-------------|-----------|
| 7 | Firewalls | Router LPM warm-up, then firewall fork on port | port, firewall, HTTP |
| 8 | Packet loss | Router + 3-way fork (firewall-denied, drop-1, stable) | packet loss, redundancy |
| 9 | VLANs | L3 switch with overlapping prefixes bridges segments | VLAN, isolation, inter-VLAN routing |

### Act IV - Trust and Transit (negotiation)
| # | Concept | Key mechanic | New terms |
|---|---------|-------------|-----------|
| 10 | Load balancing | Router + port-80 firewall + LB with 2 healthy + 1 failed backend | load balancer, distribution, health check |
| 11 | TCP handshake | Router + firewall warm-up, then SYN/SYN-ACK/ACK | TCP, SYN, ESTABLISHED |
| 12 | TLS | Router + firewall, full TCP handshake, then TLS with valid/expired/wrong-domain cert branches | TLS, ClientHello, certificate, expired cert, wrong-domain cert |

**Level 1 first playable moment:** Spawn as `192.168.1.5`. One router, two exits labeled `192.168.1.0/24` and `10.0.0.0/8`. Destination `192.168.1.20`. No tutorial - just try.

### Spiral Principle (enforced by content, not engine)
Every level from L4 onward must satisfy all of:
1. A router with a non-trivial (2+ row) routing table appears on the correctPath, in front of the new mechanic's node (exception: L4 places routers after DHCP).
2. At least one prior-act mechanic appears as a gate on the correctPath before the new mechanic.
3. The theory block opens with a `recap` paragraph that explicitly names what the player will redo from prior levels.
4. `correctPath.length >= 6`.
5. The new mechanic is never the only decision point on the correctPath.

---

## Implementation Phases

### Phase 0 - Scaffold (Days 1-2)
1. `npm create vite@latest you-are-the-packet -- --template vanilla && npm install phaser`
2. Create folder structure
3. `main.js`: Phaser config, scene chain `Boot -> Menu -> Game`
4. `constants.js`: all color tokens
5. `BootScene.js`: load assets, set `BG_DEEP` background
6. Verify: blank dark canvas loads

### Phase 1 - Core Engine + Level 1 (Days 3-7)
1. `LevelLoader.js`: parse `level-01.json`, instantiate nodes/edges
2. `Router.js`, `Link.js`, `TermLabel.js`: basic render
3. `Packet.js`: spawn, discrete grid movement
4. `RoutingEngine.js`: `validateMove` with CIDR prefix matching
5. `CheckpointSystem.js`: save/restore
6. `RuleHighlight.js`: 3-second yellow highlight on block
7. `TermTracker.js` + `TermCallout.js`: first-encounter callout
8. `HUD.js`: minimal top bar
9. Level 1 complete -> `TransitionScene`

### Phase 2 - Levels 2-4 (Days 8-14)
1. Level 2: multi-router chains, multiple checkpoints
2. Level 3: `Graphics` subnet zone backgrounds, longest-prefix edge cases
3. Level 4: `Firewall.js`, `FirewallChecker.js`, port tag on sprite + HUD, door flash animation

### Phase 3 - Levels 5-6 (Days 15-20)
1. `DNSResolver.js` + `DNSLookup.js`, locked destination mechanic
2. `TCPStateMachine.js`, TCP node type, handshake door animation
3. Audio: all sound cues

### Phase 4 - Levels 7-8 (Days 21-26)
1. `Link.js` probabilistic drop, visual flicker on unstable links
2. Level 7: redundant paths, test all stable routes reachable
3. `NATTranslator.js`, IP rewrite animation, HUD update
4. Level 8: visual zone split (private/public), translation table sign

### Phase 5 - Polish (Days 27-32)
1. `MenuScene.js`: level select with concept labels, `localStorage` progress lock
2. `TransitionScene.js`: between-level concept recap card
3. Phaser `ScaleManager`: `FIT` at `1280x720` base
4. Keyboard accessibility: all navigation arrow-key operable
5. `PauseScene.js`: resume/restart/menu
6. Cross-browser test: Chrome, Firefox, Safari

---

## Verification

### Unit tests (no Phaser needed - pure functions)

```
src/systems/__tests__/
  routing-engine.test.js      # CIDR match, longest-prefix, default route
  firewall-checker.test.js    # First-match-wins, default deny
  tcp-state-machine.test.js   # Out-of-order rejection
  nat-translator.test.js      # Private->public rewrite
  ip-utils.test.js
```

Run with: `node --test` (no Jest needed)

### Level JSON validation script

For each `level-NN.json`:
- All `routingTable` node IDs exist in `nodes`
- All edge node IDs exist in `nodes`
- A valid path from spawn to destination exists in the graph
- All `termIntroductions` reference existing node IDs

### Manual playtest checklist (per level)

- [ ] Correct path reaches destination
- [ ] All wrong paths produce a respawn (no hang/crash)
- [ ] Blocking rule highlights on each wrong choice
- [ ] Each term callout appears exactly once per session
- [ ] HUD reflects correct packet state throughout
- [ ] Level completes and transitions correctly
- [ ] Reload starts fresh (no broken localStorage state)

---

## Critical Files (implementation entry order)

1. `src/main.js` - game config and scene registration
2. `src/constants.js` - color tokens and grid constants
3. `src/systems/LevelLoader.js` - factory everything depends on
4. `src/entities/Packet.js` - movement and state
5. `src/systems/RoutingEngine.js` - core decision logic (load-bearing)
6. `src/levels/level-01.json` - first playable level
7. `src/scenes/GameScene.js` - wires all systems together
