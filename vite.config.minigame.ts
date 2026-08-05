// 微信小游戏提审版 Vite 配置
// 使用：vite build --config vite.config.minigame.ts
// 输出：dist-minigame/（微信开发者工具可导入）
//
// 小游戏目录结构（webview 渲染模式）：
//   game.js                ← 微信小游戏根级 JS 入口（post-clean 生成）
//   game.json              ← 小游戏配置（已有）
//   project.config.json    ← IDE 项目配置（post-clean 生成）
//   pages/index/index.js   ← Vite 输出（当前文件）
//   pages/index/index.css  ← Vite 输出（CSS）
//   assets/                ← Vite 输出的静态资源
//   bgm/ sfx/ voice/       ← public/ 静态资源拷贝
//   sitemap.json           ← 微信搜索引擎 sitemap（post-clean 生成）

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// 注意：vite alias 的 find 字段是 startsWith 匹配，且按声明顺序生效。
// 更具体（长前缀）的规则必须先声明。
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // 1. 平台特化先匹配
      { find: /^@\/shared(\/.*)?$/, replacement: path.resolve(__dirname, 'src/shared$1') },
      { find: /^@\/platform$/, replacement: path.resolve(__dirname, 'src/platform/index.wx') },
      { find: /^\.\.\/platform$/, replacement: path.resolve(__dirname, 'src/platform/index.wx') },
      // 2. 通用规则最后匹配
      { find: /^@\/(.+)$/, replacement: path.resolve(__dirname, 'src/$1') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
  build: {
    outDir: 'dist-minigame',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'src/main.minigame.tsx',
      },
      output: {
        // 主入口输出到 pages/index/index.js（小游戏 webview 页面入口）
        entryFileNames: 'pages/index/index.js',
        // 异步分包输出到 pages/index/ 同目录，hash 命名（小游戏一般不用异步分包，文件名稳定即可）
        chunkFileNames: 'pages/index/[name]-[hash].js',
        // CSS 输出到 pages/index/ 同目录（webview 入口要同时加载 CSS）
        // 图片等其他资源输出到 assets/
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? ''
          if (name.endsWith('.css')) return 'pages/index/[name]-[hash][extname]'
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
    // 微信小游戏首包限制 4MB：资源分包是 post-clean 阶段做的（把 bgm/voice 打包成 zip 或迁 CDN）
    assetsInlineLimit: 4096,
    // 减小 chunk 体积警告阈值（主包 <= 4MB）
    chunkSizeWarningLimit: 4000,
  },
  define: {
    'process.env.MINIGAME_BUILD': '"true"',
    'process.env.PLATFORM_NAME': '"wechat"',
  },
})
