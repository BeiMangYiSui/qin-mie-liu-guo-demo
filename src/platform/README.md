# `src/platform/` 平台适配器骨架说明

> 用途：把浏览器 DOM/HTML5 API 封装为统一的 `storage` / `createAudio` 接口，
>      提审版小游戏只需替换适配器实现，业务代码 0 修改。

---

## 文件清单

| 文件 | 用途 | 何时使用 |
|------|------|---------|
| `storage.web.ts` | 浏览器版存储（localStorage） | 当前 Web Demo |
| `storage.wx.ts` | 微信小游戏存储（wx.getStorageSync） | 微信小游戏提审版 |
| `storage.tt.ts` | 抖音小游戏存储（tt.getStorageSync） | 抖音小游戏提审版 |
| `audio.web.ts` | 浏览器版音频（HTMLAudioElement） | 当前 Web Demo |
| `audio.wx.ts` | 微信小游戏音频（wx.createInnerAudioContext） | 微信小游戏提审版 |
| `audio.tt.ts` | 抖音小游戏音频（tt.createInnerAudioContext） | 抖音小游戏提审版 |
| `index.web.ts` | 浏览器版统一入口 | 当前 Web Demo |
| `index.wx.ts` | 微信小游戏统一入口 | 微信小游戏提审版 |
| `index.tt.ts` | 抖音小游戏统一入口 | 抖音小游戏提审版 |

---

## 统一接口

### Storage（存储）

```typescript
interface Storage {
  get(key: string): string | null
  set(key: string, value: string): void
  remove(key: string): void
  keys(): string[]
  clear(): void
}
```

所有存储操作自动添加 `qmlg:` 前缀，避免与平台其他 key 冲突。

### Audio（音频）

```typescript
interface AudioHandle {
  play(): void
  pause(): void
  stop(): void
  destroy(): void
  setVolume(v: number): void  // 0~1
  onEnded(cb: () => void): void
  onError(cb: (err: Error) => void): void
}

function createAudio(
  src: string,
  options?: { autoplay?: boolean; loop?: boolean },
): AudioHandle

function unlockAudio(): void  // 移动端首次用户交互后调用
```

---

## 在业务代码中使用

### 1. 浏览器版（当前 Web Demo）

```typescript
// src/some-feature.ts
import { storage, createAudio, unlockAudio } from '../platform/index.web'

// 读取存档
const data = storage.get('save:0')
if (data) {
  const save = JSON.parse(data)
  // ...
}

// 写入存档
storage.set('save:0', JSON.stringify({ ... }))

// 播放配音
const audio = createAudio('voice/s1_anfa/01.mp3', { autoplay: false })
audio.play()

// 移动端首次用户交互解锁音频
button.onclick = () => {
  unlockAudio()
  audio.play()
}
```

### 2. 微信小游戏版（提审版）

```typescript
// src/some-feature.ts
import { storage, createAudio, unlockAudio } from '../platform/index.wx'

// 接口完全一样，调用方式不变
```

### 3. 抖音小游戏版（提审版）

```typescript
// src/some-feature.ts
import { storage, createAudio, unlockAudio } from '../platform/index.tt'
```

---

## Vite alias 配置

为了避免在每个文件中手动改 import 路径，建议在 `vite.config.ts` 中配置 alias：

```typescript
// vite.config.ts（浏览器版）
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/platform': path.resolve(__dirname, 'src/platform/index.web'),
    },
  },
})
```

```typescript
// vite.config.minigame.ts（微信小游戏版）
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/platform': path.resolve(__dirname, 'src/platform/index.wx'),
    },
  },
  build: {
    outDir: 'dist-minigame',
    rollupOptions: {
      input: { main: 'src/main.minigame.tsx' },
    },
  },
})
```

```typescript
// vite.config.minigame.douyin.ts（抖音小游戏版）
export default defineConfig({
  // 同上但 alias 指向 index.tt
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/platform': path.resolve(__dirname, 'src/platform/index.tt'),
    },
  },
})
```

然后业务代码统一使用：

```typescript
import { storage, createAudio, unlockAudio } from '@/platform'
```

构建时 Vite 会自动替换为对应平台的实现。

---

## 接入到现有代码

### 替换方案 A：直接修改现有文件

`src/game/save.ts` 中所有 `localStorage` 替换为 `storage`：

```typescript
// 改前
const data = localStorage.getItem('qmlg:save:0')

// 改后
import { storage } from '../platform'
const data = storage.get('save:0')
```

`src/game/audio.ts` 中所有 `new Audio()` 替换为 `createAudio()`：

```typescript
// 改前
const audio = new Audio(src)
audio.play()

// 改后
import { createAudio } from '../platform'
const audio = createAudio(src, { autoplay: true })
```

### 替换方案 B：保留现有文件，新增 adapter 包装层

```typescript
// src/game/save.ts（保留）
import { storage } from '../platform'

export function readSave(slot: number) {
  const data = storage.get(`save:${slot}`)
  // ... 业务逻辑不变
}
```

推荐方案 B，侵入性最小。

---

## 双平台兼容最佳实践

### 1. 抽象所有浏览器 API

```typescript
// ❌ 避免：直接使用浏览器 API
import { useEffect } from 'react'
useEffect(() => {
  const timer = setTimeout(...)
  return () => clearTimeout(timer)
}, [])

// ✅ 推荐：使用适配器
import { setTimeout as platformSetTimeout } from '../platform/timer.web'
```

### 2. 抽象所有 DOM 操作

```typescript
// ❌ 避免：直接操作 DOM
document.getElementById('game-canvas').width = 750

// ✅ 推荐：使用 Canvas 渲染层
const canvas = new CanvasRenderer()
canvas.resize(750, 1334)
```

### 3. 抽象所有图片加载

```typescript
// ❌ 避免：使用 new Image()
const img = new Image()
img.src = 'bg_xinzheng.webp'
img.onload = () => { ... }

// ✅ 推荐：使用适配器
import { loadImage } from '../platform/image'
const img = await loadImage('bg_xinzheng.webp')
```

> `src/platform/image.web.ts` 和 `image.wx.ts` 待补（本期未生成）

### 4. 抽象所有路由跳转

```typescript
// ❌ 避免：使用 react-router-dom
import { useNavigate } from 'react-router-dom'
const navigate = useNavigate()
navigate('/story')

// ✅ 推荐：使用适配器
import { navigate } from '../platform/router'
navigate('story')
```

> `src/platform/router.web.ts` 和 `router.wx.ts` 待补（本期未生成）

---

## 验证清单

- [ ] 浏览器版构建：`npm run build` 成功
- [ ] 微信小游戏版构建：`npm run build:minigame` 成功
- [ ] 抖音小游戏版构建：`npm run build:minigame:douyin` 成功
- [ ] 业务代码（story / battle / save）使用 `storage` 而非 `localStorage`
- [ ] 业务代码（audio / audio 组件）使用 `createAudio` 而非 `new Audio`
- [ ] 移动端首次用户交互后音频正常播放
- [ ] 存档读写功能在三个平台都正常

---

## 注意事项

1. **不要在适配器中包含业务逻辑**：适配器只做 API 翻译，业务逻辑应由 `src/game/*.ts` 处理
2. **不要在适配器中引入浏览器专属 API**：如 `window`、`document`，避免循环依赖
3. **不要在适配器中硬编码路径**：所有路径由调用方传入
4. **保证两类 API 完全一致**：web 版和 wx/tt 版的接口必须 100% 相同，否则业务代码需要 if/else 分支
5. **错误处理要静默**：微信/抖音小游戏运行环境中部分 API 失败是常态，不要直接 throw

---

## 后续补充

待补的适配器（按优先级）：

- [ ] `src/platform/image.{web,wx,tt}.ts` — 图片加载
- [ ] `src/platform/router.{web,wx,tt}.ts` — 路由跳转
- [ ] `src/platform/share.{web,wx,tt}.ts` — 分享功能
- [ ] `src/platform/analytics.{web,wx,tt}.ts` — 统计上报
- [ ] `src/platform/ad.{web,wx,tt}.ts` — 广告（暂不接入）
- [ ] `src/platform/payment.{web,wx,tt}.ts` — 支付（暂不接入）
