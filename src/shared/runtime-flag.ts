/**
 * 运行时平台判定（轻量包装）
 *
 * 背景：
 *   - 浏览器版 vite config 没有 define MINIGAME_BUILD → 此模块 IS_MINI_GAME = false
 *   - 微信小游戏版 vite config define: 'process.env.MINIGAME_BUILD' = '"true"' → IS_MINI_GAME = true
 *   - 抖音小游戏版同上
 *
 * 设计目的：
 *   把"是否小游戏"这一判定从 src/platform 入口剥离开。
 *   本文件不依赖 `@/platform` 别名，因此 `src/game`、`src/lib` 等
 *   即使不通过 platform 适配器也能拿到稳定常量。
 *
 * 配合：在 vite.config.minigame.ts 与 vite.config.minigame.douyin.ts 中
 * 必须 define:
 *   'process.env.MINIGAME_BUILD': '"true"'
 *   'process.env.PLATFORM_NAME': '"wechat"' | '"douyin"'
 */

declare const process: { env: Record<string, string | undefined> }

export const IS_MINI_GAME: boolean = process.env.MINIGAME_BUILD === 'true'
export const PLATFORM_NAME: string = process.env.PLATFORM_NAME ?? 'web'
