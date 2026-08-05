/**
 * 微信小游戏图片加载适配器
 * 使用 wx.createImage() 创建图片对象
 * 提审版必须使用此文件
 */

declare const wx: {
  createImage(): {
    src: string
    width: number
    height: number
    onload(cb: () => void): void
    onerror(cb: (err: unknown) => void): void
  }
}

export interface ImageHandle {
  src: string
  width: number
  height: number
  loaded: boolean
  destroy(): void
}

export function loadImage(src: string): Promise<ImageHandle> {
  return new Promise((resolve, reject) => {
    const img = wx.createImage()
    img.onload(() => {
      resolve({
        src: img.src,
        width: img.width,
        height: img.height,
        loaded: true,
        destroy: () => {
          img.src = ''
        },
      })
    })
    img.onerror((err) => {
      reject(new Error(`Failed to load image: ${src} (${JSON.stringify(err)})`))
    })
    img.src = src
  })
}

export function prefetchImage(src: string): Promise<void> {
  return loadImage(src).then(() => undefined).catch(() => undefined)
}

export async function prefetchImages(srcs: string[]): Promise<void> {
  await Promise.allSettled(srcs.map(prefetchImage))
}
