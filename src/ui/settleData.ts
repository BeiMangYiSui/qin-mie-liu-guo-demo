import type { StoryFlags } from '../game/save'

export type SettleRating = 'head' | 'second' | 'balanced'

export const SETTLE_RATING_LABELS: Record<SettleRating, string> = {
  head: '头功',
  second: '次功',
  balanced: '功过相抵',
}

export function branchOutcomeSucceeded(flags: StoryFlags): boolean {
  if (flags.c7_choice === 'troops') {
    return flags.c7_troops_intercepted == null || flags.c7_troops_intercepted >= 3
  }
  if (flags.c7_choice === 'register') return flags.c7_saved_registers?.includes('huji') ?? false
  if (flags.c7_choice === 'camp') return flags.evac_survival === 'high'
  return false
}

export function calculateSettleRating(flags: StoryFlags): SettleRating {
  let score = 0
  if (flags.c4_performance === 'high') score += 2
  else if (flags.c4_performance === 'mid' || (!flags.c4_performance && flags.c4_tactic)) score += 1
  if (flags.c7_choice) score += 1
  if (branchOutcomeSucceeded(flags)) score += 1

  if (score >= 4) return 'head'
  if (score >= 2) return 'second'
  return 'balanced'
}

export function c4PerformanceLabel(flags: StoryFlags): string {
  if (flags.c4_performance === 'high') return '伤损轻微'
  if (flags.c4_performance === 'mid') return '付出伤损'
  if (flags.c4_performance === 'low') return '惨胜守成'
  return flags.c4_tactic ? '旧档未记伤损' : '尚未参战'
}

export function s6OutcomeLabel(flags: StoryFlags): string {
  const outcomes = [
    flags.s6_yutu_saved === true ? '明卷在' : flags.s6_yutu_saved === false ? '明卷失' : null,
    flags.s6_mengjia_saved === true ? '亲救孟甲' : flags.s6_mengjia_saved === false ? '青翎折返救人' : null,
    flags.s6_cart_through === true ? '谷口守住' : flags.s6_cart_through === false ? '旧部四散' : null,
  ].filter(Boolean)
  return outcomes.length > 0 ? outcomes.join(' · ') : '旧档未记取舍'
}

export function c4TacticLabel(flags: StoryFlags): string {
  const labels = {
    ambush: '上山设伏',
    valley: '入谷接应',
    rear: '自领断后',
  } as const
  return flags.c4_tactic ? labels[flags.c4_tactic] : '尚未选择战术'
}

export function c7ChoiceLabel(flags: StoryFlags): string {
  const labels = {
    register: '抢救官署简册',
    troops: '截击残军',
    camp: '护送疫营',
  } as const
  if (flags.c7_choice === 'troops' && flags.c7_troops_intercepted != null) {
    return `${labels.troops} · 截下 ${flags.c7_troops_intercepted}/5 股`
  }
  return flags.c7_choice ? labels[flags.c7_choice] : '尚未处置'
}

export function c7OutcomeLabel(flags: StoryFlags): string {
  if (flags.c7_choice === 'troops' && flags.c7_troops_intercepted != null) {
    return `北道追截：截下 ${flags.c7_troops_intercepted}/5 股残军。`
  }
  return flags.c7_choice ? SETTLE_TEXT.c7Outcome[flags.c7_choice] : '尚无战果记录'
}

/**
 * 结算面板文案（v3.5 冻结稿附录逐字 + 任务 E §3 裁决的失期秦卒双版本）。
 * story.ts 的 C8_SETTLE 从这里取数，保持唯一数据源。
 */
export const SETTLE_TEXT = {
  title: '玄羽军报 · 核验',
  c7Outcome: {
    register: '官署火起：抢救了官署简册。',
    troops: '截了残军。',
    camp: '护了疫营。',
  } as Record<NonNullable<StoryFlags['c7_choice']>, string>,
  hanhui: { reunited: '韩蕙：父女重逢。', lost: '名册无迹。' },
  soldierBranch: { pleaded: '谷口，守住了。', silent: '笞八十，已领。' },
  ratingLine: {
    head: '“军功爵，进一级。”',
    second: '“战功在册。”',
    balanced: '“功过相抵。下次，挣回来。”',
  } as Record<SettleRating, string>,
} as const
