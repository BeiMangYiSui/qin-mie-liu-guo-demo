import type { EvacSurvival } from './save'

export type DefenseAction = 'hold' | 'heal' | 'strike'
export type DefensePhase = 'player' | 'won' | 'lost'
export type DefenseThreatId = 'rush' | 'casualties' | 'captain'

export interface DefenseThreat {
  id: DefenseThreatId
  label: string
  detail: string
  response: DefenseAction
  mitigation: Record<DefenseAction, number>
  heal: number
}

export const DEFENSE_THREATS: Record<DefenseThreatId, DefenseThreat> = {
  rush: {
    id: 'rush',
    label: '正面冲阵',
    detail: '乱兵结成一股，正撞医篷。盾阵最能卸力。',
    response: 'hold',
    mitigation: { hold: 6, heal: 1, strike: 2 },
    heal: 2,
  },
  casualties: {
    id: 'casualties',
    label: '担架断裂',
    detail: '伤者失血、队尾拥堵。先救人才能重新移动。',
    response: 'heal',
    mitigation: { hold: 2, heal: 5, strike: 1 },
    heal: 4,
  },
  captain: {
    id: 'captain',
    label: '头目突入',
    detail: '持火头目越过盾线。必须反击逼退，否则阵脚从内侧崩开。',
    response: 'strike',
    mitigation: { hold: 1, heal: 0, strike: 7 },
    heal: 2,
  },
}

export interface DefenseBattleConfig {
  id: 'c4_husong' | 'c7_evac'
  title: string
  objective: string
  targetName: string
  maxTargetHp: number
  rounds: number
  highSurvivalThreshold: number
  waveDamage: readonly number[]
  waveEnemyCount: readonly number[]
  /** 每次开战从不同公开危机序列中抽取一种，杜绝背固定按钮顺序。 */
  wavePlans: readonly (readonly DefenseThreatId[])[]
  enemySprite: string
  introPlaceholder: string
}

export interface DefenseBattleState {
  round: number
  targetHp: number
  phase: DefensePhase
  lastAction: DefenseAction | null
  lastDamage: number
  wavePlan: DefenseThreatId[]
  log: string[]
}

export const C4_ESCORT_BATTLE_CONFIG: DefenseBattleConfig = {
  id: 'c4_husong',
  title: '谷口 · 护送战',
  objective: '保护车队，守住固定回合',
  targetName: '郑氏车队',
  maxTargetHp: 20,
  rounds: 4,
  highSurvivalThreshold: 10,
  waveDamage: [5, 6, 7, 8],
  waveEnemyCount: [1, 2, 2, 3],
  wavePlans: [
    ['rush', 'casualties', 'captain', 'rush'],
    ['captain', 'rush', 'casualties', 'captain'],
    ['casualties', 'captain', 'rush', 'casualties'],
  ],
  enemySprite: '/assets/battle/enemy_hanzu_idle_v1.webp',
  introPlaceholder: '私兵压向郑氏车队。守住谷口，等秦军前锋赶到。',
}

export const EVAC_BATTLE_CONFIG: DefenseBattleConfig = {
  id: 'c7_evac',
  title: '新郑疫营 · 撤离战',
  objective: '观察每轮危机，保护医篷撑到撤离',
  targetName: '医篷',
  maxTargetHp: 20,
  rounds: 4,
  highSurvivalThreshold: 10,
  waveDamage: [7, 8, 9, 10],
  waveEnemyCount: [1, 2, 2, 3],
  wavePlans: [
    ['rush', 'casualties', 'captain', 'rush'],
    ['captain', 'rush', 'casualties', 'captain'],
    ['casualties', 'captain', 'rush', 'casualties'],
  ],
  enemySprite: '/assets/battle/enemy_hanzu_idle_v1.webp',
  introPlaceholder: '乱兵冲着医篷来了——伤兵抢药，溃兵抢命。', // v3.5 冻结稿附录逐字
}

export function createDefenseBattle(config: DefenseBattleConfig, planIndex = 0): DefenseBattleState {
  const plan = config.wavePlans[planIndex % config.wavePlans.length] ?? config.wavePlans[0]
  return {
    round: 1,
    targetHp: config.maxTargetHp,
    phase: 'player',
    lastAction: null,
    lastDamage: 0,
    wavePlan: [...plan],
    log: [config.introPlaceholder],
  }
}

export function currentDefenseThreat(state: DefenseBattleState): DefenseThreat {
  const id = state.wavePlan[Math.min(state.round - 1, state.wavePlan.length - 1)] ?? 'rush'
  return DEFENSE_THREATS[id]
}

export interface DefenseActionPreview {
  mitigation: number
  healed: number
  damage: number
  fatigued: boolean
  isCounter: boolean
}

export function previewDefenseAction(
  state: DefenseBattleState,
  config: DefenseBattleConfig,
  action: DefenseAction,
): DefenseActionPreview {
  const index = Math.min(state.round - 1, config.waveDamage.length - 1)
  const baseDamage = config.waveDamage[index] ?? 0
  const threat = currentDefenseThreat(state)
  const fatigued = state.lastAction === action
  const fatiguePenalty = fatigued ? 2 : 0
  const mitigation = Math.max(0, threat.mitigation[action] - fatiguePenalty)
  const healed = action === 'heal' ? Math.max(0, threat.heal - (fatigued ? 1 : 0)) : 0
  return {
    mitigation,
    healed,
    damage: Math.max(0, baseDamage - mitigation),
    fatigued,
    isCounter: threat.response === action,
  }
}

export function defenseOutcome(
  state: DefenseBattleState,
  config: DefenseBattleConfig,
): EvacSurvival {
  return state.targetHp >= config.highSurvivalThreshold ? 'high' : 'low'
}

export function resolveDefenseRound(
  state: DefenseBattleState,
  config: DefenseBattleConfig,
  action: DefenseAction,
): DefenseBattleState {
  if (state.phase !== 'player') return state

  const preview = previewDefenseAction(state, config, action)
  const threat = currentDefenseThreat(state)
  const mitigation = preview.mitigation
  const healed = preview.healed
  const targetBeforeDamage = Math.min(config.maxTargetHp, state.targetHp + healed)
  const damage = preview.damage
  const targetHp = Math.max(0, targetBeforeDamage - damage)

  const actionLabel = {
    hold: '结阵守线',
    heal: '抢救伤者',
    strike: '反击乱兵',
  }[action]

  const log = [
    ...state.log,
    `第 ${state.round} 回合：${threat.label}；${actionLabel}。`,
    `${preview.isCounter ? '应对得当' : '应对失准'}${preview.fatigued ? '，但连续使用同一战法，众人已经疲惫' : ''}：减伤 ${mitigation}${healed > 0 ? `，抢回 ${healed} 点状态` : ''}，医篷受损 ${damage}。`,
  ]

  if (targetHp <= 0) {
    return {
      ...state,
      targetHp,
      phase: 'lost',
      lastAction: action,
      lastDamage: damage,
      log: [...log, '医篷被冲散。伤者无法继续撤离。'],
    }
  }

  if (state.round >= config.rounds) {
    return {
      ...state,
      targetHp,
      phase: 'won',
      lastAction: action,
      lastDamage: damage,
      log: [...log, '最后一批伤者越过城门，疫营完成撤离。'],
    }
  }

  return {
    ...state,
    round: state.round + 1,
    targetHp,
    lastAction: action,
    lastDamage: damage,
    log,
  }
}
