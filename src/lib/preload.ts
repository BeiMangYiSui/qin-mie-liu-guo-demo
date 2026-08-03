import { preloadImages } from '../hooks/useLoadedImage'
import { SCENES } from '../game/story'

// MountShell 挂载点硬编码的背景（不在 SCENES.bg 里，需单独收集）
const EXTRA_BACKGROUNDS = [
  'https://stats.puck-muling.top/game/assets/bg_guanshu_huo.webp',
]

// 战斗立绘 sprite（战场底为 CSS 渐变，立绘慢加载不会黑屏，但预取可避免人物突入）
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
].map((name) => `https://stats.puck-muling.top/game/assets/battle/${name}.webp`)

function collectSceneBackgrounds(): string[] {
  const urls = new Set<string>()
  for (const scene of Object.values(SCENES)) {
    if (scene.bg) urls.add(scene.bg)
  }
  EXTRA_BACKGROUNDS.forEach((url) => urls.add(url))
  BATTLE_SPRITES.forEach((url) => urls.add(url))
  return [...urls]
}

let scenesPreloadStarted = false

/** 标题页展示期间后台预取全部剧情场景背景，进入任何场景都命中浏览器缓存。只执行一次。 */
export function preloadSceneBackgroundsOnce() {
  if (scenesPreloadStarted) return
  scenesPreloadStarted = true
  // 让出主线程与带宽，避免与标题页首屏资源抢请求
  const start = () => preloadImages(collectSceneBackgrounds())
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(start, { timeout: 2500 })
  } else {
    window.setTimeout(start, 800)
  }
}
