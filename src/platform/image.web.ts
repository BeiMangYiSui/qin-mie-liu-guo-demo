/**
 * 浏览器版图片加载适配器
 * 使用 HTMLImageElement 实现图片加载
 *
 * 提审版（小游戏）请改用：
 *   - src/platform/image.wx.ts（微信小游戏）
 *   - src/platform/image.tt.ts（抖音小游戏）
 */

export interface ImageHandle {
  /** 图片 URL */
  src: string
  /** 原始宽度 */
  width: number
  /** 原始高度 */
  height: number
  /** 是否已加载完成 */
  loaded: boolean
  /** 销毁释放资源 */
  destroy(): void
}

/**
 * 创建一个图片加载器
 * @param src 图片 URL
 * @returns Promise<ImageHandle>
 */
export function loadImage(src: string): Promise<ImageHandle> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      resolve({
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        loaded: true,
        destroy: () => {
          img.src = ''
          img.onload = null
          img.onerror = null
        },
      })
    }
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`))
    }
    img.src = src
  })
}

/**
 * 预取图片（不返回 ImageHandle，仅缓存到浏览器）
 * @param src 图片 URL
 */
export function prefetchImage(src: string): Promise<void> {
  return loadImage(src).then(() => undefined).catch(() => undefined)
}

/**
 * 批量预取图片
 * @param srcs 图片 URL 列表
 */
export async function prefetchImages(srcs: string[]): Promise<void> {
  await Promise.allSettled(srcs.map(prefetchImage))
}
