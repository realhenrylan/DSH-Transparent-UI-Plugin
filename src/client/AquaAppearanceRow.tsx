/**
 * Aqua row registered into the General settings section
 * (`settings.general.item`, right under Appearance): every glass knob — mode
 * (mica / compatibility), blur/frost (mica mode only), fluid color,
 * background brightness, the backdrop source picker, and one wallpaper block
 * per scheme (light / dark) with its own knobs. Every
 * write goes straight through to the layer, so the skin moves live. The
 * controls follow the Appearance cubes directly (no row title of their own),
 * and the master switch remains available when the other controls are off.
 */
import { useRef } from 'react'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the `settings.general.item` SlotMap merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { fileToDataUrl, readFileAsDataUrl, Knob, Segmented } from './AquaControls.tsx'
import { saveVideoBlob, saveVideoHandle } from './wallpaper-store.ts'
import type { createAquaRowStore } from './settings-store.ts'
import type { AquaScheme, AquaWallpaperSettings } from './theme-layer.ts'
import css from './AquaAppearanceRow.module.css'

/** Schemes whose wallpapers are stored separately. */
const SCHEMES: readonly AquaScheme[] = ['light', 'dark']

/** Injected business face for the master switch and every knob. */
export interface AquaAppearanceRowInjected {
  /** Switch the glass layer on or off. */
  setEnabled: (value: boolean) => void
  /** Set the rendering mode. */
  setMode: (value: 'mica' | 'compat') => void
  /** Set the glass blur radius, px. */
  setBlur: (value: number) => void
  /** Set the glass frost amount, 0-100. */
  setFrost: (value: number) => void
  /** Set the fluid hue, degrees (0-360, continuous). */
  setFluidHue: (value: number) => void
  /** Set the fluid depth, 0-100 (continuous). */
  setFluidDepth: (value: number) => void
  /** Set the background brightness, 0-100 (0 = black, 50 = transparent, 100 = white). */
  setBgBrightness: (value: number) => void
  /** Set the backdrop source. */
  setBackground: (value: 'fluid' | 'wallpaper') => void
  /** Set a scheme's wallpaper image (a data URL, `idb:` blob, or `fsa:` handle). */
  setWallpaper: (value: string, scheme?: AquaScheme) => void
  /** Set the particle-whale flag. */
  setWhale: (value: boolean) => void
  /** Set the ambient marine-life flag. */
  setCritters: (value: boolean) => void
  /** Set the interactive-mesh flag. */
  setMesh: (value: boolean) => void
  /** Set the cursor-spotlight flag. */
  setSpotlight: (value: boolean) => void
  /** Set the hover-press flag. */
  setPress: (value: boolean) => void
  /** Set a scheme's wallpaper blur radius, px. */
  setWallpaperBlur: (value: number, scheme?: AquaScheme) => void
  /** Set a scheme's wallpaper frost veil, 0-100. */
  setWallpaperFrost: (value: number, scheme?: AquaScheme) => void
  /** Set a scheme's video wallpaper blur radius, px. */
  setVideoBlur: (value: number, scheme?: AquaScheme) => void
  /** Set a scheme's video wallpaper brightness, 0-100. */
  setVideoBrightness: (value: number, scheme?: AquaScheme) => void
}

/** Full component props: runtime share + store share + locale seat + injected face. */
export type AquaAppearanceRowComponentProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createAquaRowStore>>
  & PropsLocale<'settings.aqua'> & AquaAppearanceRowInjected

/**
 * Render the Aqua appearance row.
 * @param props - composed slot props.
 * @returns the General section row.
 */
export function AquaAppearanceRow(props: AquaAppearanceRowComponentProps) {
  const {
    t, setEnabled, setMode, setBlur, setFrost, setFluidHue, setFluidDepth, setBgBrightness,
    setBackground, setWallpaper, setWhale, setCritters, setMesh, setSpotlight, setPress,
    setWallpaperBlur, setWallpaperFrost, setVideoBlur, setVideoBrightness, useStore,
  } = props
  const enabled = useStore(s => s.enabled)
  const mode = useStore(s => s.mode)
  const blur = useStore(s => s.blur)
  const frost = useStore(s => s.frost)
  const fluidHue = useStore(s => s.fluidHue)
  const fluidDepth = useStore(s => s.fluidDepth)
  const bgBrightness = useStore(s => s.bgBrightness)
  const dark = useStore(s => s.dark)
  const background = useStore(s => s.background)
  const wallpapers = useStore(s => s.wallpapers)
  const whale = useStore(s => s.whale)
  const critters = useStore(s => s.critters)
  const mesh = useStore(s => s.mesh)
  const spotlight = useStore(s => s.spotlight)
  const press = useStore(s => s.press)
  // The scheme whose slot currently paints the page; the other one is stored
  // for later but does not affect the live backdrop.
  const activeScheme: AquaScheme = dark ? 'dark' : 'light'

  // The brightness knob only ever offers the half that makes sense for the
  // resolved scheme: dark mode darkens (0-50), light mode brightens (50-100).
  // The stored 0-100 value is clamped for display; writing always stays in
  // the offered range, so a value picked in one scheme is inert in the other.
  const bgMin = dark ? 0 : 50
  const bgMax = dark ? 50 : 100
  const bgDisplay = Math.min(bgMax, Math.max(bgMin, bgBrightness))

  return (
    <div className={css.group}>
      <div className={css.row}>
        <span className={css.rowLabel}>{t('aqua.title')}</span>
        <button type="button" role="switch" aria-label={t('aqua.title')}
          aria-checked={enabled} className={enabled ? css.toggleOn : css.toggle}
          onClick={() => { setEnabled(!enabled) }}>
          <span className={css.check}>{enabled && <CheckIcon />}</span>
          {enabled ? t('aqua.enable') : t('aqua.disable')}
        </button>
      </div>
      {enabled && <>
      {/* 模式 */}
      <div className={css.subGroup}>
        <div className={css.subTitle}>{t('aqua.mode')}</div>
        <div className={css.controls}>
          <div className={css.row}>
            <Segmented
              label={t('aqua.mode')}
              value={mode}
              options={[
                { id: 'mica', label: t('aqua.modeMica') },
                { id: 'compat', label: t('aqua.modeCompat') },
              ]}
              onSelect={setMode}
            />
          </div>
        </div>
      </div>

      {/* 玻璃材质：仅云母模式 */}
      {mode === 'mica' && (
        <div className={css.subGroup}>
          <div className={css.subTitle}>{t('aqua.materialGroup')}</div>
          <div className={css.controls}>
            <Knob label={t('aqua.blur')} value={blur} min={0} max={40} step={0.5} unit="px" onChange={setBlur} />
            <Knob label={t('aqua.frost')} value={frost} min={0} max={100} step={1} unit="%" onChange={setFrost} />
          </div>
        </div>
      )}

      {/* 背景 */}
      <div className={css.subGroup}>
        <div className={css.subTitle}>{t('aqua.background')}</div>
        <div className={css.controls}>
          <div className={css.row}>
            <Segmented
              label={t('aqua.background')}
              value={background}
              options={[
                { id: 'fluid', label: t('aqua.backgroundFluid') },
                { id: 'wallpaper', label: t('aqua.backgroundWallpaper') },
              ]}
              onSelect={setBackground}
            />
          </div>

          {background === 'fluid' && (
            <>
              <Knob label={t('aqua.fluidHue')} value={fluidHue} min={0} max={360} step={1} unit="°" onChange={setFluidHue} />
              <Knob label={t('aqua.fluidDepth')} value={fluidDepth} min={0} max={100} step={1} unit="%" onChange={setFluidDepth} />
            </>
          )}

          {background === 'wallpaper' && (
            <>
              <div className={css.groupHint}>{t('aqua.wallpaperHint')}</div>
              {SCHEMES.map((scheme) => (
                <WallpaperSlot
                  key={scheme}
                  scheme={scheme}
                  active={activeScheme === scheme}
                  value={wallpapers[scheme]}
                  label={t(scheme === 'light' ? 'aqua.wallpaperLight' : 'aqua.wallpaperDark')}
                  t={t}
                  setWallpaper={setWallpaper}
                  setBackground={setBackground}
                  setWallpaperBlur={setWallpaperBlur}
                  setWallpaperFrost={setWallpaperFrost}
                  setVideoBlur={setVideoBlur}
                  setVideoBrightness={setVideoBrightness}
                />
              ))}
            </>
          )}

          <Knob label={t('aqua.bgBrightness')} value={bgDisplay} min={bgMin} max={bgMax} step={1} unit="%" onChange={setBgBrightness} />
          <div className={css.knobHint}>
            {t(dark ? 'aqua.bgBrightnessHintDark' : 'aqua.bgBrightnessHintLight')}
          </div>
        </div>
      </div>

      {/* 装饰：环境装饰 */}
      <div className={css.subGroup}>
        <div className={css.subTitle}>{t('aqua.decorAmbient')}</div>
        <div className={css.controls}>
          <div className={css.row}>
            <span className={css.rowLabel}>{t('aqua.whale')}</span>
            <button
              type="button"
              className={whale ? css.toggleOn : css.toggle}
              aria-pressed={whale}
              onClick={() => { setWhale(!whale) }}
            >
              <span className={css.check}>
                {whale && <CheckIcon />}
              </span>
              {whale ? t('aqua.enable') : t('aqua.disable')}
            </button>
          </div>
          <div className={css.row}>
            <span className={css.rowLabel}>{t('aqua.critters')}</span>
            <button
              type="button"
              className={critters ? css.toggleOn : css.toggle}
              aria-pressed={critters}
              onClick={() => { setCritters(!critters) }}
            >
              <span className={css.check}>
                {critters && <CheckIcon />}
              </span>
              {critters ? t('aqua.enable') : t('aqua.disable')}
            </button>
          </div>
          <div className={css.row}>
            <span className={css.rowLabel}>{t('aqua.mesh')}</span>
            <button
              type="button"
              className={mesh ? css.toggleOn : css.toggle}
              aria-pressed={mesh}
              onClick={() => { setMesh(!mesh) }}
            >
              <span className={css.check}>
                {mesh && <CheckIcon />}
              </span>
              {mesh ? t('aqua.enable') : t('aqua.disable')}
            </button>
          </div>
        </div>
      </div>

      {/* 装饰：悬停效果（仅云母模式的漂浮玻璃） */}
      {mode === 'mica' && (
        <div className={css.subGroup}>
          <div className={css.subTitle}>{t('aqua.decorHover')}</div>
          <div className={css.controls}>
            <div className={css.row}>
              <span className={css.rowLabel}>{t('aqua.spotlight')}</span>
              <button
                type="button"
                className={spotlight ? css.toggleOn : css.toggle}
                aria-pressed={spotlight}
                onClick={() => { setSpotlight(!spotlight) }}
              >
                <span className={css.check}>
                  {spotlight && <CheckIcon />}
                </span>
                {spotlight ? t('aqua.enable') : t('aqua.disable')}
              </button>
            </div>
            <div className={css.row}>
              <span className={css.rowLabel}>{t('aqua.press')}</span>
              <button
                type="button"
                className={press ? css.toggleOn : css.toggle}
                aria-pressed={press}
                onClick={() => { setPress(!press) }}
              >
                <span className={css.check}>
                  {press && <CheckIcon />}
                </span>
                {press ? t('aqua.enable') : t('aqua.disable')}
              </button>
            </div>
          </div>
        </div>
      )}
      </>}
    </div>
  )
}

/** Props shared by the two per-scheme wallpaper blocks. */
interface WallpaperSlotProps {
  /** Which scheme this block edits. */
  scheme: AquaScheme
  /** This scheme is the one currently painting the page. */
  active: boolean
  /** Stored settings for this scheme's slot. */
  value: AquaWallpaperSettings
  /** Localized scheme name (also the group label). */
  label: string
  t: AquaAppearanceRowComponentProps['t']
  setWallpaper: AquaAppearanceRowInjected['setWallpaper']
  setBackground: AquaAppearanceRowInjected['setBackground']
  setWallpaperBlur: AquaAppearanceRowInjected['setWallpaperBlur']
  setWallpaperFrost: AquaAppearanceRowInjected['setWallpaperFrost']
  setVideoBlur: AquaAppearanceRowInjected['setVideoBlur']
  setVideoBrightness: AquaAppearanceRowInjected['setVideoBrightness']
}

/**
 * One scheme's wallpaper block: pickers, delete, and the knobs for that
 * scheme's media. The inactive scheme only stores values; switching the
 * system appearance swaps which slot paints the page.
 */
function WallpaperSlot(props: WallpaperSlotProps) {
  const { scheme, active, value, label, t, setWallpaper, setBackground } = props
  const fileRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLInputElement | null>(null)
  // Videos are `idb:` blobs, `fsa:` remembered-file handles, or legacy
  // `data:video/` URLs.
  const isVideo = value.image.startsWith('data:video/') || value.image.startsWith('idb:') || value.image.startsWith('fsa:')

  /** Keep the live backdrop on wallpaper only when this slot is on screen. */
  const reveal = (): void => {
    if (active) setBackground('wallpaper')
  }

  /** Pick a video. Chromium: File System Access — the browser remembers the
   *  file authorization, so later visits re-read the ORIGINAL file with no
   *  storage copy. Other browsers fall back to the plain file input. */
  const pickVideo = (): void => {
    if (window.showOpenFilePicker !== undefined) {
      void (async () => {
        try {
          const [handle] = await window.showOpenFilePicker({
            multiple: false,
            types: [{ description: 'Video', accept: { 'video/*': ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.mkv'] } }],
          })
          if (handle === undefined) return
          reveal()
          if (await saveVideoHandle(handle, scheme)) {
            setWallpaper(`fsa:${handle.name}`, scheme)
          } else {
            // idb unavailable — degrade to the blob store / data URL path.
            const file = await handle.getFile()
            void saveVideoBlob(file).then((id) => {
              if (id !== '') setWallpaper(id, scheme)
              else void readFileAsDataUrl(file).then((source) => { setWallpaper(source, scheme) })
            })
          }
        } catch (error) {
          // Electron or browser policy may expose the API but reject it for
          // this origin. A normal file input is still available in that case.
          if (error instanceof DOMException && error.name === 'AbortError') return
          videoRef.current?.click()
        }
      })()
    } else {
      videoRef.current?.click()
    }
  }

  return (
    <div
      className={active ? `${css.schemeBlock} ${css.schemeBlockActive}` : css.schemeBlock}
      role="group"
      aria-label={label}
    >
      <div className={css.row}>
        <span className={css.rowLabel}>{label}</span>
        <div className={css.wallpaperPick}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={css.fileInput}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file !== undefined) {
                reveal()
                void fileToDataUrl(file).then((source) => { setWallpaper(source, scheme) })
              }
              e.target.value = ''
            }}
          />
          <input
            ref={videoRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime"
            className={css.fileInput}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file !== undefined) {
                reveal()
                // ALWAYS persist videos in IndexedDB: even a small video's
                // data URL can blow the localStorage quota (base64 inflates
                // 33%), which would silently lose the wallpaper on the next
                // reload. Only when idb is unavailable do we fall back to the
                // data-URL path.
                void saveVideoBlob(file).then((id) => {
                  if (id !== '') {
                    setWallpaper(id, scheme)
                  } else {
                    void readFileAsDataUrl(file).then((source) => { setWallpaper(source, scheme) })
                  }
                })
              }
              e.target.value = ''
            }}
          />
          <button type="button" className={css.pickButton} onClick={() => { fileRef.current?.click() }}>
            {t('aqua.chooseImage')}
          </button>
          <button type="button" className={css.pickButton} onClick={pickVideo}>
            {t('aqua.chooseVideo')}
          </button>
          {value.image !== '' && (
            <button
              type="button"
              className={css.deleteButton}
              onClick={() => {
                setWallpaper('', scheme)
                if (active) setBackground('fluid')
              }}
            >
              {t('aqua.deleteWallpaper')}
            </button>
          )}
          {active && <span className={css.activeBadge}>{t('aqua.wallpaperActive')}</span>}
        </div>
      </div>
      {value.image === '' && <div className={css.knobHint}>{t('aqua.wallpaperEmpty')}</div>}
      {/* 图片壁纸：模糊 + 磨砂；视频不适用（视频直接清晰播放） */}
      {value.image !== '' && !isVideo && (
        <>
          <Knob label={t('aqua.wallpaperBlur')} value={value.blur} min={0} max={40} step={0.5} unit="px"
            onChange={(next) => { props.setWallpaperBlur(next, scheme) }} />
          <Knob label={t('aqua.wallpaperFrost')} value={value.frost} min={0} max={100} step={1} unit="%"
            onChange={(next) => { props.setWallpaperFrost(next, scheme) }} />
        </>
      )}
      {/* 视频壁纸：模糊度 + 亮度，配上提醒 */}
      {isVideo && (
        <>
          <Knob label={t('aqua.videoBlur')} value={value.videoBlur} min={0} max={40} step={0.5} unit="px"
            onChange={(next) => { props.setVideoBlur(next, scheme) }} />
          <Knob label={t('aqua.videoBrightness')} value={value.videoBrightness} min={0} max={100} step={1} unit="%"
            onChange={(next) => { props.setVideoBrightness(next, scheme) }} />
          <div className={css.knobHint}>{t('aqua.videoHint')}</div>
        </>
      )}
    </div>
  )
}

/** Local icon avoids relying on a removed host icon export. */
function CheckIcon() {
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3.5 8l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}
