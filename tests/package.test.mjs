import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import test from 'node:test'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const patch = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')

test('the package declares the tested DSH release', () => {
  assert.equal(manifest.engines?.dsh, '0.2.1-rc.5')
})

test('the GitHub package activates its own bundle on installation', () => {
  assert.equal(manifest.name, 'dsh-aqua-glass-henry')
  assert.equal(manifest.dsh?.bundle?.patch, './cordis.patch.yml')
  assert.ok(manifest.files.includes('cordis.patch.yml'))
  assert.match(patch, new RegExp(`name: ['"]?${manifest.name}['"]?`))
})

test('the client factory registers under the package identity', () => {
  const client = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  let registered
  runInNewContext(client, { window: { __ModuleLoader__: { load: entry => { registered = entry } } } })
  assert.equal(registered.id, manifest.name)
  assert.equal(typeof registered.factory, 'function')
  assert.equal(client.includes('@deepseek-ai/dsh-client-runtime/client'), false)
})
