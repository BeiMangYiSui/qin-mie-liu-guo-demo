/**
 * 浏览器版音频适配器
 * 使用 HTMLAudioElement 实现 BGM / 配音 / 音效播放
 *
 * 提审版（小游戏）请改用：
 *   - src/platform/audio.wx.ts（微信小游戏）
 *   - src/platform/audio.tt.ts（抖音小游戏）
 */

export interface AudioHandle {
  play(): void
  pause(): void
  stop(): void
  destroy(): void
  setVolume(v: number): void
  onEnded(cb: () => void): void
  onError(cb: (err: Error) => void): void
}

/**
 * 创建一个音频播放器（浏览器版）
 * @param src 音频 URL（相对或绝对）
 * @param options.autoplay 是否自动播放（移动端可能被浏览器拦截）
 * @param options.loop 是否循环
 */
export function createAudio(
  src: string,
  options: { autoplay?: boolean; loop?: boolean } = {},
): AudioHandle {
  const audio = new Audio(src)
  if (options.loop) audio.loop = true
  if (options.autoplay) {
    audio.play().catch((e) => {
      console.warn('[audio.web] autoplay blocked:', src, e)
    })
  }

  return {
    play() {
      audio.play().catch((e) => console.warn('[audio.web] play failed:', src, e))
    },
    pause() {
      audio.pause()
    },
    stop() {
      audio.pause()
      audio.currentTime = 0
    },
    destroy() {
      audio.pause()
      audio.src = ''
    },
    setVolume(v: number) {
      audio.volume = Math.max(0, Math.min(1, v))
    },
    onEnded(cb) {
      audio.addEventListener('ended', cb)
    },
    onError(cb) {
      audio.addEventListener('error', () => cb(new Error('Audio load failed: ' + src)))
    },
  }
}

/**
 * 移动端首次用户交互后解锁音频自动播放
 * 浏览器版：在用户首次点击/触摸时调用
 */
export function unlockAudio(): void {
  // 浏览器版无需特殊处理，play() 即可
  // 注意：iOS Safari 需要先创建一个 Audio 实例播放一次
  if (typeof window === 'undefined') return
  try {
    const dummy = new Audio()
    dummy.src = 'data:audio/mp3;base64,'
    dummy.play().catch(() => {})
  } catch {
    // 解锁音频可能失败，忽略
  }
}
