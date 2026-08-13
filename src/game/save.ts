// 《秦灭六国》Demo — 存档系统（仅手动，3 个槽位）
// Web 版：localStorage
// 小游戏版（MINIGAME_BUILD=true）：通过 platform/storage 适配器走 wx.setStorageSync / tt.setStorageSync
//
// vite.config.minigame.{ts,douyin.ts} 同时 alias 了 '@/platform' 与 '../platform'

import { IS_MINI_GAME } from '@/shared/runtime-flag'
import { storage as platformStorage } from '@/platform'

/**
 * 存档底层抽象：浏览器版对应 window.localStorage，小游戏版对应
 * 平台适配器（wx.setStorageSync / tt.setStorageSync）。两者接口高度一致，
 * 但 DOM.Storage 还包含 length / clear / key 等不必要成员，所以单独定义。
 */
interface MiniStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/**
 * 拿到当前可用的 localStorage（运行时每次调用都查一下，兼容 Node 测试里后补 mock）。
 * 浏览器下 typeof window !== 'undefined' 在模块初始化与运行时都成立；
 * Node 测试下模块初始化时返回 null，测试脚本 mock globalThis.localStorage 后此函数能拿到。
 */
function getLocalStorage(): MiniStorageLike | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  const ls = (globalThis as { localStorage?: MiniStorageLike | null }).localStorage
  return ls ?? null
}

const storage: MiniStorageLike = IS_MINI_GAME
  ? {
      getItem: (key) => platformStorage.get(key),
      setItem: (key, value) => platformStorage.set(key, value),
      removeItem: (key) => platformStorage.remove(key),
    }
  : getLocalStorage() ?? {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }

/**
 * 运行时访问 storage 的入口：
 * - 小游戏版：直接走 platform adapter（不变）
 * - 浏览器/Node 版：每次调用都重新查 localStorage，兼容 Node 测试在 save.ts 加载后 mock 的场景
 */
const safeStorage: MiniStorageLike = IS_MINI_GAME
  ? storage
  : {
      getItem: (key) => {
        const ls = getLocalStorage()
        return ls ? ls.getItem(key) : null
      },
      setItem: (key, value) => {
        const ls = getLocalStorage()
        if (ls) ls.setItem(key, value)
      },
      removeItem: (key) => {
        const ls = getLocalStorage()
        if (ls) ls.removeItem(key)
      },
    }

export type Stage =
  | 'title'
  | 'chapter_card'
  // 序章
  | 's1_anfa'
  | 's1_statement'
  | 's1_anfa_after'
  | 's2_shenxun'
  | 's3_chaqu'
  | 's3_chaan'
  | 's3_chaqu_after'
  | 's4_andun'
  | 's5_zhuishi'
  | 's5_battle'
  | 's5_zhuishi_after'
  | 's6_fusha'
  | 's6_battle'
  | 's6_fusha_after'
  | 's6_yuenu_battle'
  | 's6_fusha_fall'
  | 's7_xiandai'
  | 's8_nongjia'
  | 's9_tongxing'
  | 's9_battle'
  | 's9_tongxing_after'
  | 's10_guace'
  // 第一章
  | 'c1_pinan'
  | 'c1_case'
  | 'c1_pinan_after'
  | 'c2_zhangtai'
  | 'c3_guoshu'
  | 'c4_husong'
  | 'c4_battle'
  | 'c4_husong_after'
  | 'c5_shouxiang'
  | 'c6_yiying'
  | 'c6_huipai_battle'
  | 'c7_huoqi'
  | 'c7_choice'
  | 'c7_fire'
  | 'c7_troops'
  | 'c7_evac'
  | 'c7_huoqi_after'
  | 'c8_zhangmo'
  | 'c8_settle'
  // 挂载与收尾
  | 'shicheng'
  | 'end'

export const STAGE_LABELS: Record<Stage, string> = {
  title: '标题页',
  chapter_card: '章节转场',
  s1_anfa: 'S1 案发',
  s1_statement: 'S1 亲见落笔',
  s1_anfa_after: 'S1 案发 · 传闻入章台',
  s2_shenxun: 'S2 审讯',
  s3_chaqu: 'S3 查渠',
  s3_chaan: 'S3 查案（挂载）',
  s3_chaqu_after: 'S3 查渠 · 后段',
  s4_andun: 'S4 一马十金与安顿',
  s5_zhuishi: 'S5 追使夺书',
  s5_battle: 'S5 追击密使战',
  s5_zhuishi_after: 'S5 追使夺书 · 后段',
  s6_fusha: 'S6 郑地伏杀',
  s6_battle: 'S6 教学战',
  s6_fusha_after: 'S6 越女来援',
  s6_yuenu_battle: 'S6 越女单骑破围',
  s6_fusha_fall: 'S6 北芒坠坡',
  s7_xiandai: 'S7 现代短切',
  s8_nongjia: 'S8 农家醒来',
  s9_tongxing: 'S9 农家战',
  s9_battle: 'S9 农家战 · 战斗',
  s9_tongxing_after: 'S9 三人同行',
  s10_guace: 'S10 回营挂册',
  c1_pinan: 'C1 拼案',
  c1_case: 'C1 三证合勘',
  c1_pinan_after: 'C1 拼案 · 结论',
  c2_zhangtai: 'C2 章台密议',
  c3_guoshu: 'C3 国书',
  c4_husong: 'C4 护送截杀战',
  c4_battle: 'C4 护送战 · 战斗',
  c4_husong_after: 'C4 护送 · 后段',
  c5_shouxiang: 'C5 受降',
  c6_yiying: 'C6 疫营',
  c6_huipai_battle: 'C6 回旆盟终局战',
  c7_huoqi: 'C7 火起官署',
  c7_choice: 'C7 三择其一',
  c7_fire: 'C7 保户籍 · 火场（挂载）',
  c7_troops: 'C7 截残军 · 北道追截',
  c7_evac: 'C7 护疫营 · 撤离战（挂载）',
  c7_huoqi_after: 'C7 回响',
  c8_zhangmo: 'C8 章末',
  c8_settle: '章末结算（挂载）',
  shicheng: '史乘 · 对照卡',
  end: 'Demo 终',
}

// 这些 stage 不允许存档（过场、标题、战斗及功能面板中存档没有意义，强制玩家只在叙事场景存档）
const SAVE_BLOCKED: ReadonlySet<Stage> = new Set([
  'title',
  'chapter_card',
  's1_statement',
  's3_chaan',
  's5_battle',
  's6_battle',
  's6_yuenu_battle',
  's9_battle',
  'c4_battle',
  'c6_huipai_battle',
  'c1_case',
  'c7_choice',
  'c7_fire',
  'c7_troops',
  'c7_evac',
  'c8_settle',
  'shicheng',
  'end',
])

export function canSaveAt(stage: Stage): boolean {
  return !SAVE_BLOCKED.has(stage)
}

export const CURRENT_SAVE_VERSION = 2

export type C4Tactic = 'ambush' | 'valley' | 'rear'
export type C7Choice = 'register' | 'troops' | 'camp'
export type EvacSurvival = 'high' | 'low'
export type C4Performance = 'high' | 'mid' | 'low'
// 简册 id 统一拼音（总指挥裁决）；中文「户籍/粮册/地图/刑狱/军籍」只作显示 label
export type SavedRegisterId = 'huji' | 'liangce' | 'ditu' | 'xingyu' | 'junji'
export type StoryFlagValue = boolean | string | number | null | string[]

/**
 * 跨场景剧情选择的唯一持久化容器。
 *
 * 数组只允许用于 §0 约定的 c7_saved_registers（拼音 id）。其余扩展 flag
 * 仍限制为标量，避免旧档被任意嵌套对象污染。
 */
export interface StoryFlags {
  plead_soldier?: boolean
  s6_yutu_saved?: boolean
  s6_mengjia_saved?: boolean
  s6_cart_through?: boolean
  c4_tactic?: C4Tactic
  c4_performance?: C4Performance
  c7_choice?: C7Choice
  c7_saved_registers?: SavedRegisterId[]
  c7_troops_intercepted?: number
  evac_survival?: EvacSurvival
  [key: string]: StoryFlagValue | undefined
}

export const DEFAULT_STORY_FLAGS: Readonly<StoryFlags> = Object.freeze({})

export interface SaveData {
  saveVersion: typeof CURRENT_SAVE_VERSION
  slot: number
  stage: Stage
  flags: StoryFlags
  savedAt: number
}

export type SaveDraftData = Omit<SaveData, 'saveVersion' | 'slot' | 'savedAt' | 'stage'>
export type SaveCompatibility = 'compatible' | 'legacy' | 'future' | 'invalid'

export type SaveSlotState =
  | { status: 'empty'; slot: number }
  | {
      status: 'incompatible'
      slot: number
      reason: Exclude<SaveCompatibility, 'compatible'>
      saveVersion: number | null
      savedAt: number | null
    }
  | { status: 'ready'; slot: number; data: SaveData }

const KEY_PREFIX = 'qmlg:save:'
export const SLOT_COUNT = 3

const REGISTER_IDS: ReadonlySet<string> = new Set(['huji', 'liangce', 'ditu', 'xingyu', 'junji'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function checkSaveCompatibility(value: unknown): SaveCompatibility {
  if (!isRecord(value)) return 'invalid'
  if (!('saveVersion' in value) || value.saveVersion == null) return 'legacy'
  if (typeof value.saveVersion !== 'number' || !Number.isInteger(value.saveVersion)) return 'invalid'
  if (value.saveVersion < CURRENT_SAVE_VERSION) return 'legacy'
  if (value.saveVersion > CURRENT_SAVE_VERSION) return 'future'
  return 'compatible'
}

export function normalizeStoryFlags(value: unknown): StoryFlags {
  if (!isRecord(value)) return { ...DEFAULT_STORY_FLAGS }

  const flags: StoryFlags = {}
  for (const [key, flagValue] of Object.entries(value)) {
    if (
      flagValue === null ||
      typeof flagValue === 'boolean' ||
      typeof flagValue === 'string' ||
      (typeof flagValue === 'number' && Number.isFinite(flagValue)) ||
      (Array.isArray(flagValue) && flagValue.every((item) => typeof item === 'string'))
    ) {
      flags[key] = flagValue as StoryFlagValue
    }
  }

  if (Array.isArray(value.c7_saved_registers)) {
    flags.c7_saved_registers = [...new Set(
      value.c7_saved_registers.filter(
        (item): item is SavedRegisterId => typeof item === 'string' && REGISTER_IDS.has(item),
      ),
    )].slice(0, 3)
  }

  if (flags.plead_soldier !== undefined && typeof flags.plead_soldier !== 'boolean') {
    delete flags.plead_soldier
  }
  for (const key of ['s6_yutu_saved', 's6_mengjia_saved', 's6_cart_through'] as const) {
    if (flags[key] !== undefined && typeof flags[key] !== 'boolean') delete flags[key]
  }
  if (flags.c4_tactic !== undefined && !['ambush', 'valley', 'rear'].includes(String(flags.c4_tactic))) {
    delete flags.c4_tactic
  }
  if (flags.c4_performance !== undefined && !['high', 'mid', 'low'].includes(String(flags.c4_performance))) {
    delete flags.c4_performance
  }
  if (flags.c7_choice !== undefined && !['register', 'troops', 'camp'].includes(String(flags.c7_choice))) {
    delete flags.c7_choice
  }
  if (flags.c7_saved_registers !== undefined && !Array.isArray(flags.c7_saved_registers)) {
    delete flags.c7_saved_registers
  }
  if (flags.c7_troops_intercepted !== undefined) {
    const count = flags.c7_troops_intercepted
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 0 || count > 5) {
      delete flags.c7_troops_intercepted
    }
  }
  if (flags.evac_survival !== undefined && !['high', 'low'].includes(String(flags.evac_survival))) {
    delete flags.evac_survival
  }
  return flags
}

function parseCompatibleSave(value: unknown, expectedSlot: number): SaveData | null {
  if (checkSaveCompatibility(value) !== 'compatible' || !isRecord(value)) return null
  if (value.slot !== expectedSlot || typeof value.stage !== 'string' || !(value.stage in STAGE_LABELS)) return null
  if (typeof value.savedAt !== 'number' || !Number.isFinite(value.savedAt)) return null

  return {
    saveVersion: CURRENT_SAVE_VERSION,
    slot: expectedSlot,
    stage: value.stage as Stage,
    flags: normalizeStoryFlags(value.flags),
    savedAt: value.savedAt,
  }
}

export function inspectSave(slot: number): SaveSlotState {
  if (slot < 0 || slot >= SLOT_COUNT) return { status: 'empty', slot }

  try {
    const raw = safeStorage.getItem(KEY_PREFIX + slot)
    if (!raw) return { status: 'empty', slot }
    const value: unknown = JSON.parse(raw)
    const compatibility = checkSaveCompatibility(value)
    const data = parseCompatibleSave(value, slot)
    if (data) return { status: 'ready', slot, data }

    return {
      status: 'incompatible',
      slot,
      reason: compatibility === 'compatible' ? 'invalid' : compatibility,
      saveVersion:
        isRecord(value) && typeof value.saveVersion === 'number' && Number.isInteger(value.saveVersion)
          ? value.saveVersion
          : null,
      savedAt: isRecord(value) && typeof value.savedAt === 'number' ? value.savedAt : null,
    }
  } catch {
    return {
      status: 'incompatible',
      slot,
      reason: 'invalid',
      saveVersion: null,
      savedAt: null,
    }
  }
}

export function loadSave(slot: number): SaveData | null {
  const state = inspectSave(slot)
  return state.status === 'ready' ? state.data : null
}

export function listSaveSlots(): SaveSlotState[] {
  const out: SaveSlotState[] = []
  for (let i = 0; i < SLOT_COUNT; i++) out.push(inspectSave(i))
  return out
}

export function listSaves(): (SaveData | null)[] {
  return listSaveSlots().map((state) => (state.status === 'ready' ? state.data : null))
}

export function writeSave(slot: number, data: SaveDraftData & { stage: Stage }): SaveData {
  if (slot < 0 || slot >= SLOT_COUNT) throw new Error(`invalid slot: ${slot}`)
  const full: SaveData = {
    ...data,
    saveVersion: CURRENT_SAVE_VERSION,
    flags: normalizeStoryFlags(data.flags),
    slot,
    savedAt: Date.now(),
  }
  safeStorage.setItem(KEY_PREFIX + slot, JSON.stringify(full))
  return full
}

export function deleteSave(slot: number) {
  if (slot < 0 || slot >= SLOT_COUNT) return
  safeStorage.removeItem(KEY_PREFIX + slot)
}

export function findLatestSave(): SaveData | null {
  const all = listSaves().filter(Boolean) as SaveData[]
  if (all.length === 0) return null
  return all.sort((a, b) => b.savedAt - a.savedAt)[0]
}

export function deleteIncompatibleSaves(): number {
  let removed = 0
  for (const state of listSaveSlots()) {
    if (state.status !== 'incompatible') continue
    deleteSave(state.slot)
    removed += 1
  }
  return removed
}

export function slotKey(slot: number): string {
  return `存档 ${['一', '二', '三'][slot] ?? slot}`
}

export function formatSavedAt(t: number): string {
  const d = new Date(t)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// —— 战前自动存档（战败重试点：独立键，不占用 3 个手动槽位；战败回卷＋一句旁白） ——

const AUTO_SAVE_KEY = 'qmlg:autosave'

export function writeAutoSave(data: SaveDraftData & { stage: Stage }): SaveData {
  const full: SaveData = {
    ...data,
    saveVersion: CURRENT_SAVE_VERSION,
    flags: normalizeStoryFlags(data.flags),
    slot: -1,
    savedAt: Date.now(),
  }
  safeStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(full))
  return full
}

export function loadAutoSave(): SaveData | null {
  try {
    const raw = safeStorage.getItem(AUTO_SAVE_KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (checkSaveCompatibility(value) !== 'compatible' || !isRecord(value)) return null
    if (typeof value.stage !== 'string' || !(value.stage in STAGE_LABELS)) return null
    if (typeof value.savedAt !== 'number' || !Number.isFinite(value.savedAt)) return null
    return {
      saveVersion: CURRENT_SAVE_VERSION,
      slot: -1,
      stage: value.stage as Stage,
      flags: normalizeStoryFlags(value.flags),
      savedAt: value.savedAt,
    }
  } catch {
    return null
  }
}

export function clearAutoSave() {
  safeStorage.removeItem(AUTO_SAVE_KEY)
}
