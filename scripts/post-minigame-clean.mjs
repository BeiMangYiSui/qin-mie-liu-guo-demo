// 微信小游戏提审版构建后处理
// 使用：vite build --config vite.config.minigame.ts 后
//       node scripts/post-minigame-clean.mjs
// 输出：dist-minigame/（微信开发者工具可导入）
//
// 步骤：
// 1. 清理提审版禁止内容（社交外链、AI 评审过程、未使用素材、sourcemaps）
// 2. 生成根级入口文件：game.js（V8 引擎执行）
// 3. 生成 webview 入口：pages/index/index.html
// 4. 生成 IDE 项目配置：project.config.json（支持 appid 注入）
// 5. 生成 sitemap.json
// 6. 首包体积检查（4MB）

import fs from 'node:fs'
import path from 'node:path'

const dist = path.join(process.cwd(), 'dist-minigame')

// appid 注入：优先用环境变量 WECHAT_MINI_GAME_APPID，其次回退到 PLACEHOLDER
const WECHAT_APPID = process.env.WECHAT_MINI_GAME_APPID || 'wx_PLACEHOLDER_REPLACE_WITH_REAL_WECHAT_APPID'

// ── 1. 清理提审版禁止内容 ────────────────────────────────────────────
const requiredRemove = [
  'assets/wechat-qr.png',
  'assets/telegram-qr.png',
  'assets/review',
  'assets/unused',
  'sourcemaps',
]

for (const rel of requiredRemove) {
  const target = path.join(dist, rel)
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true })
    console.log(`[clean] removed ${rel}`)
  }
}

// 兜底：删除所有 .map 文件
function walkRemoveMap(dir) {
  if (!fs.existsSync(dir)) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walkRemoveMap(full)
    else if (e.name.endsWith('.map')) {
      fs.rmSync(full, { force: true })
      console.log(`[clean] removed ${path.relative(dist, full)}`)
    }
  }
}
walkRemoveMap(dist)

// ── 2. 生成根级 game.js（V8 引擎执行） ──────────────────────────────
const gameJs = `// 微信小游戏根级入口（V8 引擎执行，不在 webview 内）
// 由微信客户端加载，初始化 GameGlobal 与全局 wx 引用，然后让 webview 加载 pages/index/index.html

const sysInfo = wx.getSystemInfoSync()
GameGlobal.appInfo = {
  appId: '${WECHAT_APPID}',
  platform: sysInfo.platform,
  SDKVersion: sysInfo.SDKVersion,
}
console.log('[game.js] boot, appId=', GameGlobal.appInfo.appId, 'SDK=', sysInfo.SDKVersion)

// 健康游戏忠告：进入小程序后由 main.minigame.tsx 的 React 层渲染，这里只占位
// 适龄提示：12+ 已在 game.json 与 main.minigame.tsx 双重声明

// 提审必接：抖音小游戏需 getSideBarMenu；微信小游戏无此 API，避免调用
if (typeof wx.onShow === 'function') {
  wx.onShow(() => console.log('[game.js] onShow'))
}
if (typeof wx.onHide === 'function') {
  wx.onHide(() => console.log('[game.js] onHide'))
}
`
fs.writeFileSync(path.join(dist, 'game.js'), gameJs)
console.log('[clean] generated game.js')

// ── 3. 生成 webview 入口：pages/index/index.html ────────────────────
const webviewDir = path.join(dist, 'pages', 'index')
fs.mkdirSync(webviewDir, { recursive: true })

// 找到 Vite 输出的 CSS 文件名（输出名格式：index-[hash].css）
function findCssFile(webviewDir) {
  if (!fs.existsSync(webviewDir)) return null
  for (const f of fs.readdirSync(webviewDir)) {
    if (f.endsWith('.css')) return f
  }
  return null
}
const indexJsName = 'index.js' // Vite entryFileNames 固定为 index.js
const indexCssName = findCssFile(webviewDir) || 'index.css'

const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <meta name="format-detection" content="telephone=no,email=no,address=no" />
  <title>秦灭六国</title>
  <link rel="stylesheet" href="./${indexCssName}" />
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #1a1b1f; overflow: hidden; }
    #root { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="./${indexJsName}"></script>
</body>
</html>
`
fs.writeFileSync(path.join(webviewDir, 'index.html'), indexHtml)
console.log(`[clean] generated pages/index/index.html (css=${indexCssName})`)

// ── 4. 生成 IDE 项目配置：project.config.json ──────────────────────
const projectConfig = {
  miniprogramRoot: './',
  projectname: 'qin-mie-liu-guo',
  appid: WECHAT_APPID,
  setting: {
    urlCheck: false,
    es6: true,
    minify: false,
    newFeature: true,
    autoAudits: false,
    checkInvalidKey: true,
    checkSiteMap: true,
    ignoreUploadUnusedFiles: true,
  },
  compileType: 'miniprogram',
  condition: {},
  editorSetting: {
    tabIndent: 'insertSpaces',
    tabSize: 2,
  },
  libVersion: '3.0.0',
  description: `《秦灭六国》微信小游戏项目配置 - appid: ${WECHAT_APPID}`,
}
fs.writeFileSync(path.join(dist, 'project.config.json'), JSON.stringify(projectConfig, null, 2) + '\n')
console.log(`[clean] generated project.config.json (appid=${WECHAT_APPID})`)

// ── 5. 生成 sitemap.json ─────────────────────────────────────────
const sitemap = {
  rules: [{ action: 'disallow', page: '*' }],
}
fs.writeFileSync(path.join(dist, 'sitemap.json'), JSON.stringify(sitemap, null, 2) + '\n')
console.log('[clean] generated sitemap.json')

// ── 6. 首包体积检查 ────────────────────────────────────────────
function countSize(dir) {
  let total = 0
  let files = 0
  if (!fs.existsSync(dir)) return { total, files }
  function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) walk(full)
      else {
        total += fs.statSync(full).size
        files += 1
      }
    }
  }
  walk(dir)
  return { total, files }
}

const { total, files } = countSize(dist)
const totalMB = (total / 1024 / 1024).toFixed(2)
console.log(`[clean] dist-minigame: ${files} files, ${totalMB} MB`)

// 首包（4MB）实际是按 zip 压缩后大小算的，这里给的是原始体积警示
const FIRST_PACK_LIMIT = 4 * 1024 * 1024
if (total > FIRST_PACK_LIMIT * 4) {
  // raw 体积一般是 zip 后 3~4 倍；这里用 16MB 作为 raw 警示阈值
  console.warn(`[clean] ⚠️  提审包原始体积 ${totalMB} MB 远超 4MB 上传限制。`)
  console.warn(`[clean]    必须把 bgm/voice 资源迁至 CDN 并在小游戏中按需加载。`)
} else if (total > FIRST_PACK_LIMIT) {
  console.warn(`[clean] ⚠️  提审包原始体积 ${totalMB} MB，建议把 bgm/voice 迁至 CDN`)
} else {
  console.log('[clean] ✅ 提审包原始体积在 4MB 内')
}

console.log('[clean] wechat mini-game build done.')
console.log('')
console.log('━'.repeat(60))
console.log(`微信小游戏包就绪：${dist}`)
console.log(`appid: ${WECHAT_APPID}`)
console.log('导入方式：打开微信开发者工具 → 导入项目 → 选择 dist-minigame 目录')
console.log('━'.repeat(60))