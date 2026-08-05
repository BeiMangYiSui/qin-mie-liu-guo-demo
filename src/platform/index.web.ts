/**
 * 平台适配器统一入口（浏览器版）
 * 当前 Web Demo 使用此文件
 */

export { storage } from './storage.web'
export { createAudio, unlockAudio } from './audio.web'
export type { AudioHandle } from './audio.web'
export { loadImage, prefetchImage, prefetchImages } from './image.web'
export type { ImageHandle } from './image.web'
export { navigate, replace, goBack, getCurrentStage, onNavigate } from './router.web'
export type { Stage } from './router.web'
export { shareToWechat, shareToTimeline, showShareMenu } from './share.web'
export type { ShareOptions } from './share.web'

export const IS_MINI_GAME = false
export const PLATFORM_NAME = 'web'
