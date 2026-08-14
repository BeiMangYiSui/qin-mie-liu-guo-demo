// 捕获 React 内部完整错误日志
import { chromium } from 'playwright'

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
})
const page = await context.newPage()

const allMessages = []
page.on('console', (msg) => {
  allMessages.push({ type: msg.type(), text: msg.text() })
})
page.on('pageerror', (err) => {
  allMessages.push({ type: 'pageerror', text: err.stack || err.message || String(err) })
})

await page.goto('http://localhost:4180/?stage=s7_xiandai', {
  waitUntil: 'networkidle',
  timeout: 60000,
})
await page.waitForTimeout(2000)

// 监听 React 错误
await page.addInitScript(() => {
  const origError = console.error
  console.error = (...args) => {
    const stack = args[0] && args[0].stack ? args[0].stack : new Error().stack
    origError.apply(console, [...args, '\nSTACK:', stack])
  }
})

// 点击 5 次
for (let i = 0; i < 5; i++) {
  await page.mouse.click(640, 360)
  await page.waitForTimeout(800)
}
await page.waitForTimeout(1500)

console.log('========== 所有 console 消息 ==========')
allMessages.forEach((m, i) => {
  console.log(`[${i}] [${m.type}] ${m.text}`)
})

// 尝试读取 React 内部的错误信息
const reactErrorInfo = await page.evaluate(() => {
  // 检查 React fiber 树找到错误组件
  const root = document.querySelector('#root')
  if (!root) return 'no root'
  const fiberKey = Object.keys(root).find((k) => k.startsWith('__reactContainer'))
  if (!fiberKey) return 'no fiber key'
  return 'fiber found'
})
console.log('\nReact info:', reactErrorInfo)

await browser.close()