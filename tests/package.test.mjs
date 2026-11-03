import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import test from 'node:test'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const patch = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')

// Tiny prerelease-aware SemVer comparison: handles the shapes DSH publishes
// (0.2.1-rc.5 style) without a dependency. Follows the node-semver rules that
// matter here: prerelease < release, and prerelease identifiers compare
// lexically/numerically (rc.4 < rc.5).
const compareSemver = (a, b) => {
  const parse = value => {
    const etc = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(value)
    if (!etc) throw new Error(`unsupported version shape: ${value}`)
    const [, major, minor, patch, pre] = etc
    return { core: [Number(major), Number(minor), Number(patch)], pre }
  }
  const left = parse(a)
  const right = parse(b)
  for (let i = 0; i < 3; i++) {
    if (left.core[i] !== right.core[i]) return left.core[i] < right.core[i] ? -1 : 1
  }
  if (left.pre === right.pre) return 0
  if (left.pre === undefined) return 1 // release outranks prerelease
  if (right.pre === undefined) return -1
  const ids = (left, right) => {
    const l = left.split('.')
    const r = right.split('.')
    for (let i = 0; i < Math.max(l.length, r.length); i++) {
      const lv = l[i]
      const rv = r[i]
      if (lv === undefined) return -1
      if (rv === undefined) return 1
      const ln = /^\d+$/.test(lv)
      const rn = /^\d+$/.test(rv)
      if (ln && rn) {
        if (Number(lv) !== Number(rv)) return Number(lv) < Number(rv) ? -1 : 1
      } else if (ln !== rn) {
        return ln ? -1 : 1 // numeric ids outrank alphanumeric ids
      } else if (lv !== rv) {
        return lv < rv ? -1 : 1
      }
    }
    return 0
  }
  return ids(left.pre, right.pre)
}

const range = manifest.engines?.dsh
const satisfies = version => {
  if (typeof range !== 'string') throw new Error(`engines.dsh must be a range string, got ${typeof range}`)
  const parts = range.split(/\s+/)
  for (const part of parts) {
    const match = /^(>=|<=|<|>|=)?\s*(.+)$/.exec(part)
    if (!match) throw new Error(`unsupported range fragment: ${part}`)
    const op = match[1] ?? '='
    const bound = match[2]
    const order = compareSemver(version, bound)
    const ok = op === '>=' && order >= 0
      || op === '<=' && order <= 0
      || op === '<' && order < 0
      || op === '>' && order > 0
      || op === '=' && order === 0
    if (!ok) return false
  }
  return true
}

test('the package declares a DSH engine range consistent with the install flow', () => {
  // Anchor versions: the installed-and-verified release, the first release that
  // follows it, and the boundaries just outside the range.
  assert.equal(manifest.engines?.dsh, '>=0.2.1-rc.5 <0.3.0-0')
  assert.equal(satisfies('0.2.1-rc.5'), true, 'the verified DSH release must satisfy the range')
  assert.equal(satisfies('0.2.1'), true, 'the stable release must satisfy the range')
  assert.equal(satisfies('0.2.2'), true, 'later 0.2.x releases must satisfy the range')
  assert.equal(satisfies('0.2.1-rc.4'), false, 'older prereleases must not satisfy the range')
  assert.equal(satisfies('0.2.0'), false, 'releases before the resolution fixes must not satisfy the range')
  assert.equal(satisfies('0.3.0-rc.1'), false, '0.3.0 prereleases must not satisfy the range')
  assert.equal(satisfies('0.3.0'), false, '0.3.0 stable must not satisfy the range')
})

test('the GitHub package activates its own bundle on installation', () => {
  assert.equal(manifest.name, 'dsh-driftglass')
  assert.equal(manifest.dsh?.bundle?.patch, './cordis.patch.yml')
  assert.ok(manifest.files.includes('cordis.patch.yml'))
  assert.match(patch, new RegExp(`name: ['"]?${manifest.name}['"]?`))
})

test('the inject edges match the reviewed manifest exactly', () => {
  // The edges must stay the four reviewed entries; adding an edge for a
  // non-entry package (for example @deepseek-ai/dsh-client-store, which has no
  // browser entry row) would make the graph invalid and the browser reject it.
  const edges = manifest.dsh?.client?.inject ?? []
  assert.deepEqual([...edges].sort(), [
    '@deepseek-ai/dsh-client-locale',
    '@deepseek-ai/dsh-client-ui-renderer',
    '@deepseek-ai/dsh-client-ui-settings',
    '@deepseek-ai/dsh-client-ui-theme',
  ])
})

test('the client factory registers under the package identity', () => {
  const client = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  let registered
  runInNewContext(client, { window: { __ModuleLoader__: { load: entry => { registered = entry } } } })
  assert.equal(registered.id, manifest.name)
  assert.equal(typeof registered.factory, 'function')
  assert.equal(client.includes('@deepseek-ai/dsh-client-runtime/client'), false)
})

test('the client bundle externalizes only modules the page loader provides', () => {
  // The browser lazy-CJS factory runs with a loader that resolves external
  // requires by name. Official entries rely on exactly three (react,
  // react/jsx-runtime, @deepseek-ai/dsh-client-store); anything else — for
  // example react-dom — would fail to resolve at runtime. Guard the whole
  // surface so a rebuild cannot quietly introduce a new external.
  const client = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  const found = new Set()
  const pattern = /[a-zA-Z_$][\w$]*\("(react[^"]*|@deepseek-ai\/[^"]*)"\)/g
  for (const match of client.matchAll(pattern)) found.add(match[1])
  assert.deepEqual([...found].sort(), [
    '@deepseek-ai/dsh-client-store',
    'react',
    'react/jsx-runtime',
  ])
})
