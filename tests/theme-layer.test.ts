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

/** Fake client context good enough for `AquaLayer`. */
function makeContext(colorScheme: 'dark' | 'light' = 'dark') {
  return {
    theme: { getTheme: () => ({ active: { colorScheme } }), overrideTokens: () => () => {} },
    on: () => () => {},
    effect: (setup: () => (() => void) | void) => {
      const dispose = setup()
      if (dispose) disposers.push(dispose)
      return dispose
    },
  }
}

/** Build a layer directly from whatever is already in localStorage. */
function layerFromStorage(colorScheme: 'dark' | 'light' = 'dark'): AquaLayer {
  return new AquaLayer(makeContext(colorScheme) as unknown as Context)
}

/** One wallpaper slot with the given image and default knobs. */
function slot(image = '') {
  return { image, blur: 0, frost: 0, videoBlur: 6, videoBrightness: 45 }
}

function createLayer(wallpaper: string, colorScheme: 'dark' | 'light' = 'dark'): AquaLayer {
  localStorage.setItem('dsh.ui-aqua.background', 'wallpaper')
  localStorage.setItem('dsh.ui-aqua.wallpaper', wallpaper)
  localStorage.setItem('dsh.ui-aqua.whale', 'false')
  localStorage.setItem('dsh.ui-aqua.mesh', 'false')
  return layerFromStorage(colorScheme)
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

describe('cursor glow', () => {
  it.each([
    ['dark', 'rgba(255, 255, 255, 0.16)'],
    ['light', 'rgba(255, 255, 255, 0.5)'],
  ] as const)('paints a white highlight in %s mode', (scheme, expected) => {
    const layer = createLayer('', scheme)
    expect(layer.getDark()).toBe(scheme === 'dark')
    expect(document.documentElement.style.getPropertyValue('--dsh-aqua-spot-color')).toBe(expected)
  })
})

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose()
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('data-dsh-aqua')
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('per-scheme wallpapers', () => {
  const DARK_IMAGE = 'data:image/png;base64,ZGFyaw=='
  const LIGHT_IMAGE = 'data:image/png;base64,bGlnaHQ='
  const lightKey = 'dsh.ui-aqua.wallpaperLight'
  const darkKey = 'dsh.ui-aqua.wallpaper'

  it('reads light and dark wallpapers from separate keys', () => {
    localStorage.setItem('dsh.ui-aqua.background', 'wallpaper')
    localStorage.setItem(darkKey, JSON.stringify(slot(DARK_IMAGE)))
    localStorage.setItem(lightKey, JSON.stringify(slot(LIGHT_IMAGE)))
    const layer = layerFromStorage('dark')
    expect(layer.getSettings().wallpapers.dark.image).toBe(DARK_IMAGE)
    expect(layer.getSettings().wallpapers.light.image).toBe(LIGHT_IMAGE)
  })

  it('edits only the scheme it is given', () => {
    const layer = createLayer(DARK_IMAGE)
    layer.setWallpaper(LIGHT_IMAGE, 'light')
    layer.setVideoBlur(12, 'light')
    expect(layer.getSettings().wallpapers.light).toEqual({ ...slot(LIGHT_IMAGE), videoBlur: 12 })
    expect(layer.getSettings().wallpapers.dark).toEqual(slot(DARK_IMAGE))
  })

  it('keeps the live backdrop on the active scheme and falls back to fluid when it is unset', () => {
    localStorage.setItem('dsh.ui-aqua.background', 'wallpaper')
    localStorage.setItem(lightKey, JSON.stringify(slot(LIGHT_IMAGE)))
    const layer = layerFromStorage('dark')
    // Dark mode is active and its slot is empty: no wallpaper paints the page.
    expect(layer.getSettings().wallpapers.light.image).toBe(LIGHT_IMAGE)
    expect(document.documentElement.hasAttribute('data-dsh-aqua-wallpaper')).toBe(false)
    expect(document.querySelector('[data-dsh-aqua-wallpaper-img]')?.hasAttribute('src')).toBe(false)
  })

  it('drives the knob CSS variables from the active scheme only', () => {
    localStorage.setItem('dsh.ui-aqua.background', 'wallpaper')
    localStorage.setItem(darkKey, JSON.stringify({ image: DARK_IMAGE, blur: 8, frost: 30, videoBlur: 4, videoBrightness: 20 }))
    localStorage.setItem(lightKey, JSON.stringify({ image: LIGHT_IMAGE, blur: 22, frost: 90, videoBlur: 1, videoBrightness: 95 }))
    layerFromStorage('dark')
    expect(document.documentElement.style.getPropertyValue('--dsh-aqua-wallpaper-blur')).toBe('8px')
    expect(document.documentElement.style.getPropertyValue('--dsh-aqua-wallpaper-frost')).toBe('0.3')
    expect(document.documentElement.style.getPropertyValue('--dsh-aqua-video-blur')).toBe('4px')
    expect(document.documentElement.style.getPropertyValue('--dsh-aqua-video-dim')).toBe(String((80 / 100) * 0.65))
  })

  it('migrates the legacy raw string and knob keys into both slots', () => {
    localStorage.setItem('dsh.ui-aqua.background', 'wallpaper')
    localStorage.setItem(darkKey, DARK_IMAGE)
    localStorage.setItem('dsh.ui-aqua.wallpaperBlur', '12')
    localStorage.setItem('dsh.ui-aqua.wallpaperFrost', '34')
    localStorage.setItem('dsh.ui-aqua.videoBlur', '9')
    localStorage.setItem('dsh.ui-aqua.videoBrightness', '70')
    const layer = layerFromStorage('dark')
    const migrated = { image: DARK_IMAGE, blur: 12, frost: 34, videoBlur: 9, videoBrightness: 70 }
    // The pre-split wallpaper seeds the light slot too, so an upgrade looks
    // unchanged in either scheme; it is persisted so later edits stay apart.
    expect(layer.getSettings().wallpapers.dark).toEqual(migrated)
    expect(layer.getSettings().wallpapers.light).toEqual(migrated)
    expect(JSON.parse(localStorage.getItem(lightKey) ?? 'null')).toEqual(migrated)
    expect(document.documentElement.style.getPropertyValue('--dsh-aqua-wallpaper-blur')).toBe('12px')
  })

  it('keeps a cleared light slot empty instead of re-seeding it from dark', () => {
    localStorage.setItem('dsh.ui-aqua.background', 'wallpaper')
    localStorage.setItem(darkKey, JSON.stringify(slot(DARK_IMAGE)))
    localStorage.setItem(lightKey, JSON.stringify(slot('')))
    const layer = layerFromStorage('light')
    expect(layer.getSettings().wallpapers.light.image).toBe('')
    // Light mode is active and its slot is empty, so the fluid board shows.
    expect(document.documentElement.hasAttribute('data-dsh-aqua-wallpaper')).toBe(false)
  })

  it('loads the remembered video handle for the active scheme', async () => {
    createLayer('fsa:example.mp4')
    await waitFor(() => expect(loadVideoHandle).toHaveBeenCalledWith('dark'))
  })

  it('plays the seeded legacy video in light mode through the old handle', async () => {
    createLayer('fsa:example.mp4', 'light')
    await waitFor(() => expect(loadVideoHandle).toHaveBeenCalledWith('light'))
    await waitFor(() => {
      expect(document.querySelector('[data-dsh-aqua-wallpaper-video]')?.getAttribute('src')).toBe('blob:aqua-video')
    })
  })
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
