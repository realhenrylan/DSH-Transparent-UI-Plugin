// @vitest-environment jsdom
import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AquaAppearanceRow } from '../src/client/AquaAppearanceRow.tsx'
import { zh } from '../src/client/locales.ts'
import { loadVideoHandle } from '../src/client/wallpaper-store.ts'

vi.mock('../src/client/AquaControls.tsx', async importOriginal => ({
  ...await importOriginal<typeof import('../src/client/AquaControls.tsx')>(),
  // A video must never be passed through the image-only converter.
  fileToDataUrl: vi.fn(async () => 'data:image/jpeg;base64,converted'),
}))
vi.mock('../src/client/wallpaper-store.ts', () => ({
  loadVideoHandle: vi.fn(async () => null),
  saveVideoBlob: vi.fn(async () => ''),
  saveVideoHandle: vi.fn(async () => false),
}))

function renderWallpaperRow(wallpaper = '') {
  const setWallpaper = vi.fn()
  const setBackground = vi.fn()
  const state = {
    enabled: true, mode: 'mica', blur: 20, frost: 7, fluidHue: 320, fluidDepth: 25,
    bgBrightness: 50, dark: false, background: 'wallpaper', wallpaper, whale: true,
    critters: true, mesh: true, spotlight: true, press: true, wallpaperBlur: 0,
    wallpaperFrost: 0, videoBlur: 6, videoBrightness: 45,
  }
  const noop = () => {}
  const result = render(<AquaAppearanceRow {...({
    t: (key: keyof typeof zh) => zh[key], useStore: (select: (s: typeof state) => unknown) => select(state),
    setWallpaper, setEnabled: noop, setMode: noop, setBlur: noop, setFrost: noop, setFluidHue: noop,
    setFluidDepth: noop, setBgBrightness: noop, setBackground, setWhale: noop,
    setCritters: noop, setMesh: noop, setSpotlight: noop, setPress: noop, setWallpaperBlur: noop,
    setWallpaperFrost: noop, setVideoBlur: noop, setVideoBrightness: noop, authorizeVideo: noop,
  } as unknown as React.ComponentProps<typeof AquaAppearanceRow>)} />)
  return { ...result, setWallpaper, setBackground }
}

beforeEach(() => { vi.restoreAllMocks() })
afterEach(() => {
  cleanup()
  Reflect.deleteProperty(window, 'showOpenFilePicker')
})

it('returns to the fluid background when the wallpaper is deleted', () => {
  const { setWallpaper, setBackground } = renderWallpaperRow('data:image/png;base64,dGVzdA==')
  fireEvent.click(screen.getByRole('button', { name: '删除' }))
  expect(setWallpaper).toHaveBeenCalledWith('')
  expect(setBackground).toHaveBeenCalledWith('fluid')
})

describe('video selection when IndexedDB is unavailable', () => {
  it('uses a video data URL from the file input', async () => {
    const { container, setWallpaper } = renderWallpaperRow()
    const input = container.querySelector<HTMLInputElement>('input[accept^="video/"]')!
    fireEvent.change(input, { target: { files: [new File(['test video'], 'test.mp4', { type: 'video/mp4' })] } })
    await waitFor(() => expect(setWallpaper).toHaveBeenCalledWith('data:video/mp4;base64,dGVzdCB2aWRlbw=='))
  })

  it('uses a video data URL when a picked file handle cannot be stored', async () => {
    const file = new File(['test video'], 'test.mp4', { type: 'video/mp4' })
    Object.defineProperty(window, 'showOpenFilePicker', { configurable: true, value: vi.fn(async () => [{ name: file.name, getFile: async () => file }]) })
    const { setWallpaper } = renderWallpaperRow()
    fireEvent.click(screen.getByRole('button', { name: '选择视频' }))
    await waitFor(() => expect(setWallpaper).toHaveBeenCalledWith('data:video/mp4;base64,dGVzdCB2aWRlbw=='))
  })
})

describe('video picker availability', () => {
  it('can choose a different video when the saved file is already authorized', async () => {
    vi.mocked(loadVideoHandle).mockResolvedValueOnce({ queryPermission: async () => 'granted' } as unknown as FileSystemFileHandle)
    const picker = vi.fn(async () => [])
    Object.defineProperty(window, 'showOpenFilePicker', { configurable: true, value: picker })
    renderWallpaperRow('fsa:old-video.mp4')
    fireEvent.click(screen.getByRole('button', { name: '选择视频' }))
    await waitFor(() => expect(picker).toHaveBeenCalledOnce())
  })

  it('opens the file input when the native picker is unavailable for this origin', async () => {
    Object.defineProperty(window, 'showOpenFilePicker', {
      configurable: true, value: vi.fn(async () => { throw new DOMException('Unavailable', 'SecurityError') }),
    })
    const { container } = renderWallpaperRow()
    const input = container.querySelector<HTMLInputElement>('input[accept^="video/"]')!
    const openInput = vi.spyOn(input, 'click').mockImplementation(() => {})
    fireEvent.click(screen.getByRole('button', { name: '选择视频' }))
    await waitFor(() => expect(openInput).toHaveBeenCalledOnce())
  })

  it('does not reopen the file picker when the user cancels', async () => {
    const picker = vi.fn(async () => { throw new DOMException('Cancelled', 'AbortError') })
    Object.defineProperty(window, 'showOpenFilePicker', { configurable: true, value: picker })
    const { container } = renderWallpaperRow()
    const input = container.querySelector<HTMLInputElement>('input[accept^="video/"]')!
    const openInput = vi.spyOn(input, 'click').mockImplementation(() => {})
    fireEvent.click(screen.getByRole('button', { name: '选择视频' }))
    await waitFor(() => expect(picker).toHaveBeenCalledOnce())
    await Promise.resolve()
    expect(openInput).not.toHaveBeenCalled()
  })
})
