// @vitest-environment jsdom
import React from 'react'
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AquaAppearanceRow } from '../src/client/AquaAppearanceRow.tsx'
import { zh } from '../src/client/locales.ts'

afterEach(cleanup)

function renderRow(enabled: boolean) {
  const setEnabled = vi.fn()
  const state = {
    enabled, mode: 'mica', blur: 20, frost: 7, fluidHue: 320, fluidDepth: 25,
    bgBrightness: 50, dark: false, background: 'fluid', wallpaper: '', whale: true,
    critters: true, mesh: true, spotlight: true, press: true, wallpaperBlur: 0,
    wallpaperFrost: 0, videoBlur: 6, videoBrightness: 45,
  }
  const noop = () => {}
  render(<AquaAppearanceRow {...({
    t: (key: keyof typeof zh) => zh[key],
    useStore: (select: (s: typeof state) => unknown) => select(state),
    setEnabled, setMode: noop, setBlur: noop, setFrost: noop, setFluidHue: noop,
    setFluidDepth: noop, setBgBrightness: noop, setBackground: noop, setWallpaper: noop,
    setWhale: noop, setCritters: noop, setMesh: noop, setSpotlight: noop, setPress: noop,
    setWallpaperBlur: noop, setWallpaperFrost: noop, setVideoBlur: noop,
    setVideoBrightness: noop, authorizeVideo: noop,
  } as unknown as React.ComponentProps<typeof AquaAppearanceRow>)} />)
  return setEnabled
}

describe('Aqua master switch in General settings', () => {
  it('remains available when the theme is off and turns it on', () => {
    const setEnabled = renderRow(false)
    const toggle = screen.getByRole('switch', { name: '玻璃主题' })
    expect(toggle.getAttribute('aria-checked')).toBe('false')
    expect(screen.queryByText('模式')).toBeNull()
    fireEvent.click(toggle)
    expect(setEnabled).toHaveBeenCalledWith(true)
  })

  it('shows the controls when on and turns the theme off', () => {
    const setEnabled = renderRow(true)
    const toggle = screen.getByRole('switch', { name: '玻璃主题' })
    expect(toggle.getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText('模式')).toBeTruthy()
    fireEvent.click(toggle)
    expect(setEnabled).toHaveBeenCalledWith(false)
  })
})
