// Dev 模式测试：获取完整的 React #300 错误堆栈
import { chromium } from 'playwright'

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
})
const page = await context.newPage()

const allConsole = []
const allErrors = []
page.on('console', (msg) => {
  allConsole.push(`[${msg.type()}] ${msg.text()}`)
})
page.on('pageerror', (err) => {
  allErrors.push(err.stack || err.message || String(err))
})

// 用本地 preview 加载（生产构建，但本地服务，可看到完整错误）
await page.goto('http://localhost:4184/?stage=s7_xiandai', {
  waitUntil: 'networkidle',
  timeout: 60000,
})
await page.waitForTimeout(2000)

// 点击 5 次：两千年后 → 洛阳北邙山 → 古墓博物馆 → 胸口 → 一阵剧痛 → 三个镜头
for (let i = 0; i < 5; i++) {
  await page.mouse.click(640, 360)
  await page.waitForTimeout(800)
}
await page.waitForTimeout(1500)

console.log('\n========== 完整 console 日志 ==========')
allConsole.forEach((line) => console.log(line))

console.log('\n========== 完整错误堆栈 ==========')
allErrors.forEach((err) => console.log(err))

console.log('\n========== 错误数量 ==========')
console.log('Console messages:', allConsole.length)
console.log('Page errors:', allErrors.length)

await browser.close()