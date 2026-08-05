// 《秦灭六国》Demo — 音频：BGM 管理（淡入淡出）+ Web Audio 合成音效
//
// 平台分流：
// - 浏览器版（IS_MINI_GAME=false）：直接使用 HTMLAudioElement，支持 requestAnimationFrame 淡入淡出
// - 小游戏版（IS_MINI_GAME=true）：走 src/platform/audio.{wx,tt}.ts 的 createAudio，
//   通过 setInterval 模拟淡入淡出。小游戏环境无 HTMLAudioElement，必须走适配器。
import { IS_MINI_GAME } from '@/shared/runtime-flag'
import { createAudio as createPlatformAudio, unlockAudio as platformUnlockAudio } from '@/platform'
import type { AudioHandle } from '@/platform'
import { cdnUrl } from '../lib/cdn'

export type BgmName = 'ambush' | 'farm' | 'court'

const TRACKS: Record<BgmName, string> = {
  ambush: 'bgm/ambush.mp3', // 雨夜伏击
  farm: 'bgm/farm.mp3', // 农家晨静
  court: 'bgm/court.mp3', // 章台庙堂
}

// 行业标准 BGM 音量：5-8%（人声中央，BGM 远景衬托）。古筝拨弦瞬态明显，比 ambient 多压一点。
const VOL: Record<BgmName, number> = { ambush: 0.07, farm: 0.05, court: 0.04 }

/**
 * 内部统一的音频实例抽象：
 * - 浏览器版：直接是 HTMLAudioElement（能拿 .volume 属性做淡入淡出）
 * - 小游戏版：platform adapter 的 AudioHandle（通过 setVolume 调音量）
 * 之所以用一个 union 类型：浏览器路径里 fade() 需要直接读写 volume，行为最快；
 * 小游戏路径里 fade() 改成周期性 setVolume。
 */
type InternalAudio =
  | { kind: 'web'; el: HTMLAudioElement; setVolume: (v: number) => void; destroy: () => void; pause: () => void; play: () => Promise<void> | void; onEnded: (cb: () => void) => void }
  | { kind: 'minigame'; handle: AudioHandle; destroy: () => void; pause: () => void; play: () => void }

let current: InternalAudio | null = null
let currentName: BgmName | null = null
let muted = false
let voiceRequestId = 0

function url(name: BgmName) {
  return cdnUrl(TRACKS[name])
}

function makeWebAudio(src: string, loop: boolean, volume: number): InternalAudio {
  const el = new Audio(src)
  el.loop = loop
  el.muted = muted
  el.volume = volume
  return {
    kind: 'web',
    el,
    setVolume: (v) => {
      el.volume = Math.max(0, Math.min(1, v))
    },
    destroy: () => {
      el.pause()
      el.src = ''
    },
    pause: () => el.pause(),
    play: () => el.play(),
    onEnded: (cb) => el.addEventListener('ended', cb, { once: true }),
  }
}

function makeMinigameAudio(src: string, loop: boolean, volume: number): InternalAudio {
  const handle = createPlatformAudio(src, { loop, autoplay: false })
  handle.setVolume(volume)
  const audio: InternalAudio = {
    kind: 'minigame',
    handle,
    destroy: () => handle.destroy(),
    pause: () => handle.pause(),
    play: () => handle.play(),
  }
  // muted 状态联动
  if (muted) handle.setVolume(0)
  return audio
}

function makeAudio(src: string, loop: boolean, volume: number): InternalAudio {
  return IS_MINI_GAME ? makeMinigameAudio(src, loop, volume) : makeWebAudio(src, loop, volume)
}

/**
 * 淡入淡出：
 * - web 版：用 requestAnimationFrame 直接改 audio.volume（最平滑）
 * - minigame 版：用 setInterval 周期性调 handle.setVolume（小游戏环境通常没有 rAF）
 */
function fade(audio: InternalAudio, to: number, ms: number, then?: () => void) {
  if (audio.kind === 'web') {
    const from = audio.el.volume
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms)
      audio.setVolume(from + (to - from) * k)
      if (k < 1 && !audio.el.paused) requestAnimationFrame(tick)
      else if (k >= 1) then?.()
    }
    requestAnimationFrame(tick)
  } else {
    // minigame：用 step 推进
    const STEPS = 16
    const stepMs = Math.max(16, Math.floor(ms / STEPS))
    let i = 0
    const from =
      audio.handle && typeof (audio.handle as unknown as { _vol?: number })._vol === 'number'
        ? ((audio.handle as unknown as { _vol: number })._vol)
        : 0
    const tick = () => {
      i += 1
      const k = i / STEPS
      const v = from + (to - from) * k
      audio.handle.setVolume(v)
      ;(audio.handle as unknown as { _vol: number })._vol = v
      if (i < STEPS) setTimeout(tick, stepMs)
      else then?.()
    }
    setTimeout(tick, stepMs)
  }
}

export function playBgm(name: BgmName | null) {
  if (name === currentName) return
  currentName = name
  const old = current
  current = null
  if (old) {
    fade(old, 0, 800, () => {
      old.pause()
      old.destroy()
    })
  }
  if (!name) return
  const audio = makeAudio(url(name), true, 0)
  current = audio
  try {
    audio.play()
    fade(audio, muted ? 0 : VOL[name], 1500)
  } catch {
    /* 浏览器自动播放限制 / 小游戏音频上下文未解锁：等下一次 unlockAudio 重试 */
  }
}

// 用户首次交互后调用，确保 BGM 真正开始
export function unlockBgm() {
  const name = currentName
  const audio = current
  if (!name || !audio) return
  if (audio.kind === 'web' && audio.el.paused) {
    audio.play()
    fade(audio, muted ? 0 : VOL[name], 800)
  } else if (audio.kind === 'minigame') {
    audio.play()
    fade(audio, muted ? 0 : VOL[name], 800)
  }
}

export function setMuted(m: boolean) {
  muted = m
  if (current) {
    if (current.kind === 'web') current.el.muted = m
    else current.handle.setVolume(m ? 0 : VOL[currentName ?? 'court'])
  }
  if (voiceEl) voiceEl.muted = m
  for (const a of Object.values(sfxFileChannels)) {
    if (!a) continue
    if (a.kind === 'web') a.el.muted = m
    // minigame 通道每次 playSfxFile 时已经按 muted 决定 setVolume；这里无需再调整
  }
}
export function isMuted() {
  return muted
}

// —— 配音：单轨，跨行自动打断 ——
// 路径规则：voice/{sceneId}/{idx:02d}_{speaker}.mp3（与 manifest.json 对齐）

/** 配音实例抽象（同 BGM）：web = HTMLAudioElement，minigame = platform adapter */
type VoiceAudio =
  | { kind: 'web'; el: HTMLAudioElement; muted: boolean }
  | { kind: 'minigame'; handle: AudioHandle; muted: boolean }

let voiceEl: VoiceAudio | null = null
let persistentVoiceEl: HTMLAudioElement | null = null
// 移动端音频解锁标记：首次用户交互后解锁，后续 play() 不再被拦截
let audioUnlocked = false

interface VoiceManifestEntry {
  scene: string
  speaker: string
  text: string
  file: string
}

let voiceManifestPromise: Promise<VoiceManifestEntry[]> | null = null
let voiceManifest: VoiceManifestEntry[] | null = null

function normalizeVoiceText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[\s"'""''…—，。！？、：；（）()·]/g, '')
}

function loadVoiceManifest(): Promise<VoiceManifestEntry[]> {
  if (!voiceManifestPromise) {
    voiceManifestPromise = fetch(cdnUrl('voice/manifest.json'))
      .then((response) => {
        if (!response.ok) throw new Error(`voice manifest: ${response.status}`)
        return response.json() as Promise<VoiceManifestEntry[]>
      })
      .then((data) => {
        voiceManifest = data
        return data
      })
      .catch(() => [])
  }
  return voiceManifestPromise
}

// 页面加载时立即预取 manifest，避免首次播放时的异步延迟
loadVoiceManifest()

function startVoice(relativePath: string) {
  // 停掉上一段配音
  if (voiceEl) {
    if (voiceEl.kind === 'web') {
      voiceEl.el.pause()
      voiceEl.el.src = ''
    } else {
      voiceEl.handle.stop()
    }
  }

  if (IS_MINI_GAME) {
    // 小游戏路径：单 voice 实例，跨行复用同一个 context
    const handle = createPlatformAudio(relativePath, { loop: false, autoplay: true })
    handle.setVolume(0.7)
    voiceEl = { kind: 'minigame', handle, muted }
    return
  }

  // 浏览器路径：复用 HTMLAudioElement 实例（减少 new Audio 开销）
  const el = persistentVoiceEl ?? new Audio()
  el.preload = 'auto'
  el.src = cdnUrl(relativePath)
  el.volume = 0.7
  el.muted = muted
  voiceEl = { kind: 'web', el, muted }
  persistentVoiceEl = el
  el.play().catch(() => {
    if (voiceEl && voiceEl.kind === 'web' && voiceEl.el === el) voiceEl = null
  })
}

/** 预取某个场景的所有配音文件，让首次点击播放近乎即时 */
export async function preloadSceneVoices(sceneId: string) {
  const manifest = voiceManifest ?? (await loadVoiceManifest())
  const scenePrefix = sceneId.split('#', 1)[0]
  const urls = manifest
    .filter((m) => m.scene === scenePrefix)
    .map((m) => cdnUrl(m.file))
  // 并行 fetch，浏览器会自动缓存
  await Promise.allSettled(
    urls.map((url) =>
      fetch(url, { mode: 'no-cors' }).catch(() => {}),
    ),
  )
}

export function playVoice(relativePath: string) {
  if (muted) return
  voiceRequestId += 1
  startVoice(relativePath)
}

export async function playVoiceLine(scene: string, speaker: string, text: string) {
  const requestId = ++voiceRequestId
  if (voiceEl) {
    if (voiceEl.kind === 'web') {
      voiceEl.el.pause()
      voiceEl.el.src = ''
    } else {
      voiceEl.handle.stop()
    }
    voiceEl = null
  }
  if (muted) return
  // 优先使用已缓存的 manifest（同步路径），避免 await 打断移动端播放手势链
  const manifest = voiceManifest ?? (await loadVoiceManifest())
  if (requestId !== voiceRequestId || muted) return
  // 战斗/挂载前后的分段场景都带 #suffix（after / yuenu-arrival / beimang-fall），配音按主场景 id 查。
  const voiceScene = scene.split('#', 1)[0]
  const normalized = normalizeVoiceText(text)
  const entry = manifest.find(
    (item) =>
      item.scene === voiceScene &&
      item.speaker === speaker &&
      normalizeVoiceText(item.text) === normalized,
  )
  if (entry) startVoice(entry.file)
}

/** 用户首次交互时调用，解锁移动端音频播放限制 */
export function unlockAudio() {
  if (audioUnlocked) return
  audioUnlocked = true
  if (IS_MINI_GAME) {
    // 小游戏路径：调用 platform adapter 提供的统一解锁（首次 tap 后再 play 即可）
    platformUnlockAudio()
  } else {
    // 浏览器路径：播放一段静音以解锁 iOS/Android 音频上下文
    const el = new Audio()
    el.volume = 0
    el.play().catch(() => {})
  }
  // 同时解锁 BGM
  unlockBgm()
}

export function stopVoice() {
  voiceRequestId += 1
  if (voiceEl) {
    if (voiceEl.kind === 'web') {
      voiceEl.el.pause()
      voiceEl.el.src = ''
    } else {
      voiceEl.handle.stop()
    }
    voiceEl = null
  }
}

/** 预录 sfx 通道抽象（web/minigame 共用接口） */
type SfxAudio =
  | { kind: 'web'; el: HTMLAudioElement }
  | { kind: 'minigame'; handle: AudioHandle }

export type SfxFileChannel = 'environment' | 'effect'

const sfxFileChannels: Record<SfxFileChannel, SfxAudio | null> = {
  environment: null,
  effect: null,
}

export function playSfxFile(
  relativePath: string,
  opts: { loop?: boolean; volume?: number; channel?: SfxFileChannel; overlap?: boolean } = {},
) {
  const channel = opts.channel ?? 'effect'
  if (muted && !opts.loop) return
  // overlap=true 时不占用单通道，允许多个短音效同时发声（战斗连续动作）
  if (!opts.overlap) {
    const previous = sfxFileChannels[channel]
    if (previous) {
      if (previous.kind === 'web') {
        previous.el.pause()
        previous.el.src = ''
      } else {
        previous.handle.stop()
      }
    }
  }

  if (IS_MINI_GAME) {
    const handle = createPlatformAudio(relativePath, {
      loop: opts.loop ?? false,
      autoplay: true,
    })
    handle.setVolume(opts.volume ?? 0.6)
    if (muted) handle.setVolume(0)
    if (!opts.overlap) sfxFileChannels[channel] = { kind: 'minigame', handle }
    handle.onError(() => {
      if (
        !opts.overlap &&
        !opts.loop &&
        sfxFileChannels[channel] &&
        sfxFileChannels[channel]?.kind === 'minigame' &&
        sfxFileChannels[channel]?.handle === handle
      ) {
        sfxFileChannels[channel] = null
      }
    })
    return
  }

  // 浏览器路径
  const el = new Audio(cdnUrl(relativePath))
  el.volume = opts.volume ?? 0.6
  el.loop = opts.loop ?? false
  el.muted = muted
  if (!opts.overlap) sfxFileChannels[channel] = { kind: 'web', el }
  el.play().catch(() => {
    if (
      !opts.overlap &&
      !opts.loop &&
      sfxFileChannels[channel] &&
      sfxFileChannels[channel]?.kind === 'web' &&
      sfxFileChannels[channel]?.el === el
    ) {
      sfxFileChannels[channel] = null
    }
  })
}

export function unlockSfxFile(channel: SfxFileChannel = 'environment') {
  const a = sfxFileChannels[channel]
  if (!a) return
  if (a.kind === 'web' && a.el.paused) a.el.play().catch(() => {})
  // minigame 通道一旦 stop 不会自动恢复，需要重新 create；这里不做处理
}

export function stopSfxFile(channel?: SfxFileChannel) {
  const channels: SfxFileChannel[] = channel ? [channel] : ['environment', 'effect']
  for (const key of channels) {
    const a = sfxFileChannels[key]
    if (a) {
      if (a.kind === 'web') {
        a.el.pause()
        a.el.src = ''
      } else {
        a.handle.stop()
      }
      sfxFileChannels[key] = null
    }
  }
}

// —— 战斗动作音效：audio_generation 真实拟音（2026-07-30 试听拍板定稿）——
// 曾用 Web Audio 振荡器程序合成，听感廉价，已废弃；素材与提示词见 docs/配音原则-人物配音-2026-07-29.md §8.3

type SfxKind = 'hit' | 'interrupt' | 'rescue' | 'hold' | 'steal' | 'hurt' | 'select' | 'win' | 'fall'

const ACTION_SFX: Record<SfxKind, { path: string; volume: number }> = {
  hit:       { path: 'sfx/hit.mp3', volume: 0.6 },       // 剑击命中
  hurt:      { path: 'sfx/hurt.mp3', volume: 0.6 },      // 受创闷哼
  interrupt: { path: 'sfx/interrupt.mp3', volume: 0.45 }, // 打断（保留原版 ）
  rescue:    { path: 'sfx/rescue.mp3', volume: 0.55 },    // 救援/医治
  hold:      { path: 'sfx/hold.mp3', volume: 0.55 },     // 撑住阵脚
  steal:     { path: 'sfx/steal.mp3', volume: 0.55 },    // 夺走
  select:    { path: 'sfx/select.mp3', volume: 0.45 },    // 界面点击
  fall:      { path: 'sfx/fall.mp3', volume: 0.6 },      // 坠坡
  win:       { path: 'sfx/win.mp3', volume: 0.7 },       // 小胜
}

export function playSfx(kind: SfxKind) {
  if (muted) return
  const def = ACTION_SFX[kind]
  playSfxFile(def.path, { volume: def.volume, overlap: true })
}
