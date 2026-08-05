/**
 * 抖音小游戏存储适配器
 * 使用 tt.getStorageSync / tt.setStorageSync / tt.removeStorageSync
 *
 * 提审版必须使用此文件（替换 storage.web.ts）
 * 微信小游戏请改用 storage.wx.ts
 */

declare const tt: {
  getStorageSync(key: string): string | undefined
  setStorageSync(key: string, value: string): void
  removeStorageSync(key: string): void
  getStorageInfoSync(): { keys: string[] }
}

const PREFIX = 'qmlg:'

export const storage = {
  get(key: string): string | null {
    try {
      const value = tt.getStorageSync(PREFIX + key)
      return value === undefined || value === '' ? null : value
    } catch (e) {
      console.warn('[storage.tt] get failed:', key, e)
      return null
    }
  },

  set(key: string, value: string): void {
    try {
      tt.setStorageSync(PREFIX + key, value)
    } catch (e) {
      console.warn('[storage.tt] set failed:', key, e)
    }
  },

  remove(key: string): void {
    try {
      tt.removeStorageSync(PREFIX + key)
    } catch (e) {
      console.warn('[storage.tt] remove failed:', key, e)
    }
  },

  keys(): string[] {
    try {
      const info = tt.getStorageInfoSync()
      return info.keys
        .filter((k) => k.startsWith(PREFIX))
        .map((k) => k.slice(PREFIX.length))
    } catch (e) {
      console.warn('[storage.tt] keys failed:', e)
      return []
    }
  },

  clear(): void {
    try {
      const keys = this.keys()
      for (const k of keys) {
        tt.removeStorageSync(PREFIX + k)
      }
    } catch (e) {
      console.warn('[storage.tt] clear failed:', e)
    }
  },
}
