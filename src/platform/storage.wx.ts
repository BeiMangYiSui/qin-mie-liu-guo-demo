/**
 * 微信小游戏存储适配器
 * 使用 wx.getStorageSync / wx.setStorageSync / wx.removeStorageSync
 *
 * 提审版必须使用此文件（替换 storage.web.ts）
 * 抖音小游戏请改用 storage.tt.ts
 *
 * 注意：抖音小游戏也支持 wx 全局 API（兼容模式），
 *      但官方推荐使用 tt.* 系列。如果只面向微信，使用本文件即可。
 */

declare const wx: {
  getStorageSync(key: string): string | undefined
  setStorageSync(key: string, value: string): void
  removeStorageSync(key: string): void
  getStorageInfoSync(): { keys: string[] }
}

const PREFIX = 'qmlg:'

export const storage = {
  get(key: string): string | null {
    try {
      const value = wx.getStorageSync(PREFIX + key)
      return value === undefined || value === '' ? null : value
    } catch (e) {
      console.warn('[storage.wx] get failed:', key, e)
      return null
    }
  },

  set(key: string, value: string): void {
    try {
      wx.setStorageSync(PREFIX + key, value)
    } catch (e) {
      console.warn('[storage.wx] set failed:', key, e)
    }
  },

  remove(key: string): void {
    try {
      wx.removeStorageSync(PREFIX + key)
    } catch (e) {
      console.warn('[storage.wx] remove failed:', key, e)
    }
  },

  keys(): string[] {
    try {
      const info = wx.getStorageInfoSync()
      return info.keys
        .filter((k) => k.startsWith(PREFIX))
        .map((k) => k.slice(PREFIX.length))
    } catch (e) {
      console.warn('[storage.wx] keys failed:', e)
      return []
    }
  },

  clear(): void {
    try {
      const keys = this.keys()
      for (const k of keys) {
        wx.removeStorageSync(PREFIX + k)
      }
    } catch (e) {
      console.warn('[storage.wx] clear failed:', e)
    }
  },
}
