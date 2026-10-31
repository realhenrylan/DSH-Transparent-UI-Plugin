// @vitest-environment jsdom
import { waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { AquaLayer } from '../src/client/theme-layer.ts'
import { loadVideoBlob, loadVideoHandle } from '../src/client/wallpaper-store.ts'
import { mountMesh } from '../src/client/mesh.ts'

vi.mock('../src/client/critters.ts', () => ({
  ensureAmbientScene: () => {
    const ambient = document.createElement('div')
    ambient.setAttribute('data-dsh-aqua-ambient', '')
    document.body.appendChild(ambient)
    const media = document.createElement('div')
    media.setAttribute('data-dsh-aqua-wallpaper-layer', '')
    media.innerHTML = '<img data-dsh-aqua-wallpaper-img><video data-dsh-aqua-wallpaper-video></video>'
    document.body.appendChild(media)
  },
  removeAmbientScene: () => {
    document.querySelector('[data-dsh-aqua-ambient]')?.remove()
    document.querySelector('[data-dsh-aqua-wallpaper-layer]')?.remove()
  },
  ensurePageFades: () => {},
  removePageFades: () => {},
}))
vi.mock('../src/client/seam-stamper.ts', () => ({ startSeamStamper: () => () => {} }))
vi.mock('../src/client/spotlight.ts', () => ({
  startSpotlight: () => () => {}, SPOTLIGHT_ATTRIBUTE: 'data-dsh-aqua-spotlight', PRESS_ATTRIBUTE: 'data-dsh-aqua-press',
}))
vi.mock('../src/client/whale.ts', () => ({ mountWhale: () => ({ dispose: () => {} }) }))
vi.mock('../src/client/mesh.ts', () => ({ mountMesh: vi.fn(() => ({ dispose: () => {} })) }))
vi.mock('../src/client/wallpaper-store.ts', () => ({
  deleteVideoBlob: vi.fn(),
  loadVideoBlob: vi.fn(async () => new Blob(['video'], { type: 'video/mp4' })),
  loadVideoHandle: vi.fn(async () => ({
    queryPermission: async () => 'granted',
    getFile: async () => new File(['video'], 'example.mp4', { type: 'video/mp4' }),
  })),
}))

const disposers: Array<() => void> = []

function createLayer(wallpaper: string): AquaLayer {
  localStorage.setItem('dsh.ui-aqua.background', 'wallpaper')
  localStorage.setItem('dsh.ui-aqua.wallpaper', wallpaper)
  localStorage.setItem('dsh.ui-aqua.whale', 'false')
  localStorage.setItem('dsh.ui-aqua.mesh', 'false')
  const context = {
    theme: { getTheme: () => ({ active: { colorScheme: 'dark' } }), overrideTokens: () => () => {} },
    on: () => () => {},
    effect: (setup: () => (() => void) | void) => {
      const dispose = setup()
      if (dispose) disposers.push(dispose)
      return dispose
    },
  }
  return new AquaLayer(context as unknown as Context)
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  vi.stubGlobal('requestAnimationFrame', () => 1)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:aqua-video') })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
})

describe('settings shared by windows', () => {
  it('applies a numeric setting changed by another window and notifies the controls', () => {
    const layer = createLayer('')
    const sync = vi.fn()
    layer.subscribe(sync)
    localStorage.setItem('dsh.ui-aqua.blur', '31')
    window.dispatchEvent(new StorageEvent('storage', { key: 'dsh.ui-aqua.blur', newValue: '31' }))
    expect(layer.getSettings().blur).toBe(31)
    expect(document.documentElement.style.getPropertyValue('--dsh-aqua-blur')).toBe('31px')
    expect(sync).toHaveBeenCalledOnce()
  })

  it('mounts the mesh when another window enables it', () => {
    createLayer('')
    localStorage.setItem('dsh.ui-aqua.mesh', 'true')
    window.dispatchEvent(new StorageEvent('storage', { key: 'dsh.ui-aqua.mesh', newValue: 'true' }))
    expect(mountMesh).toHaveBeenCalledOnce()
  })
})

it('clamps color depth to the supported 0–100 range', () => {
  const layer = createLayer('')
  layer.setFluidDepth(200)
  expect(layer.getSettings().fluidDepth).toBe(100)
})

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose()
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('data-dsh-aqua')
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('video wallpaper', () => {
  it.each(['idb:video-id', 'fsa:example.mp4'])('restores %s after switching away and back', async wallpaper => {
    const layer = createLayer(wallpaper)
    const video = document.querySelector<HTMLVideoElement>('[data-dsh-aqua-wallpaper-video]')!
    await waitFor(() => expect(video.getAttribute('src')).toBe('blob:aqua-video'))
    layer.setBackground('fluid')
    expect(video.getAttribute('src')).toBeNull()
    layer.setBackground('wallpaper')
    expect(video.getAttribute('src')).toBe('blob:aqua-video')
  })

  it.each(['fluid', 'disable'])('ignores an IndexedDB load that finishes after %s', async action => {
    let finish!: (blob: Blob) => void
    vi.mocked(loadVideoBlob).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const layer = createLayer('idb:slow-video')
    if (action === 'fluid') layer.setBackground('fluid')
    else layer.setEnabled(false)
    finish(new Blob(['video'], { type: 'video/mp4' }))
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('ignores a file handle load that finishes after the wallpaper is changed', async () => {
    let finish!: (file: File) => void
    const getFile = vi.fn(() => new Promise<File>(resolve => { finish = resolve }))
    vi.mocked(loadVideoHandle).mockResolvedValueOnce({ queryPermission: async () => 'granted', getFile } as unknown as FileSystemFileHandle)
    const layer = createLayer('fsa:slow-video.mp4')
    await waitFor(() => expect(getFile).toHaveBeenCalledOnce())
    layer.setWallpaper('data:image/png;base64,dGVzdA==')
    finish(new File(['video'], 'slow-video.mp4', { type: 'video/mp4' }))
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })
})
