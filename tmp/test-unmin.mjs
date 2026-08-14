// 使用 Playwright 的 evaluate 在页面加载前注入，让 React 输出非压缩错误
import { chromium } from 'playwright'

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
})
const page = await context.newPage()

const allErrors = []
page.on('pageerror', (err) => {
  allErrors.push(err.stack || err.message || String(err))
})

await page.addInitScript(() => {
  // 阻止 React 进入生产模式
  Object.defineProperty(window, '__DEV__', { value: true, writable: false })
  // 拦截错误，确保显示完整堆栈
  const origError = console.error
  console.error = function (...args) {
    origError.apply(console, ['[Intercepted]', ...args])
  }
})

await page.goto('http://localhost:4181/?stage=s7_xiandai', {
  waitUntil: 'networkidle',
  timeout: 60000,
})
await page.waitForTimeout(2000)

for (let i = 0; i < 5; i++) {
  await page.mouse.click(640, 360)
  await page.waitForTimeout(800)
}
await page.waitForTimeout(1500)

console.log('========== 错误详情 ==========')
allErrors.forEach((e, i) => console.log(`\n[Error ${i}]\n${e}\n`))

await browser.close()