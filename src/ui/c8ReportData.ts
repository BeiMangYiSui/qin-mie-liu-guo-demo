import type { EvacSurvival, SavedRegisterId } from '../game/save'

export type C7Choice = 'register' | 'troops' | 'camp'

export interface MilitaryReportSection {
  heading: string
  result: string
  cost: string
}

export const C8_FIXED_REPORTS = {
  surrender: {
    heading: '韩王受降军报',
    result: '韩王安素车出降，新郑城门、武库、粮仓俱已接收。',
    cost: '城中积尸未敛，疫病与征粮摩擦尚待处置。',
  },
  canal: {
    heading: '渠成军报',
    result: '郑国渠全线通水，关中沃野自此可期。',
    cost: '渠成同旬，韩国覆亡。',
  },
} as const satisfies Record<string, MilitaryReportSection>

export const C8_REPORT_VARIANTS: Record<C7Choice, MilitaryReportSection> = {
  register: {
    heading: '官署急报 · 保户籍',
    result: '官署简册抢出三卷，尚待核验主档。',
    cost: '其余简册焚毁，城中旧籍难以复原。',
  },
  troops: {
    heading: '官署急报 · 截残军',
    result: '残军溃散，北道者寡。',
    cost: '官署与疫营无人回援，火势与伤患只能各自苦撑。',
  },
  camp: {
    heading: '官署急报 · 护疫营',
    result: '疫营完成撤离，伤患存活数尚待核验。',
    cost: '官署户籍焚毁，北道残军脱出。',
  },
}

export function resolveC8ReportVariant(
  choice: C7Choice,
  savedRegisters: readonly SavedRegisterId[] = [],
  evacSurvival?: EvacSurvival,
): MilitaryReportSection {
  if (choice === 'register') {
    const censusSaved = savedRegisters.includes('huji')
    return {
      heading: '官署急报 · 保户籍',
      // 军报正文为 v3.5 冻结文案（story.ts 文本轨从这里取）
      result: censusSaved ? '户籍主档在，人名可循。' : '户籍主档焚毁，其余三册得存。',
      cost: censusSaved
        ? '粮册、地图等未必俱存，城中善后仍缺凭据。'
        : '韩蕙等失散者，再无完整名册可查。',
    }
  }

  if (choice === 'camp') {
    return {
      heading: '官署急报 · 护疫营',
      result: evacSurvival === 'high' ? '疫营伤者，多数得活。' : '疫营伤者，得活者半。',
      cost:
        evacSurvival === 'high'
          ? '官署户籍焚毁，北道残军脱出。'
          : '医篷伤损过半，官署户籍亦未能保全。',
    }
  }

  return C8_REPORT_VARIANTS.troops
}
