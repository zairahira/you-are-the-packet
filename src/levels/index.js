import level01 from './level-01.json'
import level02 from './level-02.json'
import level03 from './level-03.json'
import level04 from './level-04.json'
import level05 from './level-05.json'
import level06 from './level-06.json'
import level07 from './level-07.json'
import level08 from './level-08.json'
import level09 from './level-09.json'
import level10 from './level-10.json'
import level11 from './level-11.json'
import level12 from './level-12.json'

// New ordering follows the real packet life cycle (Acts I-IV).
// Filenames preserve the original authoring order; the key here is the player-facing slot.
// Each JSON's internal `id` field matches its slot below.
export const LEVELS = {
  1:  level01,  // Act I  - First Hop          (routing)
  2:  level02,  // Act I  - Chain Reaction     (multi-hop)
  3:  level03,  // Act I  - The Subnet Maze    (longest-prefix)
  4:  level09,  // Act II - Getting on the Network (DHCP)
  5:  level05,  // Act II - What's the Address?    (DNS)
  6:  level08,  // Act II - The Disguise           (NAT)
  7:  level04,  // Act III - Port of Entry         (firewall)
  8:  level07,  // Act III - Lost in Transit       (drop rate)
  9:  level10,  // Act III - The Divided Campus    (VLAN)
  10: level11,  // Act IV - The Traffic Distributor (load balancing)
  11: level06,  // Act IV - Shake on It            (TCP handshake)
  12: level12,  // Act IV - The Encrypted Channel  (TLS)
}
