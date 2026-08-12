// 场景战斗配置：S5 追击、S6 越女破围、S9 农家、C4 护送及灭郑终局战。

import type { BattleConfig } from './battle'
import type { C4Tactic, StoryFlags } from './save'

// S5 追击密使战：截住密使后，北芒与孟甲将其击溃；密使弃囊遁走。
export const PURSUIT_BATTLE: BattleConfig = {
  mode: 'annihilate',
  enemySpecs: {
    sishi: { name: '护逃死士', hp: 10, dmg: [5, 7], weapon: 'sword' },
    qishou: { name: '骑影杀手', hp: 14, dmg: [6, 8], weapon: 'mounted', hiddenDmg: [11, 13] },
  },
  initialEnemies: ['sishi', 'sishi', 'qishou'],
  heroPresent: {
    mengjia: true,
    xiaoman: false,
    yuenu: false,
  },
  bg: './assets/bg_guanyi.webp',
  weather: 'clear',
  environmentSfx: 'sfx/city_siege.mp3',
  winLog: '密使弃囊遁走。行囊到手。',
  introLogs: [
    '截住了。北芒与孟甲并肩压上。',
  ],
}

// S6 绝境后：越女独自从山坡杀入，以一人之剑撕开包围。
// 北芒中钉是战后固定剧情，因此这里只处理围阵死士，不出现放冷箭的幕后弩手。
export const YUENU_BREAKOUT_BATTLE: BattleConfig = {
  mode: 'annihilate',
  roundLimit: 3,
  roundLimitLossLog: '三息已过，合围重新闭死。越女退回坡上，再破一次阵。',
  enemySpecs: {
    weishi: { name: '围阵死士', hp: 5, dmg: [4, 5], weapon: 'sword' },
    anzhuang: { name: '暗桩杀手', hp: 6, dmg: [4, 5], weapon: 'hidden', hiddenDmg: [9, 11] },
  },
  initialEnemies: ['weishi', 'weishi', 'anzhuang'],
  heroPresent: { beimang: false, mengjia: false, xiaoman: false, yuenu: true },
  heroNames: { yuenu: '越女' },
  bg: './assets/bg_zhengdi_yuye.webp',
  weather: 'rain',
  environmentSfx: 'sfx/city_siege.mp3',
  winLog: '越女一人切开合围，山道上终于露出一条退路。',
  introLogs: [
    '她没有等任何人跟上。',
    '一人，一剑，从坡上直切进灭口队的合围。',
    '只有三次出手机会：截住近战，飞针封住暗器，撕开阵线。',
  ],
}

// S9 农家战：三人首次并肩。阿芒伤未愈（HP 上限打折）。
export const FARM_BATTLE: BattleConfig = {
  mode: 'annihilate',
  enemySpecs: {
    youxia: { name: '灭口死士', hp: 11, dmg: [5, 7], weapon: 'sword' },
    toutmu: { name: '灭口头目', hp: 16, dmg: [6, 8], weapon: 'hidden', hiddenDmg: [11, 13] },
  },
  initialEnemies: ['youxia', 'youxia', 'youxia', 'toutmu'],
  weather: 'clear',
  environmentSfx: 'sfx/farmyard_fight.mp3',
  heroHp: {
    beimang: { hp: 14, maxHp: 30 }, // 透骨钉伤未愈
  },
  winLog: '追兵退了。农家小院，重归寂静。',
  introLogs: [
    '追兵搜到了农家。四名死士，一个活口不留。',
    '阿芒伤未愈，只能勉强持剑。',
    '青翎守在门边，小满护住墙角的药篓。',
  ],
}

/** S6 的代价带入农家战：谷口失守会加重北芒伤势，孟甲未被玩家救出会让折返救人的青翎带伤。 */
export function farmBattleForOutcome(flags: StoryFlags): BattleConfig {
  return {
    ...FARM_BATTLE,
    heroHp: {
      beimang: flags.s6_cart_through === false ? { hp: 10, maxHp: 30 } : { hp: 14, maxHp: 30 },
      ...(flags.s6_mengjia_saved === false ? { yuenu: { hp: 20, maxHp: 28 } } : {}),
    },
    introLogs: [
      ...FARM_BATTLE.introLogs,
      ...(flags.s6_cart_through === false ? ['谷口失守后强行突围，阿芒的伤势比预想更重。'] : []),
      ...(flags.s6_mengjia_saved === false ? ['青翎折返救孟甲时伤了左臂。'] : []),
    ],
  }
}

// C4 护送截杀战：护住族人车，守到秦军前锋抵达（坚守 5 回合）。
// 郑氏零伤亡为恒定脚本结果；最坏结局：人人几乎残血。
export const ESCORT_BATTLE: BattleConfig = {
  mode: 'defend',
  defendRounds: 5,
  enemySpecs: {
    sibing: { name: '死战派私兵', hp: 12, dmg: [5, 7], weapon: 'sword' },
    jingrui: { name: '私兵精锐', hp: 16, dmg: [6, 8], weapon: 'hidden', hiddenDmg: [10, 12] },
  },
  initialEnemies: ['sibing', 'sibing', 'jingrui'],
  weather: 'clear',
  environmentSfx: 'sfx/city_siege.mp3',
  reinforcements: [
    { round: 3, spec: 'sibing', log: '山坡上又压下一名死战派私兵。' },
    { round: 4, spec: 'jingrui', log: '一名私兵精锐加入围攻。' },
  ],
  introLogs: [
    '死战派的私兵从山上压下来——灭人证的口，泄困兽之愤。',
    '护住车。守到秦军前锋抵达。',
  ],
}

/** C4 战术直接改变战斗开局，不再只在 C7 延迟锁项。 */
export function escortBattleForTactic(tactic: C4Tactic): BattleConfig {
  if (tactic === 'ambush') {
    return {
      ...ESCORT_BATTLE,
      initialEnemies: ['sibing', 'jingrui'],
      introLogs: [...ESCORT_BATTLE.introLogs, '孟甲与老卒先占高地，第一波私兵被乱箭压住。'],
    }
  }
  if (tactic === 'valley') {
    return {
      ...ESCORT_BATTLE,
      initialEnemies: ['sibing', 'jingrui'],
      reinforcements: ESCORT_BATTLE.reinforcements?.filter((item) => item.round !== 3),
      heroHp: { yuenu: { hp: 20, maxHp: 28 } },
      introLogs: [...ESCORT_BATTLE.introLogs, '青翎诱敌入谷，杀伤最大，左臂也添了一道伤。'],
    }
  }
  return {
    ...ESCORT_BATTLE,
    heroHp: { beimang: { hp: 19, maxHp: 30 } },
    introLogs: [...ESCORT_BATTLE.introLogs, '北芒自领断后，车队最安全，他却带伤接战。'],
  }
}

// C6 末段：韩王已降，回旆盟却趁接防未稳在新郑城内反扑。
// 这场战斗的胜利不是全歼组织，而是击溃其断后阵线；残众随后分路纵火并逃窜。
export const HUIPAI_FINAL_BATTLE: BattleConfig = {
  mode: 'annihilate',
  enemySpecs: {
    mengzu: { name: '回旆盟剑客', hp: 14, dmg: [6, 8], weapon: 'sword' },
    nushou: { name: '回旆盟弩手', hp: 13, dmg: [5, 7], weapon: 'crossbow', hiddenDmg: [11, 13] },
    zhizao: { name: '回旆盟执旐', hp: 20, dmg: [7, 9], weapon: 'hidden', hiddenDmg: [12, 14] },
  },
  initialEnemies: ['mengzu', 'mengzu', 'nushou', 'zhizao'],
  heroPresent: { mengjia: false },
  bg: './assets/bg_xinzheng.webp',
  weather: 'clear',
  environmentSfx: 'sfx/city_siege.mp3',
  winLog: '回旆盟断后阵线崩溃。司马朔带残众散入新郑街巷。',
  introLogs: [
    '降城未靖，回旆盟从三条街同时反扑。',
    '他们以弩手压住路口，执旐者护着司马朔向北撤。',
    '击溃断后阵线，不能让他们重新夺回城门。',
  ],
}

/** 护送战伤势继续带入终局恶战，前段代价会真实压缩容错。 */
export function huipaiBattleForOutcome(flags: StoryFlags): BattleConfig {
  if (flags.c4_performance === 'low') {
    return {
      ...HUIPAI_FINAL_BATTLE,
      heroHp: {
        beimang: { hp: 18, maxHp: 30 },
        xiaoman: { hp: 17, maxHp: 24 },
        yuenu: { hp: 18, maxHp: 28 },
      },
      introLogs: [...HUIPAI_FINAL_BATTLE.introLogs, '山道旧伤未愈，三人都没有再挨一轮暗器的余地。'],
    }
  }
  if (flags.c4_performance === 'mid') {
    return {
      ...HUIPAI_FINAL_BATTLE,
      heroHp: {
        beimang: { hp: 24, maxHp: 30 },
        xiaoman: { hp: 20, maxHp: 24 },
        yuenu: { hp: 22, maxHp: 28 },
      },
    }
  }
  return HUIPAI_FINAL_BATTLE
}
