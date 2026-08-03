import { useEffect, useState } from 'react'

const pendingLoads = new Map<string, Promise<string | null>>()

/**
 * 预加载单张图片，返回 Promise（成功返回 src，失败返回 null）。
 * 同一 URL 只发起一次请求，重复调用共享同一个 Promise。
 */
export function preloadImage(src: string): Promise<string | null> {
  if (!src) return Promise.resolve(null)
  const existing = pendingLoads.get(src)
  if (existing) return existing
  const promise = new Promise<string | null>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(src)
    img.onerror = () => resolve(null)
    img.src = src
  })
  pendingLoads.set(src, promise)
  return promise
}

export function preloadImages(srcs: readonly string[]) {
  srcs.forEach((src) => void preloadImage(src))
}

/**
 * 背景图平滑切换：src 变化后先后台下载新图，下载完成前继续显示旧图，
 * 避免切场景时出现黑底/空底闪烁。首次加载完成前返回 null。
 */
export function useLoadedImage(src?: string | null): string | null {
  const [readySrc, setReadySrc] = useState<string | null>(() => {
    if (!src) return null
    // 浏览器缓存命中（含 preload 标签与上一场景已加载的图）时直接显示，无需等待
    const cached = new Image()
    cached.src = src
    return cached.complete && cached.naturalWidth > 0 ? src : null
  })

  useEffect(() => {
    if (!src) {
      setReadySrc(null)
      return
    }
    if (readySrc === src) return
    let alive = true
    void preloadImage(src).then((loaded) => {
      if (alive && loaded) setReadySrc(loaded)
    })
    return () => {
      alive = false
    }
    // readySrc 刻意不入依赖：只在 src 变化时触发加载，避免状态回环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  return readySrc
}
