/**
 * 浏览器版存储适配器
 * 使用 localStorage 实现存档读写
 *
 * 提审版（小游戏）请改用：
 *   - src/platform/storage.wx.ts（微信小游戏）
 *   - src/platform/storage.tt.ts（抖音小游戏）
 */

const PREFIX = 'qmlg:'

export const storage = {
  /**
   * 读取指定 key 的字符串值
   * @param key 存储 key（不带前缀）
   * @returns 字符串值，不存在时返回 null
   */
  get(key: string): string | null {
    try {
      return localStorage.getItem(PREFIX + key)
    } catch (e) {
      console.warn('[storage.web] get failed:', key, e)
      return null
    }
  },

  /**
   * 写入指定 key 的字符串值
   * @param key 存储 key（不带前缀）
   * @param value 字符串值
   */
  set(key: string, value: string): void {
    try {
      localStorage.setItem(PREFIX + key, value)
    } catch (e) {
      console.warn('[storage.web] set failed:', key, e)
    }
  },

  /**
   * 删除指定 key
   * @param key 存储 key（不带前缀）
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key)
    } catch (e) {
      console.warn('[storage.web] remove failed:', key, e)
    }
  },

  /**
   * 列出所有以 PREFIX 开头的 key（不含前缀）
   */
  keys(): string[] {
    const keys: string[] = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(PREFIX)) {
          keys.push(k.slice(PREFIX.length))
        }
      }
    } catch (e) {
      console.warn('[storage.web] keys failed:', e)
    }
    return keys
  },

  /**
   * 清空所有应用存档
   */
  clear(): void {
    try {
      const keys = this.keys()
      for (const k of keys) {
        localStorage.removeItem(PREFIX + k)
      }
    } catch (e) {
      console.warn('[storage.web] clear failed:', e)
    }
  },
}
