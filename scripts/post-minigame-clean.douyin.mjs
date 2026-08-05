// 抖音小游戏提审版构建后处理（抖音专用）
// 使用：vite build --config vite.config.minigame.douyin.ts 后
//       node scripts/post-minigame-clean.douyin.mjs
// 输出：dist-minigame-douyin/（抖音开发者工具可导入）
//
// 步骤：
// 1. 清理提审版禁止内容
// 2. 生成根级入口：app.js（V8 引擎执行）+ app.json（pages 配置）
// 3. 生成 webview 入口：pages/index/index.html
// 4. 注入 appid 到 project.config.json
// 5. 首包体积检查（4MB）

import fs from 'node:fs'
import path from 'node:path'

const dist = path.join(process.cwd(), 'dist-minigame-douyin')

// appid 注入：优先用环境变量 DOUYIN_MINI_GAME_APPID，其次回退到现有 project.config.json 里的 appid
const rootProjectConfigPath = path.join(process.cwd(), 'project.config.json')
const rootProjectConfig = JSON.parse(fs.readFileSync(rootProjectConfigPath, 'utf-8'))
const DOUYIN_APPID =
  process.env.DOUYIN_MINI_GAME_APPID || rootProjectConfig.appid || 'tt_PLACEHOLDER_REPLACE_WITH_REAL_DOUYIN_APPID'

// ── 1. 清理提审版禁止内容 ──────────────────────────────────────
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

// ── 2. 生成根级 app.js（V8 引擎执行） ──────────────────────────────
const appJs = `// 抖音小游戏根级入口（V8 引擎执行，不在 webview 内）
// 抖音小游戏必须实现 App / onLaunch / onShow / onHide 生命周期
// 抖音官方必接：tt.getSideBarMenu 侧边栏复访能力（getSideBarMenu 已在 main.minigame.tsx 中实现）

const sysInfo = tt.getSystemInfoSync()
const appInfo = {
  appId: '${DOUYIN_APPID}',
  platform: sysInfo.platform,
  SDKVersion: sysInfo.SDKVersion,
}
console.log('[app.js] boot, appId=', appInfo.appId, 'SDK=', sysInfo.SDKVersion)

App({
  onLaunch(options) {
    console.log('[app.js] onLaunch', options)
  },
  onShow(options) {
    console.log('[app.js] onShow', options)
  },
  onHide() {
    console.log('[app.js] onHide')
  },
  onError(err) {
    console.warn('[app.js] onError', err)
  },
})
`
fs.writeFileSync(path.join(dist, 'app.js'), appJs)
console.log('[clean] generated app.js')

// ── 3. 生成 app.json（pages 配置 + window） ──────────────────────
const appJson = {
  pages: ['pages/index/index'],
  window: {
    navigationBarBackgroundColor: '#1a1b1f',
    navigationBarTextStyle: 'white',
    navigationBarTitleText: '秦灭六国',
    backgroundColor: '#1a1b1f',
    backgroundTextStyle: 'dark',
    orientation: 'landscape',
    fullscreen: true,
  },
  // 抖音小游戏权限：默认无敏感权限。后续若增加 getLocation / clipboard 等需补 requiredPrivateInfos
  requiredPrivateInfos: [],
  permission: {},
  sitemap: {
    rules: [{ action: 'disallow', page: '*' }],
  },
  // 抖音小游戏适配器：开启 webview 渲染模式
  renderer: 'webview',
}
fs.writeFileSync(path.join(dist, 'app.json'), JSON.stringify(appJson, null, 2) + '\n')
console.log('[clean] generated app.json')

// ── 4. 生成 webview 入口：pages/index/index.html ─────────────────────
const webviewDir = path.join(dist, 'pages', 'index')
fs.mkdirSync(webviewDir, { recursive: true })

function findCssFile(webviewDir) {
  if (!fs.existsSync(webviewDir)) return null
  for (const f of fs.readdirSync(webviewDir)) {
    if (f.endsWith('.css')) return f
  }
  return null
}
const indexJsName = 'index.js'
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

// ── 5. 生成 project.config.json（注入真 appid） ──────────────────
const projectConfig = {
  ...rootProjectConfig,
  appid: DOUYIN_APPID,
  description: `《秦灭六国》抖音小游戏项目配置 - appid: ${DOUYIN_APPID}`,
}
fs.writeFileSync(path.join(dist, 'project.config.json'), JSON.stringify(projectConfig, null, 2) + '\n')
console.log(`[clean] generated project.config.json (appid=${DOUYIN_APPID})`)

// ── 6. 首包体积检查 ──────────────────────────────────────────
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
console.log(`[clean] dist-minigame-douyin: ${files} files, ${totalMB} MB`)

const FIRST_PACK_LIMIT = 4 * 1024 * 1024
if (total > FIRST_PACK_LIMIT * 4) {
  console.warn(`[clean] ⚠️  提审包原始体积 ${totalMB} MB 远超 4MB 上传限制。`)
  console.warn(`[clean]    必须把 bgm/voice 资源迁至 CDN 并在小游戏中按需加载。`)
} else if (total > FIRST_PACK_LIMIT) {
  console.warn(`[clean] ⚠️  提审包原始体积 ${totalMB} MB，建议把 bgm/voice 迁至 CDN`)
} else {
  console.log('[clean] ✅ 提审包原始体积在 4MB 内')
}

console.log('[clean] douyin mini-game build done.')
console.log('')
console.log('━'.repeat(60))
console.log(`抖音小游戏包就绪：${dist}`)
console.log(`appid: ${DOUYIN_APPID}`)
console.log('导入方式：打开抖音开发者工具 → 导入项目 → 选择 dist-minigame-douyin 目录')
console.log('━'.repeat(60))