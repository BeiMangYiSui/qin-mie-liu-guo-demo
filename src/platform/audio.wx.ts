/**
 * 微信小游戏音频适配器
 * 使用 wx.createInnerAudioContext 实现 BGM / 配音 / 音效播放
 *
 * 提审版必须使用此文件（替换 audio.web.ts）
 * 抖音小游戏请改用 audio.tt.ts
 */

declare const wx: {
  createInnerAudioContext(): {
    src: string
    loop: boolean
    volume: number
    autoplay: boolean
    play(): void
    pause(): void
    stop(): void
    destroy(): void
    onEnded(cb: () => void): void
    onError(cb: (err: unknown) => void): void
    onPlay(cb: () => void): void
  }
}

export interface AudioHandle {
  play(): void
  pause(): void
  stop(): void
  destroy(): void
  setVolume(v: number): void
  onEnded(cb: () => void): void
  onError(cb: (err: Error) => void): void
}

export function createAudio(
  src: string,
  options: { autoplay?: boolean; loop?: boolean } = {},
): AudioHandle {
  const audio = wx.createInnerAudioContext()
  audio.src = src
  audio.loop = options.loop ?? false
  audio.autoplay = options.autoplay ?? false

  return {
    play() {
      audio.play()
    },
    pause() {
      audio.pause()
    },
    stop() {
      audio.stop()
    },
    destroy() {
      audio.destroy()
    },
    setVolume(v: number) {
      audio.volume = Math.max(0, Math.min(1, v))
    },
    onEnded(cb) {
      audio.onEnded(cb)
    },
    onError(cb) {
      audio.onError((err) => cb(new Error('Audio error: ' + JSON.stringify(err))))
    },
  }
}

let unlocked = false

/**
 * 微信小游戏音频解锁
 * 必须在首次用户交互（touchstart / tap）时调用
 */
export function unlockAudio(): void {
  if (unlocked) return
  unlocked = true
  // 用 1 帧静音激活音频通道
  try {
    const dummy = wx.createInnerAudioContext()
    dummy.src = 'data:audio/mp3;base64,'
    dummy.play()
  } catch (e) {
    console.warn('[audio.wx] unlock failed:', e)
  }
}
