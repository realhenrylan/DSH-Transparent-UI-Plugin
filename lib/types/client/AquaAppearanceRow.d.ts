import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { createAquaRowStore } from './settings-store.ts';
import type { AquaScheme } from './theme-layer.ts';
/** Injected business face for the master switch and every knob. */
export interface AquaAppearanceRowInjected {
    /** Switch the glass layer on or off. */
    setEnabled: (value: boolean) => void;
    /** Set the rendering mode. */
    setMode: (value: 'mica' | 'compat') => void;
    /** Set the glass blur radius, px. */
    setBlur: (value: number) => void;
    /** Set the glass frost amount, 0-100. */
    setFrost: (value: number) => void;
    /** Set the fluid hue, degrees (0-360, continuous). */
    setFluidHue: (value: number) => void;
    /** Set the fluid depth, 0-100 (continuous). */
    setFluidDepth: (value: number) => void;
    /** Set the background brightness, 0-100 (0 = black, 50 = transparent, 100 = white). */
    setBgBrightness: (value: number) => void;
    /** Set the backdrop source. */
    setBackground: (value: 'fluid' | 'wallpaper') => void;
    /** Set a scheme's wallpaper image (a data URL, `idb:` blob, or `fsa:` handle). */
    setWallpaper: (value: string, scheme?: AquaScheme) => void;
    /** Set the particle-whale flag. */
    setWhale: (value: boolean) => void;
    /** Set the ambient marine-life flag. */
    setCritters: (value: boolean) => void;
    /** Set the interactive-mesh flag. */
    setMesh: (value: boolean) => void;
    /** Set the cursor-spotlight flag. */
    setSpotlight: (value: boolean) => void;
    /** Set the hover-press flag. */
    setPress: (value: boolean) => void;
    /** Set a scheme's wallpaper blur radius, px. */
    setWallpaperBlur: (value: number, scheme?: AquaScheme) => void;
    /** Set a scheme's wallpaper frost veil, 0-100. */
    setWallpaperFrost: (value: number, scheme?: AquaScheme) => void;
    /** Set a scheme's video wallpaper blur radius, px. */
    setVideoBlur: (value: number, scheme?: AquaScheme) => void;
    /** Set a scheme's video wallpaper brightness, 0-100. */
    setVideoBrightness: (value: number, scheme?: AquaScheme) => void;
}
/** Full component props: runtime share + store share + locale seat + injected face. */
export type AquaAppearanceRowComponentProps = PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createAquaRowStore>> & PropsLocale<'settings.aqua'> & AquaAppearanceRowInjected;
/**
 * Render the Aqua appearance row.
 * @param props - composed slot props.
 * @returns the General section row.
 */
export declare function AquaAppearanceRow(props: AquaAppearanceRowComponentProps): import("react/jsx-runtime").JSX.Element;
