import { preloadImages } from '../hooks/useLoadedImage'
import { SCENES } from '../game/story'

// 按剧情顺序取前 N 个场景的背景图（SCENES 定义顺序即剧情推进顺序）
function sceneBackgroundsInOrder(count: number): string[] {
  const urls: string[] = []
  for (const scene of Object.values(SCENES)) {
    if (scene.bg && !urls.includes(scene.bg)) {
      urls.push(scene.bg)
      if (urls.length >= count) break
    }
  }
  return urls
}

let scenesPreloadStarted = false

/**
 * 标题页展示期间分级预取场景背景，避免一次性预取全部 26 张图在慢网络下互相争抢带宽：
 * 1. 立即预取首个剧情场景背景（玩家点开始后立刻要用）；
 * 2. 空闲时再预取后续 3 个场景背景（约 1MB，慢网络下几秒内完成）；
 * 3. 其余场景背景与战斗立绘不预取，由 useLoadedImage 在进入场景/战斗时按需加载。
 * 只执行一次。
 */
export function preloadSceneBackgroundsOnce() {
  if (scenesPreloadStarted) return
  scenesPreloadStarted = true
  // 1. 立即预取首个场景背景，不等待空闲（用户随时可能点开始）
  const first = sceneBackgroundsInOrder(1)
  preloadImages(first)
  // 2. 让出带宽，空闲时再预取后续 3 个场景背景
  const start = () => preloadImages(sceneBackgroundsInOrder(4).slice(1))
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(start, { timeout: 2500 })
  } else {
    window.setTimeout(start, 800)
  }
}
