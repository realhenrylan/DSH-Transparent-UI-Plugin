import { readFileSync } from 'node:fs'
import { basename, dirname, relative, resolve } from 'node:path'
import { transform } from 'lightningcss'
import { defineConfig } from 'tsdown'
import manifest from './package.json' with { type: 'json' }

const cssPrefix = '\0aqua-css:'

// DSH's browser loader expects a factory and owns styles tagged with the
// package ID. Compile CSS modules into that factory so uninstall can clean up.
const cssModules = {
  name: 'aqua-css-modules',
  resolveId(source: string, importer?: string) {
    if (!source.endsWith('.module.css') || importer === undefined) return null
    return `${cssPrefix}${resolve(dirname(importer), source)}.mjs`
  },
  load(id: string) {
    if (!id.startsWith(cssPrefix)) return null
    const filename = id.slice(cssPrefix.length, -4)
    const result = transform({
      filename: relative(process.cwd(), filename),
      code: readFileSync(filename),
      cssModules: { pattern: '[hash]_[local]' },
      minify: true,
    })
    const classes = Object.fromEntries(Object.entries(result.exports ?? {})
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, value]) => [key, value.name]))
    const tagId = `${manifest.name}/${basename(filename)}`
    return `const tagId = ${JSON.stringify(tagId)};
if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {
  const tag = document.createElement('style');
  tag.dataset.plugin = ${JSON.stringify(manifest.name)};
  tag.dataset.pluginCss = tagId;
  tag.textContent = ${JSON.stringify(result.code.toString())};
  document.head.appendChild(tag);
}
export default ${JSON.stringify(classes)};`
  },
}

export default defineConfig([
  {
    entry: { index: 'src/index.ts', invariant: 'src/invariant.ts' },
    outDir: 'lib', format: 'esm', platform: 'node', clean: false, fixedExtension: false, dts: false,
  },
  {
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib', format: 'cjs', platform: 'browser', clean: false, fixedExtension: false,
    dts: false, minify: true,
    deps: { neverBundle: ['react', 'react/jsx-runtime', '@deepseek-ai/dsh-client-store'] },
    plugins: [cssModules],
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(manifest.name)}, factory: (require) => {`,
      intro: 'var module = { exports: {} }; var exports = module.exports;',
      footer: 'return module.exports; } });',
    },
  },
])
