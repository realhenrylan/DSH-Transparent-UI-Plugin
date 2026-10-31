# Aqua Glass Henry

English | [中文](README.zh.md)

Version **1.4.2**, adapted for DSH 0.2.1-rc.5 from [WYH66666666's Aqua v1.3.0](https://github.com/WYH66666666/DSH-Transparent-UI-Plugin). The historical screenshots below show the original version; layout details can change with DSH.


Aqua is a highly customizable glassmorphism theme for the DeepSeek Harness web UI. The header, sidebar, composer, stats line, and trajectory view all become panes of frosted glass. you can put video for wallpaper and Switch it off and the stock UI comes back exactly, with no source changes to DSH itself.

![](assets/1.png)

![](assets/2.png)

![](assets/3.png)

![](assets/4.png)

## Features

- **Two modes**: **Mica** restyles the layout into floating glass cards (blur and frost adjustable), while **Compatibility Mode** keeps the stock layout byte-for-byte and only swaps the material to generic glass — other plugins' UI gets the same treatment automatically
- **Free backdrop**: a living fluid board (hue adjustable) or your own wallpaper (fills the page, aspect preserved, with its own blur and frost); light wallpapers look best in light mode, dark wallpapers in dark mode
- **Background brightness**: follows the resolved scheme — dark mode darkens (0–50), light mode brightens (50–100), 50 is unchanged
- **Particle whale**: the deepseek.com/harness centerpiece fish (a 2D port of the site's particle engine), centered in the chat area right of the sidebar — white particles on dark, gray on light, toggleable in settings
- **Glossy "Harness" badge**: in dark mode the sidebar wordmark wears the official nameplate pill (135° gradient ring + soft glow); light mode keeps the stock plate
- **Edge fades**: 5px gradient blur bands pinned to the top and bottom of the page, above the chat content — scrolling content melts into the edges; faint white veil on light, faint black on dark
- One switch: off restores the stock UI exactly, and every effect is removed with the plugin

## Installation

In DSH Desktop, open **Plugin management → Add plugin** and enter:

```text
github:realhenrylan/DSH-Transparent-UI-Plugin#main
```

Restart DSH Desktop after installation. The package is named `dsh-aqua-glass-henry`; install it using the GitHub address above, since it is not published to npm. If an older Aqua package is already installed in the same profile, remove it first to avoid activating two themes.

Alternatively, use the terminal opened from the DSH Desktop tray:

```sh
dsh plugin --profile desktop add github:realhenrylan/DSH-Transparent-UI-Plugin#main
```

For Web, replace `desktop` with `web`. This version declares compatibility with **DSH 0.2.1-rc.5** only.

## Usage

The master switch and controls are near **Settings → General → Appearance**. The master switch remains visible when the theme is off.

## Development

With Node.js 24, run `npm install`, `npm run build`, `npm run lint`, and `npm test` in the repository. Built files in `lib/` are committed so GitHub installation does not require a build on the user's machine.

## License

This project retains the original repository's [AGPL-3.0 license](LICENSE).
