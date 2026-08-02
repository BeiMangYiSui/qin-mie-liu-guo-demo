import type { C4Tactic } from './c7ChoiceData'

export interface C4TacticReport {
  heading: string
  result: string
  cost: string
}

export const C4_TACTIC_REPORTS: Record<C4Tactic, C4TacticReport> = {
  ambush: {
    heading: '上山设伏',
    result: '伏击奏效，敌军先锋被压在山道下。',
    cost: '孟甲与老卒伤亡最重，后续无力回援疫营。',
  },
  valley: {
    heading: '入谷接应',
    result: '青翎诱敌入谷，郑氏车队得以撤出。',
    cost: '青翎负伤，后续无法追截北逃残军。',
  },
  rear: {
    heading: '自领断后',
    result: '北芒自领断后，主队安全脱离追击。',
    cost: '北芒伤势加重，后续赶不上官署火场。',
  },
}
