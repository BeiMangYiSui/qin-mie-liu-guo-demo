/**
 * 平台适配器统一入口（微信小游戏版）
 * 提审版构建时使用此文件
 */

export { storage } from './storage.wx'
export { createAudio, unlockAudio } from './audio.wx'
export type { AudioHandle } from './audio.wx'
export { loadImage, prefetchImage, prefetchImages } from './image.wx'
export type { ImageHandle } from './image.wx'
export { navigate, replace, goBack, reLaunch, getCurrentStage, onNavigate } from './router.wx'
export { shareToWechat, shareToTimeline, showShareMenu, setupGlobalShare } from './share.wx'
export type { ShareOptions } from './share.wx'

export const IS_MINI_GAME = true
export const PLATFORM_NAME = 'wechat'
