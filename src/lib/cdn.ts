// 媒体资源 CDN：
// - 浏览器版（默认）：指向境外 stats.puck-muling.top/game/，仅作为开发预览
// - 小游戏提审版（MINIGAME_BUILD=true）：返回包内相对路径 ./assets/...
//   资源在提审版打入包或迁移至已备案、境内、HTTPS 的资源域名后才能上线
import { IS_MINI_GAME } from '../shared/runtime-flag'

export const MEDIA_CDN = IS_MINI_GAME ? '' : 'https://stats.puck-muling.top/game/'

// 资源版本号：CDN 上的媒体文件被替换后递增此值，URL 携带 ?v= 绕过浏览器旧缓存
export const ASSET_VERSION = '20260803'

/**
 * 带版本号的媒体资源地址。
 * - 浏览器版：返回 CDN URL
 * - 小游戏版：返回包内绝对路径（保留 public/ 下的原始目录结构）
 *   public/voice/* → /voice/*
 *   public/bgm/*   → /bgm/*
 *   public/sfx/*   → /sfx/*
 *   public/assets/* → /assets/*
 *   不要用 `./xxx/...` 相对路径，因为 webview 入口在 pages/index/index.html，
 *   运行时 `./voice/...` 会变成 pages/index/voice/... 而找不到。
 */
export function cdnUrl(relativePath: string) {
  if (IS_MINI_GAME) {
    return relativePath.startsWith('/') ? relativePath : `/${relativePath}`
  }
  return `${MEDIA_CDN}${relativePath}?v=${ASSET_VERSION}`
}
