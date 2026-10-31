/**
 * Aqua row slot store: a mirror of the layer's state (enable flag plus the
 * knobs and the backdrop source). The plugin's apply-world change listener is
 * the only writer; the row component reads via props.useStore.
 */
import { type EngineStoreHandle } from '@deepseek-ai/dsh-client-store';
import type { AquaScheme, AquaWallpaperSettings } from './theme-layer.ts';
/** Store state mirrored from the Aqua settings scope. */
export interface AquaRowState {
    /** Persisted layer enable flag. */
    enabled: boolean;
    /** Rendering mode: mica or stock layout with generic glass. */
    mode: 'mica' | 'compat';
    /** Glass blur radius, px. */
    blur: number;
    /** Glass frost amount, 0-100. */
    frost: number;
    /** Fluid hue, degrees (0-360, continuous). */
    fluidHue: number;
    /** Fluid depth, 0-100 (continuous). */
    fluidDepth: number;
    /** Background brightness, 0-100. */
    bgBrightness: number;
    /** Resolved palette is dark (brightness knob = darkening half). */
    dark: boolean;
    /** Backdrop source: fluid board or custom wallpaper. */
    background: 'fluid' | 'wallpaper';
    /** Per-scheme wallpaper slots; the active scheme decides which one paints. */
    wallpapers: Record<AquaScheme, AquaWallpaperSettings>;
    /** Particle whale in the chat area center. */
    whale: boolean;
    /** Ambient marine life (fish / bubbles / plankton). */
    critters: boolean;
    /** Interactive mesh (the site's dot-grid with pointer repel). */
    mesh: boolean;
    /** Cursor spotlight glow following the pointer over the glass panes. */
    spotlight: boolean;
    /** Hover press-down for the glass panes. */
    press: boolean;
    /** Monotonic revision; -1 until first sync so revision 0 lands as a change. */
    revision: number;
}
/** The full payload the layer pushes into the row store on every change. */
export interface AquaSettingsPayload {
    enabled: boolean;
    mode: 'mica' | 'compat';
    blur: number;
    frost: number;
    fluidHue: number;
    fluidDepth: number;
    bgBrightness: number;
    dark: boolean;
    background: 'fluid' | 'wallpaper';
    wallpapers: Record<AquaScheme, AquaWallpaperSettings>;
    whale: boolean;
    critters: boolean;
    mesh: boolean;
    spotlight: boolean;
    press: boolean;
}
/** Declared action shape giving the exported factory a stable return type. */
type AquaRowActions = {
    sync: (draft: AquaRowState, next: AquaSettingsPayload, revision: number) => void;
};
/**
 * Declares the Aqua row state and write surface.
 * @returns the store handle.
 */
export declare function createAquaRowStore(): EngineStoreHandle<AquaRowState, AquaRowActions>;
export {};
