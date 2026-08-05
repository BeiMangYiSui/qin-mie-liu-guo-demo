// 平台截图自动生成脚本
// 使用：node scripts/take-platform-screenshots.mjs
// 输出：docs/screenshots/01-home.png ... 08-health.png
// 前置：npm run dev（开发服务器已运行在 http://localhost:5173）

import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const outputDir = path.join(projectRoot, 'docs', 'screenshots')

const BASE_URL = 'http://localhost:5173'

// 截图规格（A4 比例 1:1.414 不适用，按平台规范用 9:16 移动端竖屏）
const VIEWPORT = {
  width: 750,
  height: 1334, // iPhone 6/7/8 比例
  deviceScaleFactor: 2,
}

const SCREENSHOTS = [
  {
    id: '01-home',
    title: '首页',
    stage: null,
    description: '完整显示游戏名称、主视觉、开始按钮和健康提示',
    setupPage: async (page) => {
      // 标题页
    },
  },
  {
    id: '02-story',
    title: '剧情对话',
    stage: 's1_anfa',
    description: '显示场景背景、人物立绘、对白和继续操作',
  },
  {
    id: '03-choice',
    title: '分支选择',
    stage: 'c7_choice',
    description: '完整显示选择项和反馈结果',
  },
  {
    id: '04-battle',
    title: '战斗',
    stage: 'c4_battle',
    description: '显示双方单位、任务目标、行动按钮和战斗反馈',
  },
  {
    id: '05-rescue',
    title: '火场救援',
    stage: 'c7_fire',
    description: '展示特殊玩法、计时与操作反馈',
  },
  {
    id: '06-settle',
    title: '章末结算',
    stage: 'c8_settle',
    description: '展示玩家选择造成的差异和结算信息',
  },
  {
    id: '07-save',
    title: '存档',
    stage: null,
    description: '本地存档功能与重置入口',
    setupPage: async (page) => {
      await page.click('button:has-text("游戏")', { timeout: 5000 }).catch(() => {})
    },
  },
  {
    id: '08-health',
    title: '健康提示',
    stage: null,
    description: '健康游戏忠告与适龄提示',
  },
]

async function main() {
  console.log('[screenshots] launching browser...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: VIEWPORT.deviceScaleFactor,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  })
  const page = await context.newPage()

  await mkdir(outputDir, { recursive: true })

  for (const shot of SCREENSHOTS) {
    console.log(`[screenshots] => ${shot.id}: ${shot.title}`)
    try {
      // 构造 URL
      let url = BASE_URL
      if (shot.stage) {
        url = `${BASE_URL}/?stage=${shot.stage}`
      }

      // 访问页面
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      // 等待游戏加载
      await page.waitForTimeout(2000)

      // 自定义 setup
      if (shot.setupPage) {
        await shot.setupPage(page)
        await page.waitForTimeout(500)
      }

      // 截图
      const filePath = path.join(outputDir, `${shot.id}.png`)
      await page.screenshot({ path: filePath, fullPage: false })

      // 写说明
      const metaPath = path.join(outputDir, `${shot.id}.meta.txt`)
      await writeFile(
        metaPath,
        `标题：${shot.title}\n` +
          `URL：${url}\n` +
          `说明：${shot.description}\n` +
          `时间：${new Date().toISOString()}\n`,
        'utf8',
      )

      console.log(`[screenshots]   ✓ ${filePath}`)
    } catch (e) {
      console.error(`[screenshots]   ✗ ${shot.id} failed:`, e.message)
    }
  }

  await browser.close()
  console.log(`[screenshots] done. Output: ${outputDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
