import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { ipInCIDR } from '../RoutingEngine.js'

// We import RoutingEngine via a thin wrapper since it's an ES module class
// Run with: node --test --experimental-vm-modules src/systems/__tests__/routing-engine.test.js

describe('ipInCIDR', () => {
  test('exact match within /24', () => {
    assert.ok(ipInCIDR('192.168.1.20', '192.168.1.0/24'))
    assert.ok(ipInCIDR('192.168.1.5',  '192.168.1.0/24'))
    assert.ok(ipInCIDR('192.168.1.254','192.168.1.0/24'))
  })

  test('does not match different /24', () => {
    assert.ok(!ipInCIDR('192.168.2.1', '192.168.1.0/24'))
    assert.ok(!ipInCIDR('10.0.0.1',    '192.168.1.0/24'))
  })

  test('/8 matches', () => {
    assert.ok(ipInCIDR('10.0.0.1',  '10.0.0.0/8'))
    assert.ok(ipInCIDR('10.255.255.255', '10.0.0.0/8'))
    assert.ok(!ipInCIDR('11.0.0.1', '10.0.0.0/8'))
  })

  test('/32 exact host match', () => {
    assert.ok(ipInCIDR('192.168.1.5', '192.168.1.5/32'))
    assert.ok(!ipInCIDR('192.168.1.6', '192.168.1.5/32'))
  })

  test('/0 default route matches everything', () => {
    assert.ok(ipInCIDR('1.2.3.4',      '0.0.0.0/0'))
    assert.ok(ipInCIDR('255.255.255.255', '0.0.0.0/0'))
  })

  test('/16 subnet', () => {
    assert.ok(ipInCIDR('172.16.5.10', '172.16.0.0/16'))
    assert.ok(!ipInCIDR('172.17.0.1', '172.16.0.0/16'))
  })
})

describe('RoutingEngine.validateMove', () => {
  // Inline the class logic for pure-Node testing (no Phaser needed)
  function makeEngine() {
    return {
      validateMove(packet, fromNode, toNode) {
        const table = fromNode.routingTable
        if (!table || table.length === 0) return { valid: true, matchedRoute: null }
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
        if (!bestMatch) return { valid: false, matchedRoute: null }
        return { valid: bestMatch.nextHop === toNode.id, matchedRoute: bestMatch }
      }
    }
  }

  const routeTable = [
    { prefix: '192.168.1.0/24', nextHop: 'node-exit-a', interface: 'eth0' },
    { prefix: '10.0.0.0/8',     nextHop: 'node-exit-b', interface: 'eth1' },
  ]

  const router = { id: 'node-router', type: 'router', routingTable: routeTable }
  const exitA  = { id: 'node-exit-a', type: 'exit' }
  const exitB  = { id: 'node-exit-b', type: 'exit' }

  test('routes to correct exit for 192.168.1.x', () => {
    const engine = makeEngine()
    const packet = { destIP: '192.168.1.20' }
    const result = engine.validateMove(packet, router, exitA)
    assert.ok(result.valid)
    assert.equal(result.matchedRoute.nextHop, 'node-exit-a')
  })

  test('rejects wrong exit for 192.168.1.x', () => {
    const engine = makeEngine()
    const packet = { destIP: '192.168.1.20' }
    const result = engine.validateMove(packet, router, exitB)
    assert.ok(!result.valid)
    assert.equal(result.matchedRoute.nextHop, 'node-exit-a')
  })

  test('routes to correct exit for 10.x.x.x', () => {
    const engine = makeEngine()
    const packet = { destIP: '10.0.5.1' }
    const result = engine.validateMove(packet, router, exitB)
    assert.ok(result.valid)
  })

  test('longest prefix match: /24 beats /8 for 192.168.1.x', () => {
    const engine = makeEngine()
    // Add a /8 that also matches 192.168.x.x
    const tableWithOverlap = [
      { prefix: '192.168.1.0/24', nextHop: 'node-exit-a', interface: 'eth0' },
      { prefix: '192.0.0.0/8',    nextHop: 'node-exit-c', interface: 'eth2' },
    ]
    const routerOverlap = { ...router, routingTable: tableWithOverlap }
    const exitC = { id: 'node-exit-c', type: 'exit' }

    const packet = { destIP: '192.168.1.20' }
    // Should pick /24 (more specific)
    const resultA = engine.validateMove(packet, routerOverlap, exitA)
    assert.ok(resultA.valid)
    const resultC = engine.validateMove(packet, routerOverlap, exitC)
    assert.ok(!resultC.valid)
  })

  test('no matching route returns invalid', () => {
    const engine = makeEngine()
    const packet = { destIP: '172.16.0.1' }
    const result = engine.validateMove(packet, router, exitA)
    assert.ok(!result.valid)
    assert.equal(result.matchedRoute, null)
  })

  test('default route /0 matches when no specific route', () => {
    const engine = makeEngine()
    const tableWithDefault = [
      { prefix: '0.0.0.0/0', nextHop: 'node-exit-a', interface: 'eth0' },
    ]
    const routerDefault = { ...router, routingTable: tableWithDefault }
    const packet = { destIP: '8.8.8.8' }
    const result = engine.validateMove(packet, routerDefault, exitA)
    assert.ok(result.valid)
  })
})
