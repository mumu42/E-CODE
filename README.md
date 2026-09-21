# English Agent

AI 英语学习 Web Agent，本地优先、完全私人。

## 语音功能检测

English Agent 在首次使用时会自动检测浏览器的语音功能支持情况：

- **语音识别**：用于口语练习中的语音输入功能
- **语音合成（TTS）**：用于 AI 对话中的语音播放
- **麦克风输入**：用于录音和语音识别

### 检测机制

1. **自动检测**：首次进入应用时自动检测，结果缓存到本地存储
2. **强制检测**：如果检测未完成，访问需要语音功能的页面会自动跳转到检测页面
3. **手动修改**：用户可在设置页面手动修改检测结果（谨慎操作）
4. **检测缓存**：检测结果会永久缓存，避免重复检测

### 手动修改检测结果

在设置页面可以手动修改语音功能检测结果，但请注意：
- 强制启用浏览器不支持的功能可能导致功能异常
- 某些功能需要 HTTPS 环境才能正常工作
- 修改后的结果会覆盖原始检测结果

## 本地开发

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

## 构建

```bash
npm run build
```

## 移动端 / Capacitor

项目使用 [Capacitor](https://capacitorjs.com/) 打包为 iOS / Android 应用。
我们选择**服务端渲染 + WebView 热加载**方案：Capacitor WebView 加载一个运行中的 Next.js 服务地址，因此 AI API 路由无需改为静态导出。

### 前置条件

- Android Studio（Android）或 Xcode（iOS）
- 真机或模拟器与开发机在同一局域网

### 1. 添加原生平台（首次）

```bash
npx cap add android
npx cap add ios
```

`android/`、`ios/` 目录已加入 `.gitignore`，默认不提交。

### 2. 启动开发服务并打开原生工程

```bash
# Android
npm run cap:dev:android

# iOS
npm run cap:dev:ios
```

这些命令会自动获取本机局域网 IP 并设置 `CAPACITOR_SERVER_URL`，然后在 Android Studio / Xcode 中打开原生工程。点击运行即可在真机/模拟器中加载开发服务器。

### 3. 直接运行到设备

```bash
# Android
npm run cap:run:android

# iOS
npm run cap:run:ios
```

### 自定义服务地址

如果你需要将 Capacitor 指向固定的后端地址（例如生产部署地址），设置环境变量：

```bash
CAPACITOR_SERVER_URL=https://your-domain.com npx cap sync
```

> 注意：生产环境请使用 HTTPS，并移除 `capacitor.config.ts` 中的 `allowMixedContent`/`cleartext` 调试配置。

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产包 |
| `npm run lint` | 运行 ESLint |
| `npm run cap:sync` | 同步 Capacitor 配置与插件到原生项目 |
| `npm run cap:open:android` | 在 Android Studio 中打开工程 |
| `npm run cap:open:ios` | 在 Xcode 中打开工程 |

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand
- Capacitor
- Web Speech API / Web Push
