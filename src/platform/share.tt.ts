/**
 * 抖音小游戏分享适配器
 * 使用 tt.shareAppMessage / tt.showShareMenu
 * 提审版必须使用此文件
 */

declare const tt: {
  shareAppMessage(opts: {
    title?: string
    desc?: string
    imageUrl?: string
    query?: string
    channel?: string
  }): void
  showShareMenu(opts?: { withShareTicket?: boolean }): void
  onShareAppMessage(fn: (opts: { from: string; target?: unknown }) => ShareOptions): void
}

export interface ShareOptions {
  title?: string
  desc?: string
  url?: string
  imageUrl?: string
  channel?: string  // 抖音特有：分享渠道（"video" / "live" / "chat"）
}

export function shareToWechat(opts: ShareOptions): Promise<boolean> {
  // 抖音小游戏无微信分享，降级为抖音分享
  return shareToTimeline(opts)
}

export function shareToTimeline(opts: ShareOptions): Promise<boolean> {
  try {
    tt.shareAppMessage({
      title: opts.title,
      desc: opts.desc,
      imageUrl: opts.imageUrl,
      channel: opts.channel ?? 'video',
    })
    return Promise.resolve(true)
  } catch (e) {
    console.warn('[share.tt] shareToTimeline failed:', e)
    return Promise.resolve(false)
  }
}

export function showShareMenu(): void {
  try {
    tt.showShareMenu({ withShareTicket: true })
  } catch (e) {
    console.warn('[share.tt] showShareMenu failed:', e)
  }
}

/**
 * 全局分享配置（在 App.onLaunch 中调用）
 */
export function setupGlobalShare(getOpts: () => ShareOptions): void {
  try {
    tt.onShareAppMessage(() => getOpts())
  } catch (e) {
    console.warn('[share.tt] setupGlobalShare failed:', e)
  }
}
