export interface ShichengCard {
  id: 'c2_fatigue' | 'c2_guests' | 'c8_surrender' | 'c8_canal'
  chapter: 'C2' | 'C8'
  title: string
  history: string
  experienced: string
}

// 卡面文案为 v3.5 冻结稿附录逐字（任务 E §1：ui/*Data.ts 为唯一数据源，story.ts 从这里导入）
export const SHICHENG_CARDS: readonly ShichengCard[] = [
  {
    id: 'c2_fatigue',
    chapter: 'C2',
    title: '疲秦计',
    history:
      '《史记·河渠书》记：韩国派水工郑国入秦，劝秦凿泾水修渠，意图疲秦。修渠途中，事觉，秦欲杀郑国。',
    experienced: '没人记下那场要挟。',
  },
  {
    id: 'c2_guests',
    chapter: 'C2',
    title: '逐客令',
    history: '《史记·李斯列传》记：郑国事发，秦王下令逐客。李斯上《谏逐客书》，秦王乃除逐客之令。',
    experienced: '除令的台阶，是一卷伪令垫出来的。',
  },
  {
    id: 'c8_surrender',
    chapter: 'C8',
    title: '韩亡',
    history: '《史记·秦始皇本纪》记：十七年，内史腾攻韩，得韩王安，尽纳其地。',
    experienced: '降书、城门、武库、粮仓、户籍——史官只记了一个“得”字。',
  },
  {
    id: 'c8_canal',
    chapter: 'C8',
    title: '郑国渠',
    history: '《史记·河渠书》记：渠成，溉田四万余顷，关中为沃野，秦以富强，卒并诸侯。',
    experienced: '一个国亡了。一条渠成了。',
  },
]
