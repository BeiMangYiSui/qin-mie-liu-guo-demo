// 验证 s7_xiandai 场景修复：通过 URL 参数直接跳到 s7_xiandai，依次点击推进到 "三个镜头——"，检查是否出现 React #300 错误
import { chromium } from 'playwright'

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
})
const page = await context.newPage()

// 收集控制台错误
const consoleErrors = []
const pageErrors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text())
  }
})
page.on('pageerror', (err) => {
  pageErrors.push(err.message || String(err))
})

// 1. 打开线上版本，通过 URL 参数直接跳到 s7_xiandai 场景
await page.goto('https://beimangyisui.github.io/qin-mie-liu-guo-demo/?stage=s7_xiandai', {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
})

// 等待场景加载
await page.waitForTimeout(3000)
await page.screenshot({ path: '/tmp/s7-fix-01-loaded.png' })

const initialText = await page.evaluate(() => {
  const textMask = document.querySelector('[data-testid="story-text-mask"]')
  const main = document.querySelector('main')
  return main ? main.innerText.slice(0, 200) : 'no main'
})
console.log('Initial text:', initialText)

// 2. 依次点击推进 4 次（"两千年后"→"洛阳，北邙山"→"古墓博物馆"→"胸口，同样的位置——"→"一阵剧痛。"）
for (let i = 0; i < 4; i++) {
  await page.mouse.click(640, 360)
  await page.waitForTimeout(800)
}
await page.screenshot({ path: '/tmp/s7-fix-02-after-4-clicks.png' })

const after4Text = await page.evaluate(() => {
  const main = document.querySelector('main')
  return main ? main.innerText.slice(0, 200) : 'no main'
})
console.log('After 4 clicks text:', after4Text)

// 3. 再点击一次，进入 "三个镜头——"（应该触发 S7ShotCard）
await page.mouse.click(640, 360)
await page.waitForTimeout(1500)
await page.screenshot({ path: '/tmp/s7-fix-03-three-shots.png' })

// 4. 检查 S7ShotCard 是否出现
const shotCardVisible = await page.evaluate(() => {
  const card = document.querySelector('[data-testid="s7-shot-card"]')
  if (!card) return { exists: false }
  const rect = card.getBoundingClientRect()
  const style = getComputedStyle(card)
  const img = card.querySelector('img')
  return {
    exists: true,
    visible: style.display !== 'none' && style.visibility !== 'hidden',
    width: rect.width,
    height: rect.height,
    imgSrc: img ? img.getAttribute('src') : null,
    imgComplete: img ? img.complete : null,
    imgNaturalWidth: img ? img.naturalWidth : null,
    opacity: style.opacity,
  }
})
console.log('S7ShotCard state:', JSON.stringify(shotCardVisible, null, 2))

// 5. 检查页面整体是否有内容（非白屏）
const pageContent = await page.evaluate(() => {
  return {
    bodyText: document.body.innerText.length,
    hasImg: document.querySelectorAll('img').length,
    bgVisible: !!document.querySelector('img[src*="bg_luoyang"]'),
  }
})
console.log('Page content:', JSON.stringify(pageContent, null, 2))

// 6. 最终结论
const reactErrors = [...consoleErrors, ...pageErrors].filter(
  (e) => e.includes('Objects are not valid') || e.includes('#300') || e.includes('React')
)
console.log('\n========== 测试结果 ==========')
console.log('Console errors:', consoleErrors.length)
console.log('Page errors:', pageErrors.length)
console.log('React errors:', reactErrors.length)
if (reactErrors.length > 0) {
  console.log('React error details:')
  reactErrors.forEach((e) => console.log('  -', e))
}
console.log('S7ShotCard 显示:', shotCardVisible.exists && shotCardVisible.visible ? '✅ 正常' : '❌ 未显示')
console.log('页面有内容:', pageContent.bodyText > 0 ? '✅ 是' : '❌ 否')
console.log('==============================')

await browser.close()