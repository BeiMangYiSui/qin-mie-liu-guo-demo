/**
 * 浏览器版分享适配器
 * 浏览器版：不接入分享，使用 Web Share API 或复制链接
 */

export interface ShareOptions {
  title?: string
  desc?: string
  url?: string
  imageUrl?: string
}

/**
 * 分享到微信好友（仅在小游戏环境有效）
 * 浏览器版：降级为复制链接
 */
export async function shareToWechat(opts: ShareOptions): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: opts.title,
        text: opts.desc,
        url: opts.url,
      })
      return true
    } catch {
      return false
    }
  }
  // 降级：复制到剪贴板
  if (opts.url && typeof navigator.clipboard?.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(opts.url)
      return true
    } catch {
      return false
    }
  }
  return false
}

/**
 * 分享到朋友圈（仅在小游戏环境有效）
 * 浏览器版：降级为复制链接
 */
export async function shareToTimeline(opts: ShareOptions): Promise<boolean> {
  return shareToWechat(opts)
}

/**
 * 显示分享菜单
 */
export function showShareMenu(): void {
  // 浏览器版为空操作
}
