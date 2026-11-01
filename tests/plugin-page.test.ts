// @vitest-environment jsdom
/**
 * The plugin manager is the third main panel. It uses the same floating card
 * recipe as the scheduled tasks page: the page root is the card. Its module
 * class is build-hashed, so the only stable hook is `data-plugin-panel` on
 * the root section — pin that seam and the card geometry here.
 *
 * Unlike the scheduled tasks page, this page owns its scroll container
 * (there is no inner pane), so the card must keep `overflow: auto`; hiding
 * the root would clip everything below the fold. The stable gutter keeps the
 * 960px content column from shifting when the installed list grows.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const aquaCss = readFileSync(resolve(process.cwd(), 'src/client/aqua.module.css'), 'utf8')

/** Declarations of the first rule whose selector starts with `selector`. */
function declarationsOf(selector: string): string {
  const start = aquaCss.indexOf(selector)
  if (start < 0) throw new Error(`missing rule: ${selector}`)
  const open = aquaCss.indexOf('{', start)
  const close = aquaCss.indexOf('}', open)
  return aquaCss.slice(open + 1, close)
}

function mount(): HTMLElement {
  document.documentElement.setAttribute('data-dsh-aqua', '')
  document.documentElement.setAttribute('data-dsh-float', '')
  document.head.innerHTML = `
    <style>section[data-plugin-panel] { border: 0; border-radius: 0; margin: 0; }</style>
    <style>${aquaCss}</style>`
  document.body.innerHTML = `
    <div data-dsh-frame>
      <div class="host_centerCol">
        <section data-plugin-panel>
          <header data-window-drag><h1>Plugins</h1></header>
        </section>
      </div>
    </div>`
  return document.querySelector('section[data-plugin-panel]')!
}

afterEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('data-dsh-aqua')
  document.documentElement.removeAttribute('data-dsh-float')
  document.body.removeAttribute('data-ds-dark-theme')
})

describe('plugin manager page card', () => {
  it('targets the stable data-plugin-panel seam, not a hashed class', () => {
    const rule = declarationsOf('[data-dsh-float] section[data-plugin-panel] {')
    expect(rule).toMatch(/border-radius:\s*20px/)
    expect(rule).toMatch(/background:\s*var\(--dsh-aqua-glass-card-light\)/)
    expect(rule).toMatch(/backdrop-filter:\s*blur\(/)
  })

  it('floats with the scheduled tasks geometry', () => {
    const style = getComputedStyle(mount())
    expect(style.marginTop).toBe('8px')
    expect(style.marginRight).toBe('16px')
    expect(style.marginBottom).toBe('12px')
    expect(style.borderTopWidth).toBe('1px')
    expect(style.borderTopColor).toBe('rgba(19, 45, 83, 0.26)')
    expect(style.borderRadius).toBe('20px')
    expect(style.boxShadow).toContain('0 10px 34px')
  })

  it('keeps the page scroll container and reserves its gutter', () => {
    const style = getComputedStyle(mount())
    expect(style.overflow).toBe('auto')
    expect(style.scrollbarGutter).toBe('stable')
  })

  it('flattens the page title header onto the card', () => {
    const page = mount()
    const header = page.querySelector('header')!
    const style = getComputedStyle(header)
    expect(style.marginTop).toBe('0px')
    expect(style.borderTopWidth).toBe('0px')
    expect(style.borderRadius).not.toBe('20px')
    expect(style.boxShadow).toBe('none')

    const rule = declarationsOf('[data-dsh-float] section[data-plugin-panel] > header {')
    expect(rule).toMatch(/background:\s*transparent/)
    expect(rule).toMatch(/backdrop-filter:\s*none/)
    expect(rule).toMatch(/padding:\s*calc\(28px \+ var\(--dsh-frame-top-clearance/)
  })

  it('switches the card to the dark glass fill', () => {
    const page = mount()
    document.body.setAttribute('data-ds-dark-theme', '')
    const style = getComputedStyle(page)
    expect(style.borderTopColor).toBe('rgba(148, 180, 220, 0.32)')
    expect(declarationsOf('[data-dsh-float] body[data-ds-dark-theme] section[data-plugin-panel] {'))
      .toMatch(/background:\s*var\(--dsh-aqua-glass-card-dark\)/)
  })

  it('leaves the stock page alone when the theme is off', () => {
    const page = mount()
    document.documentElement.removeAttribute('data-dsh-aqua')
    document.documentElement.removeAttribute('data-dsh-float')
    const style = getComputedStyle(page)
    expect(style.borderTopWidth).toBe('0px')
    expect(style.borderRadius).not.toBe('20px')
    expect(style.marginTop).toBe('0px')
  })
})
