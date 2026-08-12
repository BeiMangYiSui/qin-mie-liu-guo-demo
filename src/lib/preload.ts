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

// 战斗立绘 sprite（按需加载会在进入战斗时才下载，慢网络下角色空白；
// 故放到空闲批次随场景背景一并预取，但排在背景之后避免争抢首屏带宽）
const BATTLE_SPRITES = [
  'hero_beimang_idle_v1',
  'hero_mengjia_idle_v2',
  'hero_xiaoman_idle_v1',
  'hero_qingling_idle_v1',
  'enemy_assassin_idle_v1',
  'enemy_crossbow_idle_v1',
  'enemy_hanwu_idle_v1',
  'enemy_hanzu_idle_v1',
  'enemy_rider_idle_v1',
  'enemy_toumu_idle_v1',
  'enemy_zonghuo_idle_v1',
].map((name) => `./assets/battle/${name}.webp`)

let scenesPreloadStarted = false

/**
 * 标题页展示期间分级预取，避免一次性预取全部 26 张图在慢网络下互相争抢带宽：
 * 1. 立即预取首个剧情场景背景（玩家点开始后立刻要用）；
 * 2. 空闲时再预取后续 3 个场景背景 + 全部战斗立绘（背景优先，立绘随后），
 *    确保进入战斗时角色立绘已缓存、不出现空白；
 * 3. 其余场景背景不预取，由 useLoadedImage 在进入场景时按需加载。
 * 只执行一次。
 */
export function preloadSceneBackgroundsOnce() {
  if (scenesPreloadStarted) return
  scenesPreloadStarted = true
  // 1. 立即预取首个场景背景，不等待空闲（用户随时可能点开始）
  const first = sceneBackgroundsInOrder(1)
  preloadImages(first)
  // 2. 让出带宽，空闲时先取后续 3 个场景背景，再接战斗立绘
  const start = () =>
    preloadImages([...sceneBackgroundsInOrder(4).slice(1), ...BATTLE_SPRITES])
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(start, { timeout: 2500 })
  } else {
    window.setTimeout(start, 800)
  }
}
