/**
 * 浏览器版路由适配器
 * 使用 history API 实现页面切换
 * 提审版（小游戏）请改用 router.wx.ts 或 router.tt.ts
 */

export type Stage =
  | 'title'
  | 'chapter_card'
  | 's1_anfa'
  | 's1_statement'
  | 's1_anfa_after'
  | 's2_shenxun'
  | 's3_chaqu'
  | 's3_chaan'
  | 's3_chaqu_after'
  | 's4_andun'
  | 's5_zhuishi'
  | 's5_battle'
  | 's5_zhuishi_after'
  | 's6_fusha'
  | 's6_battle'
  | 's6_fusha_after'
  | 's6_yuenu_battle'
  | 's6_fusha_fall'
  | 's7_xiandai'
  | 's8_nongjia'
  | 's9_tongxing'
  | 's9_battle'
  | 's9_tongxing_after'
  | 's10_guace'
  | 'c1_pinan'
  | 'c1_case'
  | 'c1_pinan_after'
  | 'c2_zhangtai'
  | 'c3_guoshu'
  | 'c4_husong'
  | 'c4_battle'
  | 'c4_husong_after'
  | 'c5_shouxiang'
  | 'c6_yiying'
  | 'c6_huipai_battle'
  | 'c7_huoqi'
  | 'c7_choice'
  | 'c7_fire'
  | 'c7_troops'
  | 'c7_evac'
  | 'c7_huoqi_after'
  | 'c8_zhangmo'
  | 'c8_settle'
  | 'shicheng'
  | 'end'

/**
 * 跳转到指定场景
 */
export function navigate(stage: Stage): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set('stage', stage)
  window.history.pushState({}, '', url)
  // 触发自定义事件，供 React 监听
  window.dispatchEvent(new CustomEvent('qmlg:navigate', { detail: { stage } }))
}

/**
 * 替换当前场景（不产生历史记录）
 */
export function replace(stage: Stage): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set('stage', stage)
  window.history.replaceState({}, '', url)
  window.dispatchEvent(new CustomEvent('qmlg:navigate', { detail: { stage } }))
}

/**
 * 返回上一场景
 */
export function goBack(): void {
  if (typeof window === 'undefined') return
  window.history.back()
}

/**
 * 获取当前场景
 */
export function getCurrentStage(): Stage | null {
  if (typeof window === 'undefined') return null
  const url = new URL(window.location.href)
  const stage = url.searchParams.get('stage')
  return (stage as Stage) || null
}

/**
 * 监听场景变化
 */
export function onNavigate(callback: (stage: Stage) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail
    callback(detail.stage)
  }
  window.addEventListener('qmlg:navigate', handler)
  window.addEventListener('popstate', () => {
    const stage = getCurrentStage()
    if (stage) callback(stage)
  })
  return () => {
    window.removeEventListener('qmlg:navigate', handler)
  }
}
