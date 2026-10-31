/**
 * Aqua row slot store: a mirror of the layer's state (enable flag plus the
 * knobs and the backdrop source). The plugin's apply-world change listener is
 * the only writer; the row component reads via props.useStore.
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-store'
import type { AquaScheme, AquaWallpaperSettings } from './theme-layer.ts'

/** Wallpaper slot state for both schemes when nothing is configured yet. */
const EMPTY_WALLPAPERS: Record<AquaScheme, AquaWallpaperSettings> = {
  light: { image: '', blur: 0, frost: 0, videoBlur: 6, videoBrightness: 45 },
  dark: { image: '', blur: 0, frost: 0, videoBlur: 6, videoBrightness: 45 },
}

/** Store state mirrored from the Aqua settings scope. */
export interface AquaRowState {
  /** Persisted layer enable flag. */
  enabled: boolean
  /** Rendering mode: mica or stock layout with generic glass. */
  mode: 'mica' | 'compat'
  /** Glass blur radius, px. */
  blur: number
  /** Glass frost amount, 0-100. */
  frost: number
  /** Fluid hue, degrees (0-360, continuous). */
  fluidHue: number
  /** Fluid depth, 0-100 (continuous). */
  fluidDepth: number
  /** Background brightness, 0-100. */
  bgBrightness: number
  /** Resolved palette is dark (brightness knob = darkening half). */
  dark: boolean
  /** Backdrop source: fluid board or custom wallpaper. */
  background: 'fluid' | 'wallpaper'
  /** Per-scheme wallpaper slots; the active scheme decides which one paints. */
  wallpapers: Record<AquaScheme, AquaWallpaperSettings>
  /** Particle whale in the chat area center. */
  whale: boolean
  /** Ambient marine life (fish / bubbles / plankton). */
  critters: boolean
  /** Interactive mesh (the site's dot-grid with pointer repel). */
  mesh: boolean
  /** Cursor spotlight glow following the pointer over the glass panes. */
  spotlight: boolean
  /** Hover press-down for the glass panes. */
  press: boolean
  /** Monotonic revision; -1 until first sync so revision 0 lands as a change. */
  revision: number
}

/** The full payload the layer pushes into the row store on every change. */
export interface AquaSettingsPayload {
  enabled: boolean
  mode: 'mica' | 'compat'
  blur: number
  frost: number
  fluidHue: number
  fluidDepth: number
  bgBrightness: number
  dark: boolean
  background: 'fluid' | 'wallpaper'
  wallpapers: Record<AquaScheme, AquaWallpaperSettings>
  whale: boolean
  critters: boolean
  mesh: boolean
  spotlight: boolean
  press: boolean
}

/** Declared action shape giving the exported factory a stable return type. */
type AquaRowActions = {
  sync: (draft: AquaRowState, next: AquaSettingsPayload, revision: number) => void
}

/**
 * Declares the Aqua row state and write surface.
 * @returns the store handle.
 */
export function createAquaRowStore(): EngineStoreHandle<AquaRowState, AquaRowActions> {
  return defineStore({
    init: (): AquaRowState => ({
      enabled: true,
      mode: 'mica',
      blur: 20,
      frost: 7,
      fluidHue: 320,
      fluidDepth: 25,
      bgBrightness: 50,
      dark: false,
      background: 'fluid',
      wallpapers: { light: { ...EMPTY_WALLPAPERS.light }, dark: { ...EMPTY_WALLPAPERS.dark } },
      whale: true,
      critters: true,
      mesh: true,
      spotlight: true,
      press: true,
      revision: -1,
    }),
    actions: {
      sync: (d, next: AquaSettingsPayload, revision: number) => {
        if (revision <= d.revision) return
        d.enabled = next.enabled
        d.mode = next.mode
        d.blur = next.blur
        d.frost = next.frost
        d.fluidHue = next.fluidHue
        d.fluidDepth = next.fluidDepth
        d.bgBrightness = next.bgBrightness
        d.dark = next.dark
        d.background = next.background
        d.wallpapers = next.wallpapers
        d.whale = next.whale
        d.critters = next.critters
        d.mesh = next.mesh
        d.spotlight = next.spotlight
        d.press = next.press
        d.revision = revision
      },
    },
  })
}
