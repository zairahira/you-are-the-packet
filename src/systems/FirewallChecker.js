export default class FirewallChecker {
  check(packet, firewallNode) {
    const rules = firewallNode.firewallRules || []

    for (const rule of rules) {
      const portMatch = rule.port === '*' || rule.port === packet.portTag
      const protoMatch = !rule.protocol || rule.protocol === packet.protocol || rule.protocol === '*'

      if (portMatch && protoMatch) {
        return {
          allowed: rule.action === 'allow',
          blockingRule: rule.action === 'deny' ? rule : null,
        }
      }
    }

    // Default deny
    return { allowed: false, blockingRule: { port: packet.portTag, action: 'deny', reason: 'No matching rule (default deny)' } }
  }
}
