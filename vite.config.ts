import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
//
// 注意：vite alias 是 startsWith 匹配且按声明顺序生效。
// 这里给 '@/platform' 单独配，以便直接指向具体文件而不是目录，
// 否则 src/platform 是目录、需要再找 index.ts/web.ts 等。
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      // 1. 平台特化先匹配（'@/platform' 的字符级整串匹配）
      '@/platform': path.resolve(__dirname, './src/platform/index.web'),
      // 2. 兼容 src/game/save.ts 等使用 '../platform' 的相对路径 import
      '../platform': path.resolve(__dirname, './src/platform/index.web'),
      // 3. 最后通用 '@' 兜底
      '@': path.resolve(__dirname, './src'),
    },
  },
});
