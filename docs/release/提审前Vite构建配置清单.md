# 《秦灭六国》提审前 Vite 构建配置清单

> 用途：把当前 Web Demo 调整为可上传到微信/抖音小游戏的提审版本。
> 原则：浏览器 Demo 继续保留供 PC 用户体验，提审版作为独立构建产物。
> 关键节点：必须在软著证书下发后、平台提交前完成。

---

## 一、当前阻塞点（Web Demo 不能直接作为小游戏包）

| 类别 | 当前实现 | 提审版要求 | 阻塞等级 |
|------|---------|-----------|---------|
| 渲染层 | ReactDOM + DOM + Tailwind | Canvas / 引擎 UI | 🔴 阻塞 |
| 路由 | `react-router-dom` BrowserRouter | 平台原生跳转 | 🔴 阻塞 |
| 音频 | `new Audio()` | `wx.createInnerAudioContext` / `tt.createInnerAudioContext` | 🔴 阻塞 |
| 存储 | `localStorage` | `wx.setStorageSync` / `tt.setStorageSync` | 🔴 阻塞 |
| 资源 | 外部 CDN `stats.puck-muling.top` | 包内资源或白名单域名 | 🔴 阻塞 |
| 外链 | 微信/Telegram/B站/机核 | 全部移除 | 🟡 中 |
| 调试入口 | URL 参数预览页 | 关闭 | 🟡 中 |
| 二维码 | `wechat-qr.png` / `telegram-qr.png` | 删除 | 🟢 低 |
| `SOCIAL_READY` | `true` | `false` | 🟢 低 |

---

## 二、提审版 Vite 构建配置清单

### 1. 创建独立的提审版入口

```
src/
├── main.tsx              # 浏览器版入口（保留）
├── main.minigame.tsx     # 小游戏版入口（新增）
```

**作用**：保留浏览器版供 PC 用户体验，独立的小游戏版用于上传。

### 2. 创建 `vite.config.minigame.ts`

```typescript
// vite.config.minigame.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-minigame',
    rollupOptions: {
      input: {
        main: 'src/main.minigame.tsx',
      },
    },
  },
  define: {
    'process.env.MINIGAME_BUILD': 'true',
  },
});
```

### 3. 平台代码差异（条件编译）

```typescript
// src/platform.ts
export const isMiniGame = process.env.MINIGAME_BUILD === 'true';

export const Platform = {
  Storage: isMiniGame ? require('./platform/storage.wx') : require('./platform/storage.web'),
  Audio: isMiniGame ? require('./platform/audio.wx') : require('./platform/audio.web'),
  Router: isMiniGame ? require('./platform/router.wx') : require('./platform/router.web'),
};
```

### 4. 存储适配器（wx / tt / web 三套）

```typescript
// src/platform/storage.web.ts
export const storage = {
  get: (key: string) => localStorage.getItem(key),
  set: (key: string, value: string) => localStorage.setItem(key, value),
  remove: (key: string) => localStorage.removeItem(key),
};

// src/platform/storage.wx.ts（微信 + 抖音通用）
export const storage = {
  get: (key: string) => wx.getStorageSync(key),
  set: (key: string, value: string) => wx.setStorageSync(key, value),
  remove: (key: string) => wx.removeStorageSync(key),
};
```

### 5. 音频适配器

```typescript
// src/platform/audio.wx.ts
export function createAudio(src: string) {
  const audio = wx.createInnerAudioContext();
  audio.src = src;
  return {
    play: () => audio.play(),
    pause: () => audio.pause(),
    stop: () => audio.stop(),
    onEnded: (cb: () => void) => (audio.onEnded(cb)),
  };
}
```

### 6. 移除 URL 参数预览页

```typescript
// src/main.minigame.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 提审版禁用所有 URL 参数预览
const PREVIEW_PARAMS = ['ui-preview', 'task-c-preview', 'stage'];
const url = new URL(window.location.href);
const hasPreviewParam = PREVIEW_PARAMS.some(p => url.searchParams.has(p));
if (hasPreviewParam) {
  throw new Error('Preview mode is disabled in mini-game build');
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

### 7. 关闭社交外链

```typescript
// src/lib/social.ts
export const SOCIAL_READY = false; // 提审版必须为 false
```

### 8. 移除二维码与外链

```typescript
// src/App.tsx
const EXTERNAL_LINKS = ['wechat-qr', 'telegram-qr', 'bilibili', 'gcores'];
if (process.env.MINIGAME_BUILD === 'true') {
  // 提审版：移除所有外链
  Object.keys(SOCIAL_LINKS).forEach(k => {
    if (EXTERNAL_LINKS.includes(k)) {
      delete SOCIAL_LINKS[k];
    }
  });
}
```

### 9. 资源策略

```typescript
// src/lib/cdn.ts
export const MEDIA_CDN = process.env.MINIGAME_BUILD === 'true'
  ? ''  // 提审版使用包内资源
  : 'https://stats.puck-muling.top/game/';
```

```typescript
// src/lib/preload.ts
const BATTLE_SPRITES = process.env.MINIGAME_BUILD === 'true'
  ? []  // 提审版由小游戏运行时管理
  : [
      'hero_beimang_idle_v1',
      // ...
    ];
```

---

## 三、提审版资源打包方案

### 1. 资源清单

| 类别 | 数量 | 总大小 | 打包策略 |
|------|------|--------|---------|
| 关键背景图 | 5 张 | ~5MB | 首包 |
| 战斗 Sprite | 11 张 | ~3MB | 首包 |
| 配音 TTS | 120+ | ~50MB | 远程加载（小游戏云开发） |
| BGM | 3 轨 | ~10MB | 分包 |
| 音效 | 16 个 | ~3MB | 首包 |
| SVG/UI | 5 个 | <1MB | 首包 |

### 2. 微信小游戏资源限制

- **首包限制**：4MB（主包 + 资源）
- **总包限制**：200MB
- **远程加载**：需配置白名单域名

### 3. 抖音小游戏资源限制

- **首包限制**：4MB
- **总包限制**：200MB
- **远程加载**：需配置云存储

---

## 四、构建命令

```bash
# 浏览器版（保留）
npm run build

# 提审版（新增）
npm run build:minigame

# 双平台验证
npm run verify:minigame
```

在 `package.json` 中新增：

```json
{
  "scripts": {
    "build:minigame": "tsc -b && vite build --config vite.config.minigame.ts && node scripts/post-minigame-clean.mjs",
    "verify:minigame": "node scripts/verify-minigame.mjs"
  }
}
```

---

## 五、提审版清理脚本（新增 `scripts/post-minigame-clean.mjs`）

```javascript
// scripts/post-minigame-clean.mjs
import { rm, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const distMinigame = path.resolve('dist-minigame');

// 删除社交二维码
const qrFiles = ['wechat-qr.png', 'telegram-qr.png'];
for (const f of qrFiles) {
  try {
    await rm(path.join(distMinigame, 'assets', f));
    console.log(`Removed: ${f}`);
  } catch {}
}

// 删除 AI 评审过程目录
const reviewDirs = ['review', 'unused'];
for (const d of reviewDirs) {
  try {
    await rm(path.join(distMinigame, 'assets', d), { recursive: true });
    console.log(`Removed: ${d}/`);
  } catch {}
}

// 删除本地 Font 与第三方调试工具
const debugFiles = ['sourcemaps', '.map'];
await rm(path.join(distMinigame, 'sourcemaps'), { recursive: true, force: true });

console.log('Mini-game build cleaned');
```

---

## 六、提审前 npm 脚本核对

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build && node scripts/post-build-clean.mjs",
    "build:minigame": "tsc -b && vite build --config vite.config.minigame.ts && node scripts/post-minigame-clean.mjs",
    "lint": "eslint .",
    "test": "node scripts/verify-demo.mjs",
    "test:minigame": "node scripts/verify-minigame.mjs",
    "check": "npm run test && npm run lint && npm run build",
    "preview": "vite preview",
    "soft-copyright:source": "node scripts/build-soft-copyright-source.mjs",
    "soft-copyright:doc": "node scripts/build-soft-copyright-doc.mjs",
    "soft-copyright": "npm run soft-copyright:source && npm run soft-copyright:doc"
  }
}
```

---

## 七、提审前自检清单

### 1. 代码层

- [ ] 所有 `new Audio()` 替换为 `createAudio()`
- [ ] 所有 `localStorage` 替换为 `storage.get/set/remove`
- [ ] 所有 `document` / `window` / `Image` 移除或通过 Adapter 替代
- [ ] `react-router-dom` BrowserRouter 移除
- [ ] `process.env.MINIGAME_BUILD === 'true'` 在所有平台相关代码中正确判断

### 2. 资源层

- [ ] 媒体资源改为包内资源或白名单域名
- [ ] `public/assets/wechat-qr.png` 已删除
- [ ] `public/assets/telegram-qr.png` 已删除
- [ ] `public/assets/review/` 已删除
- [ ] `public/assets/unused/` 已删除

### 3. UI 层

- [ ] `SOCIAL_READY = false`
- [ ] 标题页社交按钮已隐藏
- [ ] 反馈入口已关闭
- [ ] 健康游戏忠告已展示
- [ ] 适龄提示已展示

### 4. 调试层

- [ ] URL 参数预览页（ui-preview、task-c-preview、stage=）已禁用
- [ ] 浏览器控制台日志已脱敏
- [ ] 错误堆栈已隐藏
- [ ] source map 已删除

### 5. 元数据层

- [ ] `index.html` 中 `og:image`、`twitter:image` 指向提审版主视觉
- [ ] `index.html` 中 `umami` 统计已移除（如有）
- [ ] `index.html` 中 `itch.io iframe` 已移除
- [ ] `index.html` 中标题改为「秦灭六国」（去 Demo 后缀）

### 6. 提审包验证

- [ ] `npm run build:minigame` 成功
- [ ] `dist-minigame/` 大小 < 4MB（首包）/ < 200MB（总包）
- [ ] 提审包导入微信开发者工具可正常运行
- [ ] 提审包导入抖音开发者工具可正常运行
- [ ] 首次启动、弱网、切后台、返回均能正常进入
- [ ] 移动端首次用户交互后音频正常播放
- [ ] 存档、读档、重置、战前回卷均可正常使用

---

## 八、提审包目录结构（最终）

```
dist-minigame/
├── assets/                # 提审版资源（不含 QR、不含 review）
│   ├── bg_*.webp
│   ├── npc_*.webp
│   ├── portrait_*.png
│   ├── battle/
│   ├── avatar_*.webp
│   ├── shot_*.webp
│   ├── seal_qin.svg
│   ├── title_keyart.webp
│   ├── bgm/
│   ├── sfx/
│   └── voice/
├── game.js               # 提审版主入口
├── game.json             # 微信/抖音小游戏配置
├── project.config.json   # 微信小游戏项目配置
├── manifest.json         # 抖音小游戏项目配置
└── privacy.txt           # 隐私政策嵌入文件
```

---

## 九、与现有材料的协同

| 现有材料 | 协同方式 |
|----------|---------|
| `scripts/post-build-clean.mjs` | 浏览器版清理，**保留不变** |
| `scripts/verify-demo.mjs` | 浏览器版验证，**保留不变** |
| `scripts/build-soft-copyright-*.mjs` | 软著材料生成，**保留不变** |
| `package.json` | **新增** `build:minigame` 脚本 |

---

## 十、推荐执行顺序

1. **第 1 天**：创建 `vite.config.minigame.ts` + `src/main.minigame.tsx`
2. **第 2 天**：实现 `src/platform/storage.{web,wx}.ts` 适配器
3. **第 3 天**：实现 `src/platform/audio.{web,wx}.ts` 适配器
4. **第 4–5 天**：把 React DOM 战斗/剧情/UI 重做为 Canvas 渲染或引擎 UI
5. **第 6 天**：关闭 URL 参数预览、社交外链、二维码
6. **第 7 天**：编写 `scripts/post-minigame-clean.mjs` 与 `scripts/verify-minigame.mjs`
7. **第 8 天**：在微信开发者工具 + 抖音开发者工具中导入测试
8. **第 9–10 天**：真机测试、修复 bug、提交审核

**总预估**：10 个工作日（单人开发，假设对 Canvas/小游戏运行时熟悉）
