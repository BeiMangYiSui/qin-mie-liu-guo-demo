import type { SavedRegisterId } from '../game/save'

export interface RegisterPile {
  id: SavedRegisterId
  /** 显示用中文名（id 统一拼音，中文只作 label） */
  label: string
  subtitle: string
  placeholder: string
  /** 抢出该堆简册所需的基础时间；换架还会额外耗时。 */
  rescueSeconds: number
}

export const REGISTER_PILES: readonly RegisterPile[] = [
  { id: 'huji', label: '户籍', subtitle: '人名与里籍', placeholder: '可循册查找失散百姓。', rescueSeconds: 5 },
  { id: 'liangce', label: '粮册', subtitle: '仓廪出入', placeholder: '可核城中余粮与赈济去向。', rescueSeconds: 3 },
  { id: 'ditu', label: '地图', subtitle: '城道关津', placeholder: '标有城道、水井与关津。', rescueSeconds: 4 },
  { id: 'xingyu', label: '刑狱', subtitle: '案牍囚籍', placeholder: '记着在押者与未结旧案。', rescueSeconds: 3 },
  { id: 'junji', label: '军籍', subtitle: '卒伍名录', placeholder: '可核降卒编伍与旧部去向。', rescueSeconds: 4 },
]

export interface FireThreat {
  id: SavedRegisterId
  /** 当全局剩余时间降至该值时，此堆被烧毁。 */
  burnsAt: number
}

export interface FireRescueStep {
  saved: SavedRegisterId[]
  burned: SavedRegisterId[]
  secondsLeft: number
  lastPile: SavedRegisterId | null
  cost: number
  rescued: boolean
}

const pileIndex = (id: SavedRegisterId) => REGISTER_PILES.findIndex((pile) => pile.id === id)

/**
 * 每次进火场都会重新分配火舌逼近次序。危险是公开的，但不存在可背诵的固定点选顺序。
 */
export function createFireThreatSchedule(
  durationSeconds: number,
  random: () => number = Math.random,
): FireThreat[] {
  const shuffled = REGISTER_PILES.map((pile) => pile.id)
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapWith]] = [shuffled[swapWith], shuffled[index]]
  }
  return shuffled.map((id, index) => ({
    id,
    burnsAt: Math.max(0, durationSeconds - 3 * (index + 1)),
  }))
}

export function burnedRegisters(
  schedule: readonly FireThreat[],
  secondsLeft: number,
  saved: readonly SavedRegisterId[],
): SavedRegisterId[] {
  return schedule
    .filter((threat) => threat.burnsAt >= secondsLeft && !saved.includes(threat.id))
    .map((threat) => threat.id)
}

/**
 * 抢册会真实消耗倒计时；跨过相邻书架还会多耗一秒。目标在动作开始时被抱走，
 * 但这段时间内火会继续烧掉别处，因此“先拿哪堆”必须随本局火势调整。
 */
export function resolveFireRescueStep({
  saved,
  burned,
  secondsLeft,
  lastPile,
  schedule,
  id,
  maxSaved = 3,
}: {
  saved: readonly SavedRegisterId[]
  burned: readonly SavedRegisterId[]
  secondsLeft: number
  lastPile: SavedRegisterId | null
  schedule: readonly FireThreat[]
  id: SavedRegisterId
  maxSaved?: number
}): FireRescueStep {
  const pile = REGISTER_PILES.find((candidate) => candidate.id === id)
  if (!pile || saved.includes(id) || burned.includes(id) || saved.length >= maxSaved || secondsLeft <= 0) {
    return { saved: [...saved], burned: [...burned], secondsLeft, lastPile, cost: 0, rescued: false }
  }
  const shelfDistance = lastPile == null ? 0 : Math.abs(pileIndex(lastPile) - pileIndex(id))
  const cost = pile.rescueSeconds + (shelfDistance >= 2 ? 1 : 0)
  const nextSaved = [...saved, id].slice(0, maxSaved)
  const nextSeconds = Math.max(0, secondsLeft - cost)
  const nextBurned = [...new Set([
    ...burned,
    ...burnedRegisters(schedule, nextSeconds, nextSaved),
  ])]
  return {
    saved: nextSaved,
    burned: nextBurned,
    secondsLeft: nextSeconds,
    lastPile: id,
    cost,
    rescued: true,
  }
}

/** 火场面板文案（v3.5 冻结稿附录逐字；story.ts C7_FIRE 同源引用） */
export const FIRE_TEXT = {
  instruction: '火路每次都不同。抢册会耗时，跨架更慢；先看火势，再决定舍哪一堆。',
  withdraw: '烟呛得人睁不开眼。只能走了。',
} as const

export function takeRegister(
  current: readonly SavedRegisterId[],
  id: SavedRegisterId,
  maxSaved = 3,
): SavedRegisterId[] {
  if (current.includes(id) || current.length >= maxSaved) return [...current]
  return [...current, id].slice(0, maxSaved)
}
