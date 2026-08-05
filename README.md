# 《秦灭六国》

> 战国末期·秦王政·隐密署视角的回合制剧情叙事游戏
> React 19 + Vite 7 + TypeScript 5.9，可一键构建为浏览器版、微信小游戏、抖音小游戏。

---

## 项目简介

《秦灭六国》是一款单人剧情向回合制游戏。玩家以"隐密署"都尉身份介入公元前 230 年韩国覆灭前夜，循 18 场战斗 + 30+ 剧情节点推进故事线，沿途完成情报核验、护送战术、纵火截击、章末军报等关键抉择。

### 核心架构：隐戈署—候事堂—都尉三级

- **隐戈署**：秦国最高情报机构，统筹对外谍报与反间；
- **候事堂**：行动执行层，承接署令并调度资源；
- **都尉**：玩家所扮演的角色，直接领命于堂，调度下属候事。

### 章节体系

- **序章 S1~S10**：受命、出关、农家夜话、伏杀、追击、新郑、章台朝议、章末；
- **第一章 C1~C8**：护粮、关隘、农家、护送、守襄、义营、纵火/疏散/突围三择其一、章末军报。

---

## 技术栈

| 维度 | 选型 |
|------|------|
| 框架 | React 19 + react-router 7 |
| 语言 | TypeScript 5.9（strict） |
| 构建 | Vite 7（多配置：web / 微信小游戏 / 抖音小游戏） |
| 样式 | Tailwind CSS 3 + Radix UI + CVA |
| 状态 | React Context + useReducer（详见 `src/game/save.ts`） |
| 音频 | Web Audio + 平台适配层（`src/platform/audio.*.ts`） |
| 部署 | GitHub Pages、Vercel、微信小游戏、抖音小游戏 |

---

## 目录导览

```
.
├── src/
│   ├── game/          # 剧情数据、战斗引擎、教学战、存档与音频管理
│   ├── ui/            # 章节卡、报告、救援、追截、史乘等组件与数据
│   ├── sections/      # 场景级页面：标题 / 剧情 / 战斗 / 教学战斗
│   ├── components/    # 通用组件（菜单、跳过、二维码、战斗特效等）
│   ├── lib/           # 工具与平台适配（cdn / preload / social / utils）
│   ├── platform/      # 三端平台适配：web / wx / tt
│   ├── shared/        # 提审版共享代码
│   ├── hooks/         # 通用 React hooks
│   ├── pages/         # 路由级页面
│   ├── App.tsx        # 浏览器版根组件
│   ├── main.tsx       # 浏览器版入口
│   └── main.minigame.tsx  # 小游戏提审版入口
├── scripts/           # 构建后清理 / 软著材料生成 / 验证 / 截图脚本
├── public/            # 静态资源：assets / bgm / sfx / voice
├── docs/
│   ├── soft-copyright/    # 软著申请材料（自动生成 + V1.0 源稿）
│   └── release/           # 发布材料：软著 / 小游戏 / 抖音 / 素材授权
├── .github/workflows/ # GitHub Pages 部署
├── game.json          # 微信小游戏项目配置
├── project.config.json# 抖音小游戏项目配置
├── vite.config.ts                 # 浏览器版构建
├── vite.config.minigame.ts        # 微信小游戏构建
└── vite.config.minigame.douyin.ts # 抖音小游戏构建
```

---

## 常用命令

```bash
# 浏览器版
npm run dev                    # 本地开发（默认 http://localhost:3000）
npm run build                  # tsc + vite build + post-build clean
npm run preview                # 预览 dist
npm run lint                   # ESLint
npm run test                   # scripts/verify-demo.mjs 18 场战斗结构验证
npm run check                  # test + lint + build 一把梭

# 软著材料生成（输出到 docs/soft-copyright/）
npm run soft-copyright:source  # 源代码鉴别材料
npm run soft-copyright:doc     # 软件设计说明
npm run soft-copyright         # 两个一起

# 小游戏提审包
npm run build:minigame:wx        # 微信小游戏 → dist-minigame/
npm run build:minigame:douyin    # 抖音小游戏 → dist-minigame-douyin/
npm run clean:minigame:wx        # 清空 dist-minigame/
npm run clean:minigame:douyin    # 清空 dist-minigame-douyin/
```

详细 Vite 多配置说明：[docs/release/提审前Vite构建配置清单.md](docs/release/提审前Vite构建配置清单.md)

---

## 发布与提审

- **GitHub Pages**：`.github/workflows/deploy-pages.yml` 自动部署 `dist/`
- **Vercel**：`vercel.json` 配置 SPA rewrite
- **微信小游戏**：参考 [docs/release/小游戏提审版接入指南.md](docs/release/小游戏提审版接入指南.md)
- **抖音小游戏**：参考 `docs/release/抖音上线待做事项/`

发布材料总览：[docs/release/发布准备总表.txt](docs/release/发布准备总表.txt)

---

## 软著与素材合规

- 软著申请模板：[docs/release/软著申请表示例.txt](docs/release/软著申请表示例.txt)
- 素材授权链路：[docs/release/素材授权链路核对表.md](docs/release/素材授权链路核对表.md)
- 提审前自检：[docs/release/提审前自检与签字模板.txt](docs/release/提审前自检与签字模板.txt)

---

## 许可证

个人开发者作品，源码仅供学习参考；商用、二次分发需作者授权。
