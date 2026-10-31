/**
 * Aqua theme layer: one toggleable visual skin over the whole Web surface.
 * Everything this layer owns is an effect — token overrides ride the theme
 * service's override stack, the CSS hooks ride a `data-dsh-aqua` attribute on
 * <html> (the stylesheet only applies under it), the ambient scene and page
 * fades are mounted/removed with the layer — so switching the flag off (or
 * unloading the plugin) restores the stock UI exactly: no residue, no reload.
 *
 * The enable flag persists in localStorage: a client-only visual preference
 * (like the selected-session key), written and read by this plugin alone.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client';
/** html attribute selecting the Aqua layer: CSS hooks and ambient effects. */
export declare const AQUA_ATTRIBUTE = "data-dsh-aqua";
/** localStorage key carrying the layer enable flag. */
export declare const AQUA_ENABLED_KEY = "dsh.ui-aqua.enabled";
/** Default state when nothing is stored yet: on. */
export declare const DEFAULT_ENABLED = true;
/**
 * Alias-token override layer: the deep-sea palette. Every value is a
 * `{ light, dark }` pair so the layer stays legible when the user switches
 * the Appearance preference — dark is deep-sea navy, light is cool white-blue.
 */
export declare const AQUA_TOKEN_OVERRIDES: ThemeTokenOverrides;
/** Color scheme a wallpaper slot belongs to. */
export type AquaScheme = 'light' | 'dark';
/** One scheme's wallpaper: the media plus its tuning knobs. */
export interface AquaWallpaperSettings {
    /** Image data URL, `idb:<id>` / `fsa:<name>` video marker, or '' (unset). */
    image: string;
    /** Wallpaper blur radius, px. */
    blur: number;
    /** Wallpaper frost veil, 0-100. */
    frost: number;
    /** Video wallpaper blur radius, px (0 = crisp, 40 = heavy acrylic). */
    videoBlur: number;
    /** Video wallpaper brightness, 0-100 (100 = fully lit, 0 = deepest dim). */
    videoBrightness: number;
}
/** Tunable layer knobs, persisted independently of the enable flag. */
export interface AquaSettings {
    /** Rendering mode: mica (frosted floating cards) or the stock layout with a generic glass material. */
    mode: 'mica' | 'compat';
    /** Glass backdrop blur radius, px. */
    blur: number;
    /** Glass fill opacity, 0-100 (50 = the shipped look; drives the frost multiplier). */
    frost: number;
    /** Fluid hue, degrees (0-360, continuous). */
    fluidHue: number;
    /** Fluid depth, 0-100 (0 = deep saturated, 100 = pale light, continuous). */
    fluidDepth: number;
    /** Background brightness, 0-100 (0 = pure black, 50 = transparent, 100 = pure white). */
    bgBrightness: number;
    /** Backdrop source: the living fluid board or a custom wallpaper. */
    background: 'fluid' | 'wallpaper';
    /** Per-scheme wallpapers: light mode draws one, dark mode the other. */
    wallpapers: Record<AquaScheme, AquaWallpaperSettings>;
    /** Particle whale in the chat area center (the harness hero fish). */
    whale: boolean;
    /** Ambient marine life (fish / bubbles / plankton). */
    critters: boolean;
    /** Interactive mesh (the site's dot-grid with pointer repel). */
    mesh: boolean;
    /** Cursor spotlight glow that follows the pointer over the glass panes. */
    spotlight: boolean;
    /** Hover press-down: the pane under the cursor sinks a touch (tactile depth). */
    press: boolean;
}
/**
 * Owns the Aqua layer lifecycle: reads the durable enable flag, and applies /
 * retracts every layer on change. Cross-tab flips arrive through the storage
 * event; every subscription and mounted effect are released when the plugin
 * fiber is disposed.
 */
export declare class AquaLayer {
    private enabled;
    private settings;
    /** Resolved palette scheme: dark = the brightness knob darkens, light = it brightens. */
    private dark;
    private tokenDisposer;
    private mainFluid;
    private interactionDisposer;
    private themeListener;
    private seamDisposer;
    private spotlightDisposer;
    private whaleHandle;
    private meshHandle;
    /** Object URL of the current large-video wallpaper (revoked on replace). */
    private videoObjectUrl;
    /** IndexedDB id backing the current object URL (guards against reloads). */
    private videoBlobId;
    /** Only the most recent asynchronous video load may update the element. */
    private videoLoadId;
    private readonly listeners;
    private readonly ctx;
    /**
     * @param ctx - owning client context.
     */
    constructor(ctx: Context);
    /** Current enable state (the settings row mirrors this). */
    getEnabled(): boolean;
    /** Notify the settings row when another window changes persisted state. */
    subscribe(listener: () => void): () => void;
    /** Current knob values (the settings row mirrors these). */
    getSettings(): AquaSettings;
    /** Whether the resolved palette is dark (the brightness knob darkens). */
    getDark(): boolean;
    /** Resolved scheme from the theme service (falls back to the body attribute). */
    private resolveScheme;
    /** The scheme whose wallpaper is on screen (and the setters' default). */
    private scheme;
    /** Effective backdrop: a scheme without a wallpaper falls back to fluid. */
    private backdrop;
    /** Rewrite one scheme's wallpaper slot and persist it. */
    private patchWallpaper;
    /** Rewrite one wallpaper knob for a scheme (clamped) and re-apply. */
    private patchWallpaperKnob;
    /** Re-read every knob from localStorage into memory. */
    private reloadSettings;
    /** Flip the layer: persist, then apply or retract every owned effect. */
    setEnabled(value: boolean): void;
    /** Set the rendering mode ('mica' or 'compat'). */
    setMode(value: 'mica' | 'compat'): void;
    /** Set the glass blur radius (px). */
    setBlur(value: number): void;
    /** Set the glass frost amount (0-100). */
    setFrost(value: number): void;
    /** Set the fluid hue (degrees, continuous). */
    setFluidHue(value: number): void;
    /** Set the fluid depth (0-100, continuous: deep ↔ pale). */
    setFluidDepth(value: number): void;
    /** Set the background brightness (0-100: 0 = pure black, 50 = transparent, 100 = pure white). */
    setBgBrightness(value: number): void;
    /** Set the backdrop source (fluid board or custom wallpaper). */
    setBackground(value: 'fluid' | 'wallpaper'): void;
    /** Replace one scheme's wallpaper: an image data URL, an `idb:<id>` blob
     *  marker, or an `fsa:<name>` remembered file ('' clears the slot, which
     *  falls back to the fluid backdrop for that scheme). */
    setWallpaper(value: string, scheme?: AquaScheme): void;
    /** Set the particle-whale flag (chat-area center decoration). */
    setWhale(value: boolean): void;
    /** Set the ambient marine-life flag (fish / bubbles / plankton). */
    setCritters(value: boolean): void;
    /** Set the interactive-mesh flag (dot-grid decoration). */
    setMesh(value: boolean): void;
    /** Set the cursor-spotlight flag (pointer-tracking glass glow). */
    setSpotlight(value: boolean): void;
    /** Set the hover-press flag (pane sinks a touch under the cursor). */
    setPress(value: boolean): void;
    /** Set a scheme's wallpaper blur radius (px). */
    setWallpaperBlur(value: number, scheme?: AquaScheme): void;
    /** Set a scheme's wallpaper frost veil (0-100). */
    setWallpaperFrost(value: number, scheme?: AquaScheme): void;
    /** Set a scheme's video wallpaper blur radius (px). */
    setVideoBlur(value: number, scheme?: AquaScheme): void;
    /** Set a scheme's video wallpaper brightness (0-100, 100 = fully lit). */
    setVideoBrightness(value: number, scheme?: AquaScheme): void;
    private sync;
    /** Write the knob-driven CSS variables and mode attributes onto <html>. */
    private applySettings;
    /** Adopt a freshly created object URL for the given slot marker. */
    private adoptVideo;
    /** Ignore loads superseded by a backdrop switch, replacement, or unmount. */
    private isCurrentVideoLoad;
    /** The wallpaper plays as a plain <video> element (the browser's own
     *  decoder, no player chrome at all): looping on, cover fill via CSS, and
     *  autoplay with a muted fallback where policy requires it. A direct
     *  element (not an iframe) keeps backdrop-filter working over it, so the
     *  glass panels stay frosted above the video. */
    private configureWallpaperVideo;
    /** Drop the cached object URL once neither scheme's slot references it. */
    private releaseUnusedVideoCache;
    /** Reuse a cached file without restarting it on ordinary knob changes. */
    private restoreCachedVideo;
    /** Apply the mode's token layer (floating palette, or translucent compat). */
    private applyTokens;
    private mount;
    /** Mount or drop the particle whale to match enabled + the whale flag. */
    private syncWhale;
    /** Mount or drop the interactive mesh to match enabled + the mesh flag. */
    private syncMesh;
    private unmount;
    /** Attach the fluid shader and the interaction feeds. */
    private mountFluid;
    private teardownFluid;
    private fluidParams;
    private applyFluidPalettes;
    /** Stamp the data-* seams the stylesheet keys off (self-contained mode). */
    private startSeamStamper;
    /** Attach the cursor-spotlight pointer feeds (idempotent per mount). */
    private startSpotlightFeed;
}
