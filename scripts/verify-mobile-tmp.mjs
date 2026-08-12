// 临时脚本：模拟手机视口 + 4G，验证首屏骨架与头像渲染
import { chromium, devices } from 'playwright'

const browser = await chromium.launch()
const context = await browser.newContext({
  ...devices['iPhone 13'],
})
const page = await context.newPage()

const client = await page.context().newCDPSession(page)
await client.send('Network.enable')
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 50,
  downloadThroughput: 1.7 * 1024 * 1024,
  uploadThroughput: (1.7 * 1024 * 1024) / 4,
})

const failLog = []
page.on('response', (res) => {
  if (res.status() >= 400 && /\.(webp|png|svg)/.test(res.url())) {
    failLog.push({ file: res.url().split('/').pop(), status: res.status() })
  }
})

// 0. 拦截 JS 延迟 5s，模拟慢网络下 JS 未就绪阶段，验证骨架是否显示
await page.route('**/*.js', async (route) => {
  await new Promise((r) => setTimeout(r, 5000))
  await route.continue()
})

// 1. 打开，检查骨架是否显示（JS 被延迟）
await page.goto('http://localhost:4173/?probe=mobile', { waitUntil: 'domcontentloaded', timeout: 120000 })
const bootVisible = await page.evaluate(() => {
  const el = document.getElementById('boot-screen')
  return el ? { exists: true, visible: getComputedStyle(el).display !== 'none' } : { exists: false }
})
await page.screenshot({ path: '/tmp/mobile-boot.png' })

// 2. 等标题出现（React 挂载，骨架被替换）
await page.locator('h1:has-text("秦灭六国")').waitFor({ timeout: 120000 })
const bootRemoved = await page.evaluate(() => document.getElementById('boot-screen') === null)
await page.screenshot({ path: '/tmp/mobile-title.png' })

// 3. 点击开始进入序章，推进对话到有头像的说话人行（旁白无头像）
await page.locator('button:has-text("奉令出发")').click()
await page.waitForTimeout(1500)
for (let i = 0; i < 4; i++) {
  const btn = page.locator('button:has-text("继续")')
  if (await btn.count()) await btn.first().click().catch(() => {})
  await page.waitForTimeout(1200)
}
const avatarState = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].map((img) => ({
    src: (img.getAttribute('src') || '').split('/').pop(),
    complete: img.complete,
    naturalW: img.naturalWidth,
    w: img.clientWidth,
    h: img.clientHeight,
  }))
  return imgs
})
await page.screenshot({ path: '/tmp/mobile-game.png' })

console.log(JSON.stringify({ bootVisible, bootRemoved, failLog, avatarState }, null, 2))
await browser.close()
