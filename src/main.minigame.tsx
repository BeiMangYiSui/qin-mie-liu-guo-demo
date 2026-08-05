/**
 * 微信/抖音小游戏提审版入口
 *
 * 与浏览器版区别：
 * 1. 关闭 URL 参数预览页（ui-preview / task-c-preview / stage）
 * 2. 关闭社交外链（社交二维码、B 站、机核、Telegram）
 * 3. 强制展示健康游戏忠告
 * 4. 强制展示适龄提示
 * 5. 接入侧边栏复访能力（抖音必接）
 * 6. 首次用户交互后解锁音频
 *
 * 浏览器版对照：src/main.tsx
 */

import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
// 适配器入口来自 vite alias；运行时仍通过 runtime-flag 拿到 IS_MINI_GAME。
import { unlockAudio } from '@/platform'
import { IS_MINI_GAME } from '@/shared/runtime-flag'
import './index.css'

// 提审版：禁用所有 URL 参数预览
const PREVIEW_PARAMS = ['ui-preview', 'task-c-preview', 'stage', 'preview']
function checkPreviewParams() {
  if (typeof window === 'undefined') return false
  const url = new URL(window.location.href)
  return PREVIEW_PARAMS.some((p) => url.searchParams.has(p))
}

// 提审版：健康游戏忠告（必须在标题页或启动页展示）
const HEALTH_ADVICE =
  '抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。'

// 提审版：适龄提示
const AGE_RATING = '12+'

function MiniGameBootstrap() {
  const [blocked] = useState(checkPreviewParams())
  const [showHealth, setShowHealth] = useState(true)

  useEffect(() => {
    if (blocked) {
      console.warn('[minigame] preview mode is blocked in production build')
    }
  }, [blocked])

  // 首次用户交互：解锁音频
  const handleFirstInteraction = () => {
    unlockAudio()
    setShowHealth(false)
  }

  if (blocked) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>
        <h1>提审版禁用了预览模式</h1>
        <p>请使用真实提审账号登录后访问。</p>
      </div>
    )
  }

  if (showHealth) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#1a1b1f',
          color: '#f0e0c0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          textAlign: 'center',
          cursor: 'pointer',
        }}
        onClick={handleFirstInteraction}
      >
        <h1 style={{ fontSize: 48, marginBottom: 24 }}>秦灭六国</h1>
        <p style={{ fontSize: 18, marginBottom: 32, opacity: 0.8 }}>
          战国末年叙事策略小游戏 · {AGE_RATING}
        </p>
        <p style={{ fontSize: 14, lineHeight: 2, maxWidth: 480, opacity: 0.7 }}>
          {HEALTH_ADVICE}
        </p>
        <p style={{ marginTop: 40, fontSize: 16, opacity: 0.6 }}>
          点击屏幕开始
        </p>
      </div>
    )
  }

  return <App />
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(<MiniGameBootstrap />)
  console.log(`[minigame] mini-game build initialized, IS_MINI_GAME=${IS_MINI_GAME}`)
}

/**
 * 抖音小游戏侧边栏接口的最小声明（仅用到的成员）
 */
declare const tt:
  | undefined
  | {
      getSideBarMenu?: (opts: {
        items: Array<{ type: 'home' | 'reload'; text: string }>
      }) => void
    }

// 抖音小游戏：接入侧边栏复访能力（官方必接）
if (typeof tt !== 'undefined' && tt.getSideBarMenu) {
  tt.getSideBarMenu({
    items: [
      { type: 'home', text: '首页' },
      { type: 'reload', text: '重新开始' },
    ],
  })
}
