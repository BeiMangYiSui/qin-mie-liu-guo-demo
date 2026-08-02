// 《秦灭六国》Demo — 音频：BGM 管理（淡入淡出）+ Web Audio 合成音效

export type BgmName = 'ambush' | 'farm' | 'court'

const TRACKS: Record<BgmName, string> = {
  ambush: 'bgm/ambush.mp3', // 雨夜伏击
  farm: 'bgm/farm.mp3', // 农家晨静
  court: 'bgm/court.mp3', // 章台庙堂
}

// 行业标准 BGM 音量：5-8%（人声中央，BGM 远景衬托）。古筝拨弦瞬态明显，比 ambient 多压一点。
const VOL: Record<BgmName, number> = { ambush: 0.07, farm: 0.05, court: 0.04 }

let current: HTMLAudioElement | null = null
let currentName: BgmName | null = null
let muted = false
let voiceRequestId = 0

function url(name: BgmName) {
  return `${import.meta.env.BASE_URL}${TRACKS[name]}`
}

function fade(el: HTMLAudioElement, to: number, ms: number, then?: () => void) {
  const from = el.volume
  const t0 = performance.now()
  const tick = (t: number) => {
    const k = Math.min(1, (t - t0) / ms)
    el.volume = from + (to - from) * k
    if (k < 1 && !el.paused) requestAnimationFrame(tick)
    else if (k >= 1) then?.()
  }
  requestAnimationFrame(tick)
}

export function playBgm(name: BgmName | null) {
  if (name === currentName) return
  currentName = name
  const old = current
  current = null
  if (old) {
    fade(old, 0, 800, () => {
      old.pause()
      old.src = ''
    })
  }
  if (!name) return
  const el = new Audio(url(name))
  el.loop = true
  el.muted = muted
  current = el
  el.volume = 0
  el.play()
    .then(() => fade(el, VOL[name], 1500))
    .catch(() => {
      /* 浏览器自动播放限制：下一次用户交互时由 playBgm 重试 */
    })
}

// 用户首次交互后调用，确保 BGM 真正开始
export function unlockBgm() {
  const name = currentName
  const el = current
  if (name && el && el.paused) {
    el.play().then(() => fade(el, VOL[name], 800)).catch(() => {})
  }
}

export function setMuted(m: boolean) {
  muted = m
  if (current) current.muted = m
  if (voiceEl) voiceEl.muted = m
  for (const el of Object.values(sfxFileChannels)) {
    if (el) el.muted = m
  }
}
export function isMuted() {
  return muted
}

// —— 配音：单轨，跨行自动打断 ——
// 路径规则：voice/{sceneId}/{idx:02d}_{speaker}.mp3（与 manifest.json 对齐）

let voiceEl: HTMLAudioElement | null = null

interface VoiceManifestEntry {
  scene: string
  speaker: string
  text: string
  file: string
}

let voiceManifestPromise: Promise<VoiceManifestEntry[]> | null = null

function normalizeVoiceText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[\s"'“”‘’…—，。！？、：；（）()·]/g, '')
}

function loadVoiceManifest(): Promise<VoiceManifestEntry[]> {
  if (!voiceManifestPromise) {
    voiceManifestPromise = fetch(`${import.meta.env.BASE_URL}voice/manifest.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`voice manifest: ${response.status}`)
        return response.json() as Promise<VoiceManifestEntry[]>
      })
      .catch(() => [])
  }
  return voiceManifestPromise
}

function startVoice(relativePath: string) {
  if (voiceEl) {
    voiceEl.pause()
    voiceEl.src = ''
  }
  const el = new Audio(`${import.meta.env.BASE_URL}${relativePath}`)
  el.volume = 0.7
  el.muted = muted
  voiceEl = el
  el.play().catch(() => {
    if (voiceEl === el) voiceEl = null
  })
}

export function playVoice(relativePath: string) {
  if (muted) return
  voiceRequestId += 1
  startVoice(relativePath)
}

export async function playVoiceLine(scene: string, speaker: string, text: string) {
  const requestId = ++voiceRequestId
  if (voiceEl) {
    voiceEl.pause()
    voiceEl.src = ''
    voiceEl = null
  }
  if (muted) return
  const manifest = await loadVoiceManifest()
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

export function stopVoice() {
  voiceRequestId += 1
  if (voiceEl) {
    voiceEl.pause()
    voiceEl.src = ''
    voiceEl = null
  }
}

// —— 预录 sfx 文件播放（独立轨道，可与 voice 同时播）——
// 路径规则：sfx/{name}.mp3（与 demo/public/sfx/ 对齐）

export type SfxFileChannel = 'environment' | 'effect'

const sfxFileChannels: Record<SfxFileChannel, HTMLAudioElement | null> = {
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
      previous.pause()
      previous.src = ''
    }
  }
  const el = new Audio(`${import.meta.env.BASE_URL}${relativePath}`)
  el.volume = opts.volume ?? 0.6
  el.loop = opts.loop ?? false
  el.muted = muted
  if (!opts.overlap) sfxFileChannels[channel] = el
  el.play().catch(() => {
    // 循环环境音保留实例，等待下一次明确玩家交互解锁；短音效失败则释放通道。
    if (!opts.overlap && !opts.loop && sfxFileChannels[channel] === el) sfxFileChannels[channel] = null
  })
}

export function unlockSfxFile(channel: SfxFileChannel = 'environment') {
  const el = sfxFileChannels[channel]
  if (el?.paused) el.play().catch(() => {})
}

export function stopSfxFile(channel?: SfxFileChannel) {
  const channels: SfxFileChannel[] = channel ? [channel] : ['environment', 'effect']
  for (const key of channels) {
    const el = sfxFileChannels[key]
    if (el) {
      el.pause()
      el.src = ''
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
