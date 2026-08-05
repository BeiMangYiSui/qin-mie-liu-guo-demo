/**
 * 平台适配器统一入口（抖音小游戏版）
 * 提审版构建时使用此文件
 */

export { storage } from './storage.tt'
export { createAudio, unlockAudio } from './audio.tt'
export type { AudioHandle } from './audio.tt'
export { loadImage, prefetchImage, prefetchImages } from './image.tt'
export type { ImageHandle } from './image.tt'
export { navigate, replace, goBack, reLaunch, getCurrentStage, onNavigate } from './router.tt'
export { shareToWechat, shareToTimeline, showShareMenu, setupGlobalShare } from './share.tt'
export type { ShareOptions } from './share.tt'

export const IS_MINI_GAME = true
export const PLATFORM_NAME = 'douyin'
