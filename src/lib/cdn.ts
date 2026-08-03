// 媒体资源 CDN：图片/音频从国外服务器加载（国内手机访问 github.io 媒体文件被运营商屏蔽）
// 页面本身（HTML/JS/CSS）仍从 github.io 加载
export const MEDIA_CDN = 'https://stats.puck-muling.top/game/'

// 资源版本号：CDN 上的媒体文件被替换后递增此值，URL 携带 ?v= 绕过浏览器旧缓存
export const ASSET_VERSION = '20260803'

/** 带版本号的 CDN 资源地址，媒体更新后改 ASSET_VERSION 即可强制客户端拉新 */
export function cdnUrl(relativePath: string) {
  return `${MEDIA_CDN}${relativePath}?v=${ASSET_VERSION}`
}
