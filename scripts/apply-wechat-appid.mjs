#!/usr/bin/env node
// 微信小游戏 AppID 接入脚本
// 用法：node scripts/apply-wechat-appid.mjs <wxAppID>
// 作用：把 wx 开头的 18 位 AppID 填进 project.config.wx.json 和 game.json，
//       同时把根目录 project.config.json 标记为抖音专用（不动它的 appid）

import fs from 'node:fs'
import path from 'node:path'

const WX_APPID = process.argv[2]

if (!WX_APPID) {
  console.error('[apply-wechat-appid] 用法：node scripts/apply-wechat-appid.mjs <wxAppID>')
  console.error('                        AppID 必须是 wx 开头、共 18 位')
  process.exit(1)
}

if (!/^wx[0-9a-f]{16}$/i.test(WX_APPID)) {
  console.error('[apply-wechat-appid] AppID 格式不对：必须以 wx 开头、共 18 位（数字 + a-f）')
  console.error(`[apply-wechat-appid] 实际收到：${WX_APPID}（长度 ${WX_APPID.length}）`)
  process.exit(1)
}

const repoRoot = process.cwd()

// 1. 写 project.config.wx.json
const wxConfigPath = path.join(repoRoot, 'project.config.wx.json')
if (!fs.existsSync(wxConfigPath)) {
  console.error(`[apply-wechat-appid] 找不到 ${wxConfigPath}，请确认在仓库根目录执行`)
  process.exit(1)
}
const wxConfig = JSON.parse(fs.readFileSync(wxConfigPath, 'utf8'))
const oldAppid = wxConfig.appid
wxConfig.appid = WX_APPID
fs.writeFileSync(wxConfigPath, JSON.stringify(wxConfig, null, 2) + '\n')
console.log(`[apply-wechat-appid] project.config.wx.json: ${oldAppid} -> ${WX_APPID}`)

// 2. 在 game.json 里加一个 appid 字段（微信小游戏 game.json 本身不强制要求，但工具会读）
const gameJsonPath = path.join(repoRoot, 'game.json')
if (fs.existsSync(gameJsonPath)) {
  const gameJson = JSON.parse(fs.readFileSync(gameJsonPath, 'utf8'))
  gameJson.appid = WX_APPID
  fs.writeFileSync(gameJsonPath, JSON.stringify(gameJson, null, 2) + '\n')
  console.log(`[apply-wechat-appid] game.json.appid 已设置`)
}

// 3. 标记根目录 project.config.json 为抖音专用
const rootConfigPath = path.join(repoRoot, 'project.config.json')
if (fs.existsSync(rootConfigPath)) {
  const rootConfig = JSON.parse(fs.readFileSync(rootConfigPath, 'utf8'))
  rootConfig.description =
    '《秦灭六国》抖音小游戏项目配置（专用）。提交抖音时使用此文件 / config.json；发布微信小游戏请使用 project.config.wx.json + 微信 AppID。'
  fs.writeFileSync(rootConfigPath, JSON.stringify(rootConfig, null, 2) + '\n')
  console.log(`[apply-wechat-appid] project.config.json 已标记为抖音专用，不修改其 appid`)
}

// 4. 把 AppID 回填到微信小游戏平台提交资料.json
const submissionPath = path.join(
  repoRoot,
  'docs/release/微信上线待做事项/微信小游戏平台提交资料.json',
)
if (fs.existsSync(submissionPath)) {
  const submission = JSON.parse(fs.readFileSync(submissionPath, 'utf8'))
  submission.game = submission.game || {}
  submission.game.appid = WX_APPID
  submission.developerPlaceholders = submission.developerPlaceholders || {}
  submission.developerPlaceholders.wechatAppid = WX_APPID
  fs.writeFileSync(submissionPath, JSON.stringify(submission, null, 2) + '\n')
  console.log(`[apply-wechat-appid] 微信小游戏平台提交资料.json 已更新 AppID`)
}

console.log(`[apply-wechat-appid] ✅ 完成。下一步：open mp.weixin.qq.com 微信开发者工具 → 导入 dist-minigame/`)
