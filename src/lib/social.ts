/**
 * 社交 / 关注入口配置
 * 修改此文件即可更新全站的关注链接和二维码。
 */

export const SOCIAL_LINKS = {
  /** 微信二维码图片路径（放在 public/assets/ 下） */
  wechatQr: './assets/wechat-qr.png',
  /** Telegram 二维码图片路径 */
  telegramQr: './assets/telegram-qr.png',
  /** Telegram 用户名链接 */
  telegram: 'https://t.me/BEIMANGYISUI',
  /** B站主页 */
  bilibili: 'https://space.bilibili.com/你的UID',
  /** 机核主页 */
  gcores: 'https://www.gcores.com/users/你的ID',
} as const

/** 是否显示社交入口（素材就绪后改为 true） */
export const SOCIAL_READY = true
