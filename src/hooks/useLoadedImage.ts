import { useEffect, useState } from 'react'
import { IS_MINI_GAME } from '@/shared/runtime-flag'
import { loadImage as platformLoadImage } from '@/platform'

const pendingLoads = new Map<string, Promise<string | null>>()

/**
 * 预加载单张图片，返回 Promise（成功返回 src，失败返回 null）。
 * 同一 URL 只发起一次请求，重复调用共享同一个 Promise。
 *
 * 平台分流：
 * - 浏览器版：直接 new Image()（保留浏览器缓存命中即返回的同步路径，<img> preload 命中）
 * - 小游戏版：走 src/platform/image.{wx,tt}.ts 的 loadImage() Promise
 */
export function preloadImage(src: string): Promise<string | null> {
  if (!src) return Promise.resolve(null)
  const existing = pendingLoads.get(src)
  if (existing) return existing
  const promise = new Promise<string | null>((resolve) => {
    if (IS_MINI_GAME) {
      // 小游戏路径：走 platform adapter 的 Image API
      platformLoadImage(src)
        .then(() => resolve(src))
        .catch(() => resolve(null))
      return
    }
    // 浏览器路径：直接 new Image()（保留同步缓存命中能力）
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
 *
 * 浏览器路径保留对 cached.complete + naturalWidth 的同步缓存探测；
 * 小游戏路径没有同步 Image API，必须等 Promise resolve 才显示。
 */
export function useLoadedImage(src?: string | null): string | null {
  const [readySrc, setReadySrc] = useState<string | null>(() => {
    if (!src) return null
    if (IS_MINI_GAME) {
      // 小游戏无法同步判断缓存命中，首帧直接 null；useEffect 会重新拉
      return null
    }
    // 浏览器版：缓存命中（含 preload 标签与上一场景已加载的图）时直接显示
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
