---
name: voice-detection-feature
description: 浏览器语音功能检测机制实现
metadata:
  type: project
---

## 浏览器语音功能检测机制

### 需求背景
- 确保用户在使用语音功能前，浏览器已检测支持情况
- 检测结果需要缓存，避免重复检测
- 用户可以手动修改检测结果
- 未检测时自动跳转到检测页面

### 实现方案

#### 1. 核心组件
- **BrowserCapabilitiesInitializer**: 应用启动时自动检测，结果缓存到 localStorage
- **BrowserCapabilitiesChecker**: 显示检测结果，支持重新检测
- **WithVoiceCheck**: HOC 组件，为需要语音功能的页面添加拦截逻辑
- **VoiceCapabilitiesSettings**: 允许用户手动修改检测结果

#### 2. 检测流程
1. 应用启动 → BrowserCapabilitiesInitializer 自动检测
2. 访问需要语音的页面 → WithVoiceCheck 拦截
3. 无检测结果 → 跳转到 /voice-check 页面
4. 完成检测 → 正常使用功能

#### 3. 缓存机制
- 使用 localStorage 缓存检测结果
- 缓存 key: `ea-browser-capabilities`
- 包含检测时间戳，支持结果更新

#### 4. 手动修改
- 设置页面提供修改选项
- 修改时会显示警告提示
- 保存后更新缓存和 store

### 关键文件
- `lib/utils/browser-capabilities.ts`: 检测逻辑和缓存管理
- `components/withVoiceCheck.tsx`: 拦截 HOC 组件
- `app/voice-check/page.tsx`: 检测页面
- `components/VoiceCapabilitiesSettings.tsx`: 手动修改设置

### 注意事项
- 语音识别需要 HTTPS 环境
- 某些浏览器可能不支持特定功能
- 手动强制启用可能导致异常

**Why**: 确保用户在使用语音功能前了解浏览器支持情况，避免功能不可用带来的困惑。
**How to apply**: 所有需要语音功能的页面使用 WithVoiceCheck 包装，确保检测流程完整性。