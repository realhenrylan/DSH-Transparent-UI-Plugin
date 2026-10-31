// @vitest-environment jsdom
/**
 * The Windows desktop collapses the sidebar to a 0px grid track and parks its
 * two chrome controls in the titlebar band: the collapse/expand toggle is
 * `position: fixed; left: 12px` and the new-session button `left: 48px`.
 *
 * `backdrop-filter` on the sidebar column makes it the containing block of
 * those fixed buttons, so they were re-anchored inside the glass card and —
 * once the column shrank to 0px under `overflow: hidden` — clipped out of
 * sight entirely (the toggle vanished). A transform does the same thing, which
 * is why the hover tilt skips the column.
 *
 * These assertions pin both halves of the fix: the glass moved to ::before and
 * the rail treatment stops applying once the Windows titlebar is present.
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

function mount({ windows, collapsed }: { windows: boolean, collapsed: boolean }): HTMLElement {
  document.documentElement.setAttribute('data-dsh-aqua', '')
  document.documentElement.setAttribute('data-dsh-float', '')
  document.documentElement.toggleAttribute('data-windows-titlebar', windows)
  document.head.innerHTML = `<style>${aquaCss}</style>`
  document.body.innerHTML = `
    <div data-dsh-frame data-sidebar-collapsed>
      <div class="host_sidebarCol">
        <div class="host_root">
          <div class="host_logoRow"><button class="host_toggle">t</button></div>
        </div>
      </div>
      <div class="host_centerCol"><div data-phase="active"><header>Header</header></div></div>
    </div>`
  const frame = document.querySelector('[data-dsh-frame]')!
  if (!collapsed) frame.removeAttribute('data-sidebar-collapsed')
  return document.querySelector('.host_sidebarCol') as HTMLElement
}

afterEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  for (const attribute of ['data-dsh-aqua', 'data-dsh-float', 'data-windows-titlebar', 'data-ds-dark-theme', 'data-platform']) {
    document.documentElement.removeAttribute(attribute)
  }
  document.body.removeAttribute('data-ds-dark-theme')
})

describe('sidebar glass sits on ::before', () => {
  it('keeps backdrop-filter off the column itself', () => {
    const column = declarationsOf("[data-dsh-float] [class*='sidebarCol'] {")
    expect(column).toMatch(/backdrop-filter:\s*none/)
    expect(column).not.toMatch(/backdrop-filter:\s*blur/)
    expect(column).toMatch(/background:\s*transparent/)
  })

  it('carries the frosted fill on the pseudo-element', () => {
    expect(declarationsOf("[data-dsh-float] [class*='sidebarCol']::before {"))
      .toMatch(/backdrop-filter:\s*blur\(/)
    expect(declarationsOf("[data-dsh-float] body[data-ds-dark-theme] [class*='sidebarCol']::before {"))
      .toMatch(/backdrop-filter:\s*blur\(/)
  })
})

describe('collapsed sidebar geometry', () => {
  it('drops the floating card on the Windows desktop (0px track, no rail)', () => {
    const column = mount({ windows: true, collapsed: true })
    const style = getComputedStyle(column)
    expect(style.marginTop).toBe('0px')
    expect(style.marginLeft).toBe('0px')
    expect(style.borderTopWidth).toBe('0px')
    expect(style.boxShadow).toBe('none')
  })

  it('keeps the floating card while the Windows sidebar is expanded', () => {
    const column = mount({ windows: true, collapsed: false })
    const style = getComputedStyle(column)
    expect(style.marginTop).toBe('12px')
    expect(style.marginLeft).toBe('12px')
    expect(style.borderTopWidth).toBe('1px')
  })

  it('keeps the floating rail on the web build', () => {
    const column = mount({ windows: false, collapsed: true })
    const style = getComputedStyle(column)
    expect(style.marginTop).toBe('12px')
    expect(style.marginLeft).toBe('12px')
    expect(style.marginRight).toBe('-12px')
  })

  it('leaves the header inset alone on Windows (no rail to clear)', () => {
    mount({ windows: true, collapsed: true })
    expect(getComputedStyle(document.querySelector('header')!).marginLeft).toBe('16px')
  })

  it('steps the header clear of the web rail', () => {
    mount({ windows: false, collapsed: true })
    expect(getComputedStyle(document.querySelector('header')!).marginLeft).toBe('28px')
  })
})
