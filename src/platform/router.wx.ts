/**
 * 微信小游戏路由适配器
 * 使用 wx.navigateTo / wx.redirectTo / wx.navigateBack
 * 提审版必须使用此文件
 */

declare const wx: {
  navigateTo(opts: { url: string }): void
  redirectTo(opts: { url: string }): void
  navigateBack(opts?: { delta?: number }): void
  reLaunch(opts: { url: string }): void
}

declare const getCurrentPages: () => Array<{ route?: string }>

export type Stage = string

/**
 * 跳转到指定场景
 * 微信小游戏：每个 scene 编译为独立页面，提审版需要每个页面编译一份
 */
export function navigate(stage: Stage): void {
  try {
    wx.navigateTo({ url: `/pages/${stage}/${stage}` })
  } catch (e) {
    console.warn('[router.wx] navigate failed:', stage, e)
  }
}

/**
 * 替换当前场景
 */
export function replace(stage: Stage): void {
  try {
    wx.redirectTo({ url: `/pages/${stage}/${stage}` })
  } catch (e) {
    console.warn('[router.wx] replace failed:', stage, e)
  }
}

/**
 * 返回上一场景
 */
export function goBack(delta: number = 1): void {
  try {
    wx.navigateBack({ delta })
  } catch (e) {
    console.warn('[router.wx] goBack failed:', e)
  }
}

/**
 * 重启到首页
 */
export function reLaunch(stage: Stage): void {
  try {
    wx.reLaunch({ url: `/pages/${stage}/${stage}` })
  } catch (e) {
    console.warn('[router.wx] reLaunch failed:', stage, e)
  }
}

/**
 * 获取当前场景（小程序无 URL 参数，需通过 getCurrentPages 获取）
 */
export function getCurrentStage(): Stage | null {
  try {
    const pages = (typeof getCurrentPages === 'function' ? getCurrentPages() : []) as Array<{ route?: string }>
    const current = pages[pages.length - 1]
    if (!current?.route) return null
    const match = current.route.match(/\/pages\/([^/]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * 监听场景变化（占位 - 小游戏无路由事件，需手动实现）
 */
export function onNavigate(callback: (stage: Stage) => void): () => void {
  // 微信小游戏无路由事件，需在 App.onShow 监听
  void callback
  return () => {}
}
