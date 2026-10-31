// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const aquaCss = readFileSync(resolve(process.cwd(), 'src/client/aqua.module.css'), 'utf8')

function desktopColumn(platform: 'windows' | 'mac', enabled: boolean): HTMLElement {
  document.documentElement.toggleAttribute('data-dsh-aqua', enabled)
  document.documentElement.toggleAttribute('data-windows-titlebar', platform === 'windows')
  if (platform === 'mac') document.documentElement.setAttribute('data-platform', 'darwin')
  else document.documentElement.removeAttribute('data-platform')
  document.head.innerHTML = `<style>
    [data-windows-titlebar] .host_centerCol,
    [data-platform=darwin] .host_centerCol { background: rgb(12, 18, 27); }
  </style><style>${aquaCss}</style>`
  document.body.innerHTML = '<div data-dsh-frame><div class="host_centerCol"><div data-phase="active">Conversation</div></div></div>'
  return document.querySelector('.host_centerCol')!
}

afterEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('data-dsh-aqua')
  document.documentElement.removeAttribute('data-windows-titlebar')
  document.documentElement.removeAttribute('data-platform')
  document.documentElement.removeAttribute('data-dsh-float')
  document.body.removeAttribute('data-ds-dark-theme')
})

describe('desktop conversation background', () => {
  it.each(['windows', 'mac'] as const)('shows the theme background in %s', platform => {
    const column = desktopColumn(platform, true)
    expect(getComputedStyle(column).backgroundColor).toBe('rgba(0, 0, 0, 0)')
  })

  it('shows the background in the dark mica layout', () => {
    const column = desktopColumn('windows', true)
    document.documentElement.setAttribute('data-dsh-float', '')
    document.body.setAttribute('data-ds-dark-theme', '')
    expect(getComputedStyle(column).backgroundColor).toBe('rgba(0, 0, 0, 0)')
  })

  it('keeps the host background when the theme is disabled', () => {
    const column = desktopColumn('windows', false)
    expect(getComputedStyle(column).backgroundColor).toBe('rgb(12, 18, 27)')
  })
})
