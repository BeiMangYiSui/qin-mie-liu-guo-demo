#!/usr/bin/env node
// 微信小游戏素材压缩脚本
// 用途：把 battle sprite PNG 转 WebP，并重新编码大 BGM/SCX MP3
// 用法：node scripts/compress-game-assets.mjs [--dry-run]
//
// 依赖：cwebp + ffmpeg
// 安装：brew install webp ffmpeg
//
// ⚠️ 脚本只覆盖 dist-minigame/ 副本，不动源码 public/

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const src = path.join(process.cwd(), 'dist-minigame')
const isDryRun = process.argv.includes('--dry-run')

function statSize(p) {
  if (!fs.existsSync(p)) return 0
  return fs.statSync(p).size
}

function has(cmd) {
  try {
    execFileSync('which', [cmd], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

let totalSaved = 0
const transfers = []

// 1. PNG → WebP
const pngToCompress = [
  'assets/battle/hero_mengjia_idle_v1.png',
  'assets/bg_hangu.png',
  'assets/bg_tingwei.png',
  'assets/portrait_xiaoman.png',
  'assets/portrait_qingling.png',
  'assets/portrait_beimang.png',
  'assets/npc_lisi.png',
  'assets/npc_nongjia_laoweng.png',
]

if (!has('cwebp')) {
  console.error('[compress] ❌ 缺少 cwebp，请先安装：brew install webp')
  process.exit(1)
}

console.log('[compress] 阶段 1：PNG → WebP（无损替代）')

for (const rel of pngToCompress) {
  const abs = path.join(src, rel)
  if (!fs.existsSync(abs)) {
    console.log(`  [skip] ${rel}（不存在）`)
    continue
  }
  const before = statSize(abs)
  const webpAbs = abs.replace(/\.png$/, '.webp')
  if (!isDryRun) {
    try {
      // execFile + argv 数组，避免 shell 注入
      execFileSync('cwebp', ['-q', '80', '-m', '6', abs, '-o', webpAbs], {
        stdio: 'ignore',
      })
      // 转换成功后，删除原 PNG 副本（WebP 已替代）
      fs.unlinkSync(abs)
    } catch (e) {
      console.error(`  [fail] ${rel}: ${e.message}`)
      continue
    }
  }
  const after = statSize(webpAbs)
  const saved = before - after
  totalSaved += saved
  transfers.push({ rel, action: 'png→webp', before, after, saved })
  console.log(
    `  ${rel}: ${(before / 1024).toFixed(0)}K → ${(after / 1024).toFixed(0)}K（节省 ${(saved / 1024).toFixed(0)}K）`,
  )
}

// 2. BGM 重新编码 96kbps
if (!has('ffmpeg')) {
  console.error('[compress] ⚠️  缺少 ffmpeg，跳过音频压缩。安装：brew install ffmpeg')
} else {
  console.log('\n[compress] 阶段 2：BGM 重新编码 96kbps')

  const bgmFiles = ['bgm/farm.mp3', 'bgm/court.mp3', 'bgm/ambush.mp3']
  for (const rel of bgmFiles) {
    const abs = path.join(src, rel)
    if (!fs.existsSync(abs)) {
      console.log(`  [skip] ${rel}（不存在）`)
      continue
    }
    const before = statSize(abs)
    const tmpAbs = abs + '.tmp.mp3'
    if (!isDryRun) {
      try {
        // execFile + argv 数组，避免 shell 注入
        execFileSync(
          'ffmpeg',
          ['-y', '-i', abs, '-b:a', '96k', '-ac', '2', '-ar', '44100', tmpAbs],
          { stdio: 'ignore' },
        )
        fs.renameSync(tmpAbs, abs)
      } catch (e) {
        console.error(`  [fail] ${rel}: ${e.message}`)
        continue
      }
    }
    const after = statSize(abs)
    const saved = before - after
    totalSaved += saved
    transfers.push({ rel, action: 'mp3-96k', before, after, saved })
    console.log(
      `  ${rel}: ${(before / 1024).toFixed(0)}K → ${(after / 1024).toFixed(0)}K（节省 ${(saved / 1024).toFixed(0)}K）`,
    )
  }
}

// 3. 汇总
console.log('\n[compress] === 汇总 ===')
console.log(`  转换次数：${transfers.length}`)
console.log(`  共节省：${(totalSaved / 1024 / 1024).toFixed(2)} MB`)

function walkSize(dir) {
  let total = 0
  if (!fs.existsSync(dir)) return 0
  function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) walk(full)
      else total += fs.statSync(full).size
    }
  }
  walk(dir)
  return total
}

const newTotal = walkSize(src)
console.log(`  当前总包：${(newTotal / 1024 / 1024).toFixed(2)} MB`)
const limit = 4 * 1024 * 1024
if (newTotal > limit) {
  console.log(`  ⚠️  仍超过 4MB 首包，需要进一步分包或远程资源`)
} else {
  console.log(`  ✅ 已压到 4MB 内`)
}

console.log('\n[compress] 完成。')
if (isDryRun) console.log('  （dry-run 模式，未实际写入文件）')
