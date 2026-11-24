// @vitest-environment jsdom
/**
 * The composer hover press scales its pane by 1.01, and the composer slab is
 * as wide as the content column — its right edge paints ~5px past the
 * transcript scrollport. A transform counts toward the scrollable overflow
 * region, so the stock `overflow-y: auto` (which leaves the x axis computing
 * to auto) grew a horizontal scrollbar. The bar took ~5px off the container's
 * `clientHeight`, and since the slab is laid against its bottom edge the whole
 * transcript column jumped up 5px in a single frame.
 *
 * That is a layout change, which no CSS transition can interpolate. The
 * scrollport clips the x axis outright.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const aquaCss = readFileSync(resolve(process.cwd(), 'src/client/aqua.module.css'), 'utf8')

afterEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  for (const attribute of ['data-dsh-aqua', 'data-dsh-float']) {
    document.documentElement.removeAttribute(attribute)
  }
})

function mountScrollport(): HTMLElement {
  document.documentElement.setAttribute('data-dsh-aqua', '')
  document.documentElement.setAttribute('data-dsh-float', '')
  document.head.innerHTML = `<style>${aquaCss}</style>`
  document.body.innerHTML = '<div data-phase="active"><div data-conversation-scroll></div></div>'
  return document.querySelector('[data-conversation-scroll]') as HTMLElement
}

describe('the press cannot summon a horizontal scrollbar', () => {
  it('clips the transcript scrollport on the x axis', () => {
    // `clip`, not `hidden`: hidden still allows programmatic scrolling, so
    // focusing the textarea could shift the column sideways.
    expect(getComputedStyle(mountScrollport()).overflowX).toBe('clip')
  })

  it('leaves the vertical axis scrollable', () => {
    expect(getComputedStyle(mountScrollport()).overflowY).not.toBe('clip')
  })

  it('scopes the rule to the aqua float mode', () => {
    // Compat mode has no data-dsh-float and must keep the stock scrollport.
    expect(aquaCss).toContain('[data-dsh-aqua][data-dsh-float] [data-conversation-scroll] {')
  })
})
