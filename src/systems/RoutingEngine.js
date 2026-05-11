function ipToInt(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0
}

function ipInCIDR(ip, cidr) {
  const [network, bits] = cidr.split('/')
  const prefixLen = parseInt(bits, 10)
  if (prefixLen === 0) return true
  const mask = (~((1 << (32 - prefixLen)) - 1)) >>> 0
  return (ipToInt(ip) & mask) === (ipToInt(network) & mask)
}

export default class RoutingEngine {
  validateMove(packet, fromNode, toNode) {
    const table = fromNode.routingTable
    if (!table || table.length === 0) return { valid: true, matchedRoute: null }

    // Longest prefix match
    let bestMatch = null
    let bestLen = -1

    for (const route of table) {
      const [, bits] = route.prefix.split('/')
      const prefixLen = parseInt(bits, 10)
      if (ipInCIDR(packet.destIP, route.prefix) && prefixLen > bestLen) {
        bestLen = prefixLen
        bestMatch = route
      }
    }

    if (!bestMatch) {
      // No route - shouldn't move at all
      return { valid: false, matchedRoute: null }
    }

    // Check if the chosen toNode matches the bestMatch nextHop
    const valid = bestMatch.nextHop === toNode.id
    return { valid, matchedRoute: bestMatch }
  }
}

export { ipToInt, ipInCIDR }
