# 《秦灭六国》小游戏 Canvas 迁移技术方案选型对比

> 用途：选择最合适的迁移方案，把 Web Demo 改造为可上传到微信/抖音的小游戏包。
> 决策时间：建议在软著申请启动 1 周内完成方案选择。
> 决策原则：单人开发、剧情叙事为核心、回合制战斗为辅、必须双平台兼容。

---

## 一、决策要素

| 要素 | 本项目情况 |
|------|-----------|
| 团队规模 | 1 人（个人开发者） |
| 核心玩法 | 剧情叙事 + 轻量回合制战斗 |
| 性能要求 | 中等（无 3D、无粒子特效） |
| 资源总量 | 73MB（图片 50MB + 配音 50MB + BGM 10MB + 音效 3MB） |
| 双平台适配 | 微信 + 抖音必须并行 |
| 开发成本 | 单人能独立完成 |
| 上线时间 | 越快越好 |

---

## 二、方案对比

### 方案 A：保留 React，重做 UI 层

**核心思路**：
- 保留 `src/game/*.ts` 纯逻辑（story / battle / scenarios / save 等）
- 把 `src/sections/*.tsx`、`src/ui/*.tsx` 中的 DOM UI 重做为 **Canvas 渲染**
- 使用现有的 React 状态管理 + Canvas 渲染器

**技术栈**：
- React 19（保留）
- TypeScript（保留）
- Canvas API（新增）
- 平台 Adapter（wx / tt）

**优点**：
- ✅ 业务逻辑 100% 复用，无需重写
- ✅ 状态管理（useState / useReducer）保持不变
- ✅ 单人开发可控，工期较短
- ✅ 双平台适配只需写两套 Adapter

**缺点**：
- ⚠️ 需要自研 Canvas UI 框架（按钮、滚动、布局）
- ⚠️ 文本渲染、双向布局需要手写
- ⚠️ 性能可能不如引擎

**预计工期**：2–3 周

**双平台难度**：低（写两套 Adapter）

**推荐度**：⭐⭐⭐⭐（本项目首选）

---

### 方案 B：迁移到 Cocos Creator

**核心思路**：
- 把 `src/game/*.ts` 纯逻辑迁移到 Cocos Creator（TypeScript）
- UI 由 Cocos Creator 场景编辑器搭建
- 一键发布到微信/抖音

**技术栈**：
- Cocos Creator 3.x
- TypeScript（与现有代码相似）
- Cocos 场景编辑器

**优点**：
- ✅ 微信/抖音官方支持
- ✅ 内置 UI 框架、动画系统、粒子系统
- ✅ 一键发布双平台
- ✅ 社区资源丰富

**缺点**：
- ⚠️ Cocos 学习曲线（虽然简单）
- ⚠️ 业务逻辑需改写为 Cocos 组件生命周期
- ⚠️ 现有 React 组件代码 100% 不可复用
- ⚠️ 调试流程较慢（需在 Creator + 模拟器中切换）

**预计工期**：3–4 周

**双平台难度**：低（一键发布）

**推荐度**：⭐⭐⭐（适合从零开始的项目）

---

### 方案 C：迁移到 LayaAir

**核心思路**：
- 类似 Cocos Creator，把游戏代码迁移到 LayaAir
- UI 由 LayaAir IDE 搭建
- 一键发布到微信/抖音

**技术栈**：
- LayaAir 3.x
- TypeScript / JavaScript

**优点**：
- ✅ 微信/抖音官方支持
- ✅ 内置 UI 框架、动画系统
- ✅ 体积小（适合低端机）

**缺点**：
- ⚠️ 商业版授权（个人开发者可免费）
- ⚠️ 社区资源相对较少
- ⚠️ 业务逻辑需重写

**预计工期**：3–4 周

**双平台难度**：低

**推荐度**：⭐⭐（备选）

---

### 方案 D：迁移到 Egret

**核心思路**：
- 类似 Cocos，但偏向 Web 游戏
- UI 由 Egret EUI 搭建

**优点**：
- ✅ 微信/抖音支持
- ✅ 中文文档友好

**缺点**：
- ❌ Egret 维护节奏放缓
- ❌ 社区活跃度下降
- ⚠️ 新项目建议不选

**预计工期**：3–4 周

**双平台难度**：中

**推荐度**：⭐（不推荐）

---

### 方案 E：完全重写（原生微信 + 抖音）

**核心思路**：
- 在微信开发者工具中用原生 API 写
- 在抖音开发者工具中用原生 API 写
- 双平台完全独立

**优点**：
- ✅ 性能最优

**缺点**：
- ❌ 双平台代码重复 100%
- ❌ 工期最长（5–6 周）
- ❌ 个人开发者不推荐

**推荐度**：⭐（不推荐）

---

## 三、方案对比表

| 维度 | A. React + Canvas | B. Cocos Creator | C. LayaAir | D. Egret | E. 原生 |
|------|------------------|------------------|------------|----------|--------|
| 工期 | 2–3 周 | 3–4 周 | 3–4 周 | 3–4 周 | 5–6 周 |
| 代码复用 | 80%+ | 40% | 40% | 40% | 0% |
| 双平台适配 | 中（写 Adapter） | 低（一键发布） | 低 | 中 | 高（重复） |
| 学习成本 | 低 | 中 | 中 | 中 | 高 |
| 性能 | 中 | 高 | 高 | 高 | 最高 |
| 包体积 | 中 | 大 | 中 | 中 | 小 |
| 适合本项目 | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| 推荐度 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐ |

---

## 四、为什么推荐方案 A（React + Canvas）

### 1. 业务逻辑 100% 复用

现有 `src/game/*.ts` 完全不动：

```typescript
// src/game/story.ts（保留）
export const SCENES = { ... }

// src/game/battle.ts（保留）
export function initBattle(config) { ... }

// src/game/save.ts（保留）
export function readSave(slot) { ... }
```

只需新增 `src/platform/` 目录：

```typescript
// src/platform/storage.wx.ts
export const storage = { ... }

// src/platform/audio.wx.ts
export function createAudio(src) { ... }
```

### 2. UI 层用 Canvas 重写

```typescript
// src/canvas/CanvasStoryScene.tsx
export function CanvasStoryScene({ scene, onAdvance }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    drawBackground(ctx, scene.bg);
    drawPortrait(ctx, scene.speaker);
    drawDialogue(ctx, scene.text);
  }, [scene]);
  
  return <canvas ref={canvasRef} onClick={onAdvance} />;
}
```

### 3. 双平台只需两套 Adapter

```typescript
// src/platform/storage.wx.ts（微信）
export const storage = {
  get: (key) => wx.getStorageSync(key),
  set: (key, value) => wx.setStorageSync(key, value),
};

// src/platform/storage.tt.ts（抖音）
export const storage = {
  get: (key) => tt.getStorageSync(key),
  set: (key, value) => tt.setStorageSync(key, value),
};
```

### 4. 状态管理保持 React 风格

```typescript
// src/canvas/CanvasBattleScene.tsx
function CanvasBattleScene() {
  const [state, setState] = useState(initialState);
  const [intent, setIntent] = useState(null);
  
  // 业务逻辑不变
  const handleAction = (unit, action) => {
    const newState = resolveTurn(state, unit, action);
    setState(newState);
  };
  
  return <CanvasRenderer state={state} intent={intent} onAction={handleAction} />;
}
```

---

## 五、方案 A 详细实施步骤

### 第 1–3 天：基础设施

- [ ] 创建 `src/platform/storage.{web,wx,tt}.ts`
- [ ] 创建 `src/platform/audio.{web,wx,tt}.ts`
- [ ] 创建 `src/platform/router.{web,wx,tt}.ts`
- [ ] 创建 `src/platform/image.{web,wx,tt}.ts`
- [ ] 实现 `process.env.MINIGAME_BUILD` 条件编译

### 第 4–7 天：Canvas UI 框架

- [ ] 创建 `src/canvas/CanvasRenderer.ts`（通用渲染器）
- [ ] 实现基础组件：按钮、文本框、滚动列表
- [ ] 实现图片加载与缓存
- [ ] 实现动画与过渡效果

### 第 8–10 天：场景迁移

- [ ] `src/canvas/CanvasTitleScreen.tsx`（标题页）
- [ ] `src/canvas/CanvasStoryScene.tsx`（剧情）
- [ ] `src/canvas/CanvasBattleScene.tsx`（战斗）
- [ ] `src/canvas/CanvasChoices.tsx`（分支选择）
- [ ] `src/canvas/CanvasSaveLoad.tsx`（存档）

### 第 11–13 天：特殊玩法

- [ ] 火场救援（计时 + 选项）
- [ ] 追截战斗（命中判定）
- [ ] 撤离战（防御目标）
- [ ] 章末结算

### 第 14 天：清理与验证

- [ ] 关闭社交外链
- [ ] 删除二维码
- [ ] 关闭 URL 参数预览
- [ ] 加入健康游戏忠告
- [ ] 真机测试

---

## 六、关键技术点

### 1. Canvas 文本渲染

```typescript
function drawText(ctx, text, x, y, options) {
  ctx.font = options.font || '16px serif';
  ctx.fillStyle = options.color || '#000';
  ctx.textBaseline = 'top';
  
  // 中文换行处理
  const lines = wrapText(ctx, text, options.maxWidth);
  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * options.lineHeight);
  });
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const char of text) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = char;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
```

### 2. Canvas 按钮交互

```typescript
function drawButton(ctx, rect, text, isHovered) {
  ctx.fillStyle = isHovered ? '#5a3a2a' : '#3a2a1a';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = '#d4a86a';
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  drawText(ctx, text, rect.x + rect.w / 2, rect.y + rect.h / 2, {
    color: '#f0e0c0',
    align: 'center',
  });
}

function hitTest(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w
    && point.y >= rect.y && point.y <= rect.y + rect.h;
}
```

### 3. 平台音频首次解锁

```typescript
// src/platform/audio.wx.ts
let unlocked = false;

export function unlockAudio() {
  if (unlocked) return;
  // 微信小游戏：首次用户交互后调用
  const audio = wx.createInnerAudioContext();
  audio.src = 'data:audio/mp3;base64,xxx'; // 静音片段
  audio.play();
  unlocked = true;
}
```

---

## 七、风险与对策

| 风险 | 等级 | 对策 |
|------|------|------|
| Canvas 性能不足 | 🟡 中 | 启用 OffscreenCanvas + 预渲染 |
| 中文字体渲染 | 🟡 中 | 使用平台内置字体（不要嵌入 Web Font） |
| 触摸事件兼容性 | 🟢 低 | 统一处理 touchstart / touchend |
| 平台 API 差异 | 🟡 中 | 通过 Adapter 屏蔽 |
| 73MB 资源加载 | 🟡 中 | 分包 + 远程加载，按需加载 |
| 低端机内存 | 🟡 中 | 限制同时存在的图片 < 20 张 |

---

## 八、推荐结论

**方案 A（React + Canvas）作为本项目首选方案**：

| 维度 | 评分 |
|------|------|
| 工期 | ✅ 2–3 周（最短） |
| 代码复用 | ✅ 80%+ |
| 学习成本 | ✅ 低（已有 React 基础） |
| 双平台适配 | ✅ 可控 |
| 性能 | ⚠️ 中（但本项目不需要极致性能） |
| 长期维护 | ✅ 单人可维护 |

**不建议**：
- 方案 D（Egret 维护放缓）
- 方案 E（双平台重复开发）

**备选**：如果对 Canvas UI 框架开发无信心，可考虑方案 B（Cocos Creator）。

---

## 九、决策清单

- [ ] 阅读本方案对比
- [ ] 决定目标方案（A / B / C / D / E）
- [ ] 在 1 周内启动迁移
- [ ] 在 2–4 周内完成核心功能
- [ ] 在 3–4 周内完成真机测试
- [ ] 在第 4 周末提交平台审核

---

## 十、参考资料

- [微信小游戏运行环境 Adapter](https://developers.weixin.qq.com/minigame/dev/guide/runtime/adapter.html)
- [微信小游戏 Canvas 基础](https://developers.weixin.qq.com/minigame/dev/guide/canvas/canvas.html)
- [抖音小游戏 Canvas 渲染](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/guide/game-engine/canvas)
- [Cocos Creator 官方文档](https://docs.cocos.com/creator/manual/zh/)
- [LayaAir 官方文档](https://layaair.com/3.x/doc/)
