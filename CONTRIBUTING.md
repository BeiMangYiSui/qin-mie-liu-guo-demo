# Contributing to Qin Mie Liu Guo

感谢开发者对《秦灭六国》（Qin Mie Liu Guo）项目的关注与支持！

本项目是一款战国末期历史叙事回合制游戏，采用 React 19 + Vite 7 + TypeScript 构建，支持一键构建为浏览器 Web 版、微信小游戏与抖音小游戏。我们非常欢迎社区开发者的参与，共同改善游戏体验、跨平台兼容性与工程架构。

---

## Ways to contribute / 参与贡献的方式

欢迎提交以下类型的贡献：

- **缺陷修复（Bug Fixes）**：提交 Bug 报告、可复现用例，或修复战斗状态机、关卡流程、存档恢复中的边界问题。
- **文档改进（Documentation）**：完善开发文档、多端发布指南、代码注释与架构说明。
- **跨平台兼容性（Cross-platform Compatibility）**：优化桌面与移动端浏览器触屏手势、视口适配与音视频兼容。
- **平台适配增强（Platform Adapters）**：改进 `src/platform/` 下的 Web、微信小游戏、抖音小游戏双端音频、存储、分享与平台能力适配。
- **测试用例扩充（Testing）**：改进与扩充 `scripts/verify-demo.mjs` 中的十八场战斗结构、关卡状态机和剧情分支验证。
- **工程构建优化（Build & Tooling）**：优化 Vite 打包体积、分包策略、静态资源预加载及 CI/CD 自动化流水线。

---

## Development setup / 开发环境准备

### 运行环境要求
- **Node.js**：>= 20.0.0（推荐 Node.js 22 LTS）
- **包管理器**：npm（推荐与 Node 一并自带版本）

### 快速开始

```bash
# 1. 克隆代码仓库
git clone https://github.com/BeiMangYiSui/qin-mie-liu-guo-demo.git
cd qin-mie-liu-guo-demo

# 2. 安装项目依赖
npm install

# 3. 启动本地开发环境（默认运行在 http://localhost:3000）
npm run dev
```

### 常用命令与脚本

```bash
# 运行自动化结构与逻辑验证测试（验证 18 场战斗、flags 状态、存档与分支）
npm run test

# 执行 ESLint 语法与规范检查
npm run lint

# 生产环境编译构建（TypeScript 检查 + Vite 打包 + 构建后清理）
npm run build

# 本地预览生产构建产物（dist 目录）
npm run preview

# 综合质量检查（测试 + 代码规范 + 编译构建）
npm run check

# 小游戏平台构建与清理（如需验证小游戏端）
npm run build:minigame:wx        # 微信小游戏构建 → dist-minigame/
npm run build:minigame:douyin    # 抖音小游戏构建 → dist-minigame-douyin/
npm run clean:minigame:wx        # 清空微信小游戏构建输出
npm run clean:minigame:douyin    # 清空抖音小游戏构建输出
```

---

## 提交规范与 Pull Request 流程 / PR Guidelines

1. **创建分支**：基于 `main` 分支创建独立的工作分支：
   ```bash
   git checkout -b fix/issue-description
   # 或
   git checkout -b feat/feature-name
   ```
2. **规范提交信息**：遵循清晰简明的提交语义（推荐 Conventional Commits）：
   - `feat:` 新增功能或机制
   - `fix:` 缺陷修复
   - `docs:` 文档更新或修正
   - `test:` 测试用例补充与测试脚本调整
   - `refactor:` 代码结构重构（不改变现有外部行为）
   - `perf:` 性能与加载速度优化
   - `chore:` 构建配置、辅助脚本或依赖调整
3. **提交前本地验证**：
   - 必须通过 `npm run test`（确保既有 18 场战斗与剧情系统无回归问题）；
   - 必须通过 `npm run build`（确保 TypeScript 编译与 Vite 生产打包通过）。
4. **提交 Pull Request**：
   - 详细描述本次变更的动机、解决的具体问题以及自测方式；
   - 关联对应的 Issue 编号（如有）。

---

## 素材资产与版权注意事项 / Assets & Copyright Notice

**请特别注意：**

1. **开源授权仅限于源代码**：本仓库的程序源代码基于 [MIT License](./LICENSE) 开源；
2. **数字素材保留版权**：游戏中的美术原画、立绘插画、UI 设计、BGM 背景音乐、音效、角色配音、视频、剧情台词、人物设定及世界观专有名词，**不属于 MIT License 的授权范围**，其版权仍归原作者或相应权利人所有；
3. **严禁侵权素材提交**：
   - 请勿向本仓库提交任何未经合法授权、不可商用或不可再分发的第三方素材（包括但不限于图片、音频、专有字体、3D 资产等）；
   - 提交至本项目的代码将被默认视作自愿在 MIT 协议下许可给项目及社区使用。

---

## 行为准则 / Code of Conduct

本项目致力于构建开放、友好、包容且尊重各方贡献者的社区环境。所有参与本项目的开发者、维护者与用户均须遵守 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) 所载之行为准则。

---

## 问题反馈与交流 / Issues & Questions

如在体验或开发过程中发现问题，请先在 [GitHub Issues](https://github.com/BeiMangYiSui/qin-mie-liu-guo-demo/issues) 中搜索是否已有相同问题。若无，欢迎提交新的 Issue 并详细注明复现环境（操作系统、浏览器版本或小游戏开发工具环境）与报错截图/日志。
