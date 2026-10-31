# Aqua Glass Henry

[English](README.md) | 中文

基于 [WYH66666666 的 Aqua v1.3.0](https://github.com/WYH66666666/DSH-Transparent-UI-Plugin) 适配 DSH 0.2.1-rc.5。仓库中的历史截图来自原版，界面细节可能随 DSH 版本变化。

Aqua 是一层高自由度的玻璃质感主题，套在 DeepSeek Harness 网页端。顶栏、侧边栏、输入框、统计行、轨迹视图都成了磨砂玻璃片,你还可以添加视频和图片作为背景。关掉开关就回到原生界面，不改 DSH 任何一行源码。

![](assets/1.png)

![](assets/2.png)

![](assets/3.png)

![](assets/4.png)

## 特性

- **双模式**：**云母效果**把布局改成悬浮玻璃卡片（模糊度、磨砂度可调）；**兼容模式**保持原版排版一字不动，只把材质换成通用玻璃，其他插件的界面也会自动玻璃化
- **背景自由**：流体板（颜色可调）或自定义壁纸（铺满页面、比例不变，可单独调模糊度/磨砂度）；浅色壁纸配浅色模式、深色壁纸配深色模式观感更佳
- **背景亮度**：自动跟随深浅模式——深色模式 0–50 压暗、浅色模式 50–100 提亮，50 原样
- **粒子鲸鱼**：deepseek.com/harness 同款粒子鱼（官网粒子引擎移植），显示在聊天区域正中央（不含侧边栏），深色模式白粒子、浅色模式灰粒子，设置里可开关
- **Harness 光泽铭牌**：深色模式下侧边栏铭牌换成官网同款「Harness」药丸（135° 渐变描边 + 柔光），浅色模式保持原版铭牌
- **边缘渐变模糊**：页面顶部/底部各 5px 渐变模糊带，悬浮在聊天内容上层，内容滚到边缘渐入模糊；浅色微泛白、深色微泛黑
- 一键开关：关闭即完全还原原生界面，所有效果随插件卸载一并消失

## 安装

在 DSH Desktop 的**插件管理 → 添加插件**中，输入：

```text
github:realhenrylan/DSH-Transparent-UI-Plugin#main
```

安装后重启 DSH Desktop。这个版本的包名是 `dsh-aqua-glass-henry`；安装来源是上面的 GitHub 地址，目前不能仅用包名从 npm 安装。若同一配置中已经安装旧版 Aqua，请先卸载旧版，以免两个主题同时生效。

也可以在 DSH Desktop 托盘打开的终端中运行：

```sh
dsh plugin --profile desktop add github:realhenrylan/DSH-Transparent-UI-Plugin#main
```

Web 版将 `desktop` 改为 `web`。本版本仅声明兼容 DSH **0.2.1-rc.5**；其他版本需要先完成适配。

## 使用

总开关和调节项都位于 **设置 → 通用设置 → 外观** 附近。主题关闭时，总开关仍然显示，可以重新开启。

## 开发

使用 Node.js 24，在仓库目录执行 `npm install`、`npm run build`、`npm run lint` 和 `npm test`。`lib/` 中的构建结果随仓库提供，GitHub 安装不需要在用户机器上编译。

## 许可

本项目继承原仓库的 [AGPL-3.0 许可](LICENSE)。
