// 抖音小游戏提审版 Vite 配置
// 使用：vite build --config vite.config.minigame.douyin.ts
// 输出：dist-minigame-douyin/（抖音开发者工具可导入）
//
// 小游戏目录结构（webview 渲染模式）：
//   app.js                 ← 抖音小游戏根级 JS 入口（post-clean 生成）
//   app.json               ← 全局 pages 配置（post-clean 生成）
//   project.config.json    ← IDE 项目配置（已有，需填 appid）
//   pages/index/index.js   ← Vite 输出
//   pages/index/index.css  ← Vite 输出
//   assets/                ← Vite 输出的静态资源
//   bgm/ sfx/ voice/       ← public/ 静态资源拷贝
//   sitemap.json           ← sitemap（可选）

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// 注意：vite alias 的 find 字段是 startsWith 匹配，且按声明顺序生效。
// 所以更具体（长前缀）的规则必须先声明。具体规则优先于通用规则。
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // 1. 更具体的规则必须先声明，否则会被通用规则抢先匹配
      { find: /^@\/shared(\/.*)?$/, replacement: path.resolve(__dirname, 'src/shared$1') },
      { find: /^@\/platform$/, replacement: path.resolve(__dirname, 'src/platform/index.tt') },
      { find: /^\.\.\/platform$/, replacement: path.resolve(__dirname, 'src/platform/index.tt') },
      // 2. 通用规则放在最后
      { find: /^@\/(.+)$/, replacement: path.resolve(__dirname, 'src/$1') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
  build: {
    outDir: 'dist-minigame-douyin',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'src/main.minigame.tsx',
      },
      output: {
        entryFileNames: 'pages/index/index.js',
        chunkFileNames: 'pages/index/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? ''
          if (name.endsWith('.css')) return 'pages/index/[name]-[hash][extname]'
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 4000,
  },
  define: {
    'process.env.MINIGAME_BUILD': '"true"',
    'process.env.PLATFORM_NAME': '"douyin"',
  },
})