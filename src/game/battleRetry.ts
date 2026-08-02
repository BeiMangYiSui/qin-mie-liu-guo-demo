import type { StoryFlags } from './save'
import { DEFEAT_NARRATION } from './story'

export type RetryBattleId = 's5_zhuishi' | 's6_fusha' | 's9_tongxing' | 'c4_husong' | 'c7_evac'

export const RETRY_BATTLE_IDS: readonly RetryBattleId[] = [
  's5_zhuishi',
  's6_fusha',
  's9_tongxing',
  'c4_husong',
  'c7_evac',
]

// s5/s6/s9/c4 为 v3.5 冻结稿附录战败旁白逐字（DEFEAT_NARRATION 同源）；c7_evac 无冻结对应句，保留占位
export const BATTLE_DEFEAT_PLACEHOLDERS: Record<RetryBattleId, string> = {
  s5_zhuishi: DEFEAT_NARRATION.s5,
  s6_fusha: DEFEAT_NARRATION.s6,
  s9_tongxing: DEFEAT_NARRATION.s9,
  c4_husong: DEFEAT_NARRATION.c4,
  c7_evac: '医篷被乱兵冲散。回到撤离命令下达之时，重新布置防线。',
}

export interface BattleCheckpoint<TPayload = unknown> {
  battleId: RetryBattleId
  stage: string
  flags: StoryFlags
  payload: TPayload
}

const KEY_PREFIX = 'qmlg:battle-checkpoint:'

function clone<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value)) as T
}

export function createBattleCheckpoint<TPayload>(
  battleId: RetryBattleId,
  stage: string,
  flags: StoryFlags,
  payload: TPayload,
): BattleCheckpoint<TPayload> {
  return clone({ battleId, stage, flags, payload })
}

export function restoreBattleCheckpoint<TPayload>(
  checkpoint: BattleCheckpoint<TPayload>,
): BattleCheckpoint<TPayload> {
  return clone(checkpoint)
}

export function writeBattleCheckpoint<TPayload>(
  checkpoint: BattleCheckpoint<TPayload>,
  storage: Storage = sessionStorage,
): void {
  storage.setItem(KEY_PREFIX + checkpoint.battleId, JSON.stringify(checkpoint))
}

export function readBattleCheckpoint<TPayload>(
  battleId: RetryBattleId,
  storage: Storage = sessionStorage,
): BattleCheckpoint<TPayload> | null {
  try {
    const raw = storage.getItem(KEY_PREFIX + battleId)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<BattleCheckpoint<TPayload>>
    if (value.battleId !== battleId || typeof value.stage !== 'string' || !value.flags) return null
    return restoreBattleCheckpoint(value as BattleCheckpoint<TPayload>)
  } catch {
    return null
  }
}

export function clearBattleCheckpoint(
  battleId: RetryBattleId,
  storage: Storage = sessionStorage,
): void {
  storage.removeItem(KEY_PREFIX + battleId)
}
