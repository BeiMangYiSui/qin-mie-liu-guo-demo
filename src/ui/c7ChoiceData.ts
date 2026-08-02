import type { C7Choice } from './c8ReportData'

export type C4Tactic = 'ambush' | 'valley' | 'rear'

export interface C7ChoiceOption {
  id: C7Choice
  title: string
  summary: string
}

export const C7_CHOICE_OPTIONS: readonly C7ChoiceOption[] = [
  {
    id: 'register',
    title: '保户籍',
    summary: '赶赴官署火场，最多抢出三册。户籍若存，失散者仍有姓名可循。',
  },
  {
    id: 'troops',
    title: '截残军',
    summary: '追踪五股逃兵留下的痕迹，判断逃路，抢在他们越过北道前封堵。',
  },
  {
    id: 'camp',
    title: '护疫营',
    summary: '赶赴疫营，护住医篷、伤患与药材，撑到撤离。',
  },
] as const

export const C7_LOCKED_CHOICE_BY_TACTIC: Record<C4Tactic, C7Choice> = {
  ambush: 'camp',
  valley: 'troops',
  rear: 'register',
}

export const C4_TACTIC_LABELS: Record<C4Tactic, string> = {
  ambush: '上山设伏',
  valley: '入谷接应',
  rear: '自领断后',
}

export const C7_LOCK_REASON_BY_TACTIC: Record<C4Tactic, string> = {
  ambush: '先前选择“上山设伏”，当前无法及时转往疫营。',
  valley: '先前选择“入谷接应”，当前无法及时追截残军。',
  rear: '先前选择“自领断后”，当前已错过保全户籍的时机。',
}
