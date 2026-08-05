/**
 * 社交 / 关注入口配置
 * 修改此文件即可更新全站的关注链接和二维码。
 *
 * 小游戏提审版（MINIGAME_BUILD=true）下 SOCIAL_READY 强制为 false，
 * 用以关闭外链与二维码，避免出现"恶意站外引流"等审核红线。
 */

import { IS_MINI_GAME } from '../shared/runtime-flag'

export const SOCIAL_LINKS = {
  /** 微信二维码图片路径（放在 public/assets/ 下） */
  wechatQr: 'https://stats.puck-muling.top/game/assets/wechat-qr.png',
  /** 微信搜索 ID（玩家可手动搜索添加） */
  wechatId: 'beimangyisui',
  /** Telegram 二维码图片路径 */
  telegramQr: 'https://stats.puck-muling.top/game/assets/telegram-qr.png',
  /** Telegram 用户名链接 */
  telegram: 'https://t.me/BEIMANGYISUI',
  /** B站主页 */
  bilibili: 'https://space.bilibili.com/你的UID',
  /** 机核主页 */
  gcores: 'https://www.gcores.com/users/你的ID',
} as const

/**
 * 是否显示社交入口
 * - 浏览器版：默认 true（保留原有 PC 体验）
 * - 小游戏提审版：强制为 false
 */
export const SOCIAL_READY = IS_MINI_GAME ? false : true
