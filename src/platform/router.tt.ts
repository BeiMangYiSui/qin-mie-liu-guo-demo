/**
 * 抖音小游戏路由适配器
 * 使用 tt.navigateTo / tt.redirectTo / tt.navigateBack
 * 提审版必须使用此文件
 */

declare const tt: {
  navigateTo(opts: { url: string }): void
  redirectTo(opts: { url: string }): void
  navigateBack(opts?: { delta?: number }): void
  reLaunch(opts: { url: string }): void
}

declare const getCurrentPages: () => Array<{ route?: string }>

export type Stage = string

export function navigate(stage: Stage): void {
  try {
    tt.navigateTo({ url: `/pages/${stage}/${stage}` })
  } catch (e) {
    console.warn('[router.tt] navigate failed:', stage, e)
  }
}

export function replace(stage: Stage): void {
  try {
    tt.redirectTo({ url: `/pages/${stage}/${stage}` })
  } catch (e) {
    console.warn('[router.tt] replace failed:', stage, e)
  }
}

export function goBack(delta: number = 1): void {
  try {
    tt.navigateBack({ delta })
  } catch (e) {
    console.warn('[router.tt] goBack failed:', e)
  }
}

export function reLaunch(stage: Stage): void {
  try {
    tt.reLaunch({ url: `/pages/${stage}/${stage}` })
  } catch (e) {
    console.warn('[router.tt] reLaunch failed:', stage, e)
  }
}

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

export function onNavigate(callback: (stage: Stage) => void): () => void {
  void callback
  return () => {}
}
