/**
 * 微信小游戏分享适配器
 * 使用 wx.shareAppMessage / wx.showShareMenu
 * 提审版必须使用此文件
 *
 * 微信小游戏分享限制：
 * - 必须是「主动转发」事件触发
 * - 需在 button 组件 open-type="share" 上触发
 * - 或在 onShareAppMessage 生命周期中配置
 */

declare const wx: {
  shareAppMessage(opts: {
    title?: string
    desc?: string
    imageUrl?: string
    query?: string
  }): void
  showShareMenu(opts?: { withShareTicket?: boolean }): void
  onShareAppMessage(fn: (opts: { from: string; target?: unknown }) => ShareOptions): void
}

export interface ShareOptions {
  title?: string
  desc?: string
  url?: string
  imageUrl?: string
}

export function shareToWechat(opts: ShareOptions): Promise<boolean> {
  try {
    wx.shareAppMessage({
      title: opts.title,
      desc: opts.desc,
      imageUrl: opts.imageUrl,
    })
    return Promise.resolve(true)
  } catch (e) {
    console.warn('[share.wx] shareToWechat failed:', e)
    return Promise.resolve(false)
  }
}

export function shareToTimeline(opts: ShareOptions): Promise<boolean> {
  // 微信小游戏暂不支持直接分享朋友圈，返回 shareToWechat
  return shareToWechat(opts)
}

export function showShareMenu(): void {
  try {
    wx.showShareMenu({ withShareTicket: true })
  } catch (e) {
    console.warn('[share.wx] showShareMenu failed:', e)
  }
}

/**
 * 全局分享配置（在 App.onLaunch 中调用）
 */
export function setupGlobalShare(getOpts: () => ShareOptions): void {
  try {
    wx.onShareAppMessage(() => getOpts())
  } catch (e) {
    console.warn('[share.wx] setupGlobalShare failed:', e)
  }
}
