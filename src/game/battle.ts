// 《秦灭六国》Demo — 通用轻量回合制战斗引擎（纯函数，无 React 依赖）
// 设计约束：三人能力固定；敌方行动意图在回合开始时公开；
// 胜利条件由场景配置决定（夺控绞盘 / 击退敌军），不以全歼为唯一目标。

export type HeroId = 'beimang' | 'mengjia' | 'xiaoman' | 'yuenu'

export interface HeroState {
  id: HeroId
  name: string
  hp: number
  maxHp: number
  present: boolean
}

export interface EnemyIntent {
  type: 'attack' | 'hidden' | 'burn'
  target?: HeroId
  dmg: number
  label: string
}

export interface EnemyState {
  uid: number
  specKey: string
  name: string
  hp: number
  maxHp: number
  intent: EnemyIntent
  weakened: number
}

export interface EnemySpec {
  name: string
  hp: number
  dmg: [number, number]
  /** 决定敌方立绘、位移轨迹和命中特效；暗器意图仍会覆盖为远程暗器演出。 */
  weapon?: 'sword' | 'crossbow' | 'mounted' | 'hidden'
  /** 配置后，敌人会隔回合使用一次高伤暗器。 */
  hiddenDmg?: [number, number]
}

export interface BattleConfig {
  mode: 'winch' | 'annihilate' | 'defend'
  enemySpecs: Record<string, EnemySpec>
  initialEnemies: string[]
  reinforcements?: { round: number; spec: string; log: string }[]
  arsonist?: { round: number; spec: string; log: string } // 第一章纵火者
  defendRounds?: number // defend 模式：守到该回合数即胜（C4 护送 / c7_evac 撤离复用）
  /** 限时短战：超过该回合仍未达成目标则立即判负，避免演出拖成长战。 */
  roundLimit?: number
  roundLimitLossLog?: string
  heroHp?: Partial<Record<HeroId, { hp: number; maxHp: number }>>
  heroPresent?: Partial<Record<HeroId, boolean>>
  heroNames?: Partial<Record<HeroId, string>>
  bg?: string // 战斗背景图（缺省按 mode 推导）
  weather?: 'clear' | 'rain'
  environmentSfx?: 'sfx/farmyard_fight.mp3' | 'sfx/city_siege.mp3'
  winLog?: string // 胜利文案（缺省按 mode 推导）
  introLogs: string[]
}

export interface BattleLog {
  round: number
  text: string
}

export interface BattleState {
  round: number
  mode: 'winch' | 'annihilate' | 'defend'
  heroes: Record<HeroId, HeroState>
  enemies: EnemyState[]
  winch: number
  smoke: boolean
  smokeCooldown: number
  guardTarget: HeroId | null
  guardHero: HeroId | null
  censusBurned: boolean
  xiaomanArriveRound: number | null
  acted: HeroId[]
  log: BattleLog[]
  phase: 'player' | 'enemy' | 'won' | 'lost'
  uidSeq: number
  lastHit: { uid: number; damage: number } | null
  winLog: string
}

export interface EnemyPhaseStep {
  uid: number
  kind: 'attack' | 'hidden' | 'miss' | 'burn'
  style?: 'melee' | 'hidden' | 'crossbow' | 'mounted'
  target?: HeroId
  dmg: number
  text: string
}

export interface EnemyPhaseResult {
  state: BattleState
  steps: EnemyPhaseStep[]
}

export type ActionId =
  | 'tuji'
  | 'daduan'
  | 'duokong'
  | 'zhiliao'
  | 'buyan'
  | 'zhidu'
  | 'feizhen'
  | 'jiejian'
  | 'huwei'

export interface ActionDef {
  id: ActionId
  name: string
  target: 'enemy' | 'ally' | 'none'
  desc: string
}

export const ACTIONS: Record<ActionId, ActionDef> = {
  tuji: { id: 'tuji', name: '突击', target: 'enemy', desc: '直剑突进，伤 6–8。' },
  daduan: { id: 'daduan', name: '打断', target: 'enemy', desc: '伤 2，取消目标本回合意图。' },
  duokong: { id: 'duokong', name: '夺控绞盘', target: 'none', desc: '绞盘进度 +1。到 3，城门开。' },
  zhiliao: { id: 'zhiliao', name: '治疗', target: 'ally', desc: '为一名同伴止血，回复 8。' },
  buyan: { id: 'buyan', name: '布烟', target: 'none', desc: '药烟弥漫，敌方本回合攻击落空。冷却 3 回合。' },
  zhidu: { id: 'zhidu', name: '掷毒', target: 'enemy', desc: '撒出毒粉，伤 3–5。医者的自卫手段。' },
  feizhen: { id: 'feizhen', name: '飞针封穴', target: 'enemy', desc: '伤 4；若目标正蓄暗器，则伤 6 并取消暗器。' },
  jiejian: { id: 'jiejian', name: '截剑', target: 'enemy', desc: '伤 5–7，使目标本回合近战伤害减 2。' },
  huwei: { id: 'huwei', name: '护卫', target: 'ally', desc: '本回合替一名同伴挡刀，伤害减半。' },
}

export const HERO_ACTIONS: Record<HeroId, ActionId[]> = {
  beimang: ['tuji', 'daduan', 'duokong'],
  mengjia: ['jiejian', 'huwei', 'duokong'],
  xiaoman: ['zhiliao', 'buyan', 'zhidu', 'duokong'],
  yuenu: ['jiejian', 'feizhen', 'huwei', 'duokong'],
}

export function actionsFor(s: BattleState, hero: HeroId): ActionId[] {
  return HERO_ACTIONS[hero].filter((a) => a !== 'duokong' || s.mode === 'winch')
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

function aliveHeroes(s: BattleState): HeroState[] {
  return Object.values(s.heroes).filter((h) => h.present && h.hp > 0)
}

function makeEnemy(s: BattleState, cfg: BattleConfig, specKey: string): EnemyState {
  const st = cfg.enemySpecs[specKey]
  return {
    uid: s.uidSeq,
    specKey,
    name: st.name,
    hp: st.hp,
    maxHp: st.hp,
    intent: { type: 'attack', dmg: 0, label: '' },
    weakened: 0,
  }
}

function rollIntent(s: BattleState, cfg: BattleConfig, e: EnemyState): EnemyIntent {
  if (cfg.arsonist && e.specKey === cfg.arsonist.spec && !s.censusBurned) {
    return { type: 'burn', dmg: 0, label: '意图：点燃户籍库' }
  }
  const targets = aliveHeroes(s)
  const t = targets[rand(0, targets.length - 1)]
  const spec = cfg.enemySpecs[e.specKey]
  // 有暗器的敌人隔回合出手，规律公开且稳定，玩家能据此做战术判断。
  if (spec.hiddenDmg && (s.round + e.uid) % 2 === 0) {
    const dmg = rand(spec.hiddenDmg[0], spec.hiddenDmg[1])
    return { type: 'hidden', target: t.id, dmg, label: `意图：暗器锁定${t.name}（${dmg}，需打断/布烟/飞针/护卫）` }
  }
  const base = spec.dmg
  const dmg = Math.max(1, rand(base[0], base[1]) - e.weakened)
  return { type: 'attack', target: t.id, dmg, label: `意图：攻击${t.name}（${dmg}）` }
}

function pushLog(s: BattleState, text: string) {
  s.log.push({ round: s.round, text })
}

export function createBattle(cfg: BattleConfig, opts?: { xiaomanLate?: boolean }): BattleState {
  const hpOf = (id: HeroId, def: number) => cfg.heroHp?.[id] ?? { hp: def, maxHp: def }
  const s: BattleState = {
    round: 1,
    mode: cfg.mode,
    heroes: {
      beimang: { id: 'beimang', name: cfg.heroNames?.beimang ?? '北芒', ...hpOf('beimang', 30), present: cfg.heroPresent?.beimang ?? true },
      mengjia: { id: 'mengjia', name: cfg.heroNames?.mengjia ?? '孟甲', ...hpOf('mengjia', 26), present: cfg.heroPresent?.mengjia ?? false },
      xiaoman: { id: 'xiaoman', name: cfg.heroNames?.xiaoman ?? '小满', ...hpOf('xiaoman', 24), present: cfg.heroPresent?.xiaoman ?? !opts?.xiaomanLate },
      yuenu: { id: 'yuenu', name: cfg.heroNames?.yuenu ?? '青翎', ...hpOf('yuenu', 28), present: cfg.heroPresent?.yuenu ?? true },
    },
    enemies: [],
    winch: 0,
    smoke: false,
    smokeCooldown: 0,
    guardTarget: null,
    guardHero: null,
    censusBurned: false,
    xiaomanArriveRound: opts?.xiaomanLate ? 3 : null,
    acted: [],
    log: [],
    phase: 'player',
    uidSeq: 1,
    lastHit: null,
    winLog: cfg.winLog ?? (cfg.mode === 'winch' ? '任务完成：北门已开，大军可以入城。' : '敌兵退尽。'),
  }
  for (const key of cfg.initialEnemies) {
    s.enemies.push(makeEnemy(s, cfg, key))
    s.uidSeq++
  }
  s.enemies.forEach((e) => (e.intent = rollIntent(s, cfg, e)))
  cfg.introLogs.forEach((t) => pushLog(s, t))
  if (opts?.xiaomanLate) pushLog(s, '小满留在疫营，将于第 3 回合赶到。')
  return s
}

export function canAct(s: BattleState, hero: HeroId): boolean {
  const h = s.heroes[hero]
  return s.phase === 'player' && h.present && h.hp > 0 && !s.acted.includes(hero)
}

export function actionAvailable(s: BattleState, a: ActionId): boolean {
  if (a === 'buyan' && s.smokeCooldown > 0) return false
  if (a === 'duokong' && (s.mode !== 'winch' || s.winch >= 3)) return false
  return true
}

export function applyHeroAction(
  prev: BattleState,
  hero: HeroId,
  action: ActionId,
  targetUid?: number,
  targetHero?: HeroId,
): BattleState {
  if (!canAct(prev, hero) || !HERO_ACTIONS[hero].includes(action) || !actionAvailable(prev, action)) return prev
  const def = ACTIONS[action]
  if (def.target === 'enemy' && (targetUid == null || !prev.enemies.some((enemy) => enemy.uid === targetUid && enemy.hp > 0))) {
    return prev
  }
  if (def.target === 'ally') {
    if (!targetHero) return prev
    const target = prev.heroes[targetHero]
    if (!target.present || target.hp <= 0) return prev
    if (action === 'zhiliao' && target.hp >= target.maxHp) return prev
    if (action === 'huwei' && targetHero === hero) return prev
  }
  const s: BattleState = structuredClone(prev)
  s.lastHit = null
  const enemy = targetUid != null ? s.enemies.find((e) => e.uid === targetUid) : undefined

  switch (action) {
    case 'tuji': {
      if (!enemy) break
      const dmg = rand(6, 8)
      enemy.hp -= dmg
      s.lastHit = { uid: enemy.uid, damage: dmg }
      pushLog(s, `北芒突击${enemy.name}，伤 ${dmg}。`)
      break
    }
    case 'daduan': {
      if (!enemy) break
      enemy.hp -= 2
      s.lastHit = { uid: enemy.uid, damage: 2 }
      enemy.intent = { type: 'attack', dmg: 0, label: '意图：被打断，踉跄' }
      pushLog(s, `北芒打断${enemy.name}，其本回合行动被取消。`)
      break
    }
    case 'duokong': {
      s.winch += 1
      pushLog(s, `${s.heroes[hero].name}扳动绞盘。城门绞链咬合（${s.winch}/3）。`)
      if (s.winch >= 3) pushLog(s, '绞盘落定，北门轰然开启！')
      break
    }
    case 'zhiliao': {
      const t = targetHero ? s.heroes[targetHero] : undefined
      if (!t) break
      const heal = Math.min(8, t.maxHp - t.hp)
      t.hp += heal
      pushLog(s, `小满为${t.name}止血，回复 ${heal}。`)
      break
    }
    case 'buyan': {
      s.smoke = true
      s.smokeCooldown = 3
      pushLog(s, '小满撒出药烟，屋内一片呛咳。敌方本回合难以命中。')
      break
    }
    case 'zhidu': {
      if (!enemy) break
      const dmg = rand(3, 5)
      enemy.hp -= dmg
      s.lastHit = { uid: enemy.uid, damage: dmg }
      pushLog(s, `小满扬出毒粉，${enemy.name}掩面后退，伤 ${dmg}。`)
      break
    }
    case 'feizhen': {
      if (!enemy) break
      const countersHidden = enemy.intent.type === 'hidden'
      const dmg = countersHidden ? 6 : 4
      enemy.hp -= dmg
      s.lastHit = { uid: enemy.uid, damage: dmg }
      if (countersHidden) {
        enemy.intent = { type: 'attack', dmg: 0, label: '意图：暗器手被飞针封穴' }
        pushLog(s, `青翎飞针封穴，截住${enemy.name}的暗器，伤 ${dmg}。`)
      } else {
        pushLog(s, `青翎抬手飞针，${enemy.name}中针，伤 ${dmg}。`)
      }
      break
    }
    case 'jiejian': {
      if (!enemy) break
      const dmg = rand(5, 7)
      enemy.hp -= dmg
      s.lastHit = { uid: enemy.uid, damage: dmg }
      enemy.weakened = Math.max(enemy.weakened, 2)
      if (enemy.intent.type === 'attack') {
        enemy.intent.dmg = Math.max(1, enemy.intent.dmg - 2)
        const t = enemy.intent.target ? s.heroes[enemy.intent.target] : undefined
        if (t) enemy.intent.label = `意图：攻击${t.name}（${enemy.intent.dmg}，被截剑削弱）`
      }
      pushLog(s, `${s.heroes[hero].name}截剑${enemy.name}，伤 ${dmg}，其攻势受挫。`)
      break
    }
    case 'huwei': {
      s.guardTarget = targetHero ?? null
      s.guardHero = hero
      pushLog(s, `${s.heroes[hero].name}立于${targetHero ? s.heroes[targetHero].name : ''}身侧，代为挡刀。`)
      break
    }
  }

  const dead = s.enemies.filter((e) => e.hp <= 0)
  dead.forEach((e) => pushLog(s, `${e.name}倒下。`))
  s.enemies = s.enemies.filter((e) => e.hp > 0)

  s.acted.push(hero)

  if (checkEnd(s)) return s

  const pending = aliveHeroes(s).filter((x) => !s.acted.includes(x.id))
  if (pending.length === 0) s.phase = 'enemy'
  return s
}

function checkEnd(s: BattleState): boolean {
  if (s.mode === 'winch' && s.winch >= 3) {
    s.phase = 'won'
    pushLog(s, '任务完成：北门已开，大军可以入城。')
    return true
  }
  if (s.mode === 'annihilate' && s.enemies.length === 0) {
    s.phase = 'won'
    pushLog(s, s.winLog)
    return true
  }
  // defend：一波敌人被打退后直接推进敌方阶段（回合数与增援照走），避免无目标可点而卡死
  if (s.mode === 'defend' && s.enemies.length === 0 && s.phase === 'player') {
    s.phase = 'enemy'
    pushLog(s, '这一波私兵被打退了。山坡上，还有人影在动。')
    return false
  }
  if (aliveHeroes(s).length === 0) {
    s.phase = 'lost'
    pushLog(s, '小队全员倒下。任务失败。')
    return true
  }
  return false
}

export function resolveEnemyPhase(prev: BattleState, cfg: BattleConfig): EnemyPhaseResult {
  if (prev.phase !== 'enemy') return { state: prev, steps: [] }
  const state = structuredClone(prev)
  state.lastHit = null
  return { state, steps: runEnemyPhase(state, cfg) }
}

function runEnemyPhase(s: BattleState, cfg: BattleConfig): EnemyPhaseStep[] {
  const steps: EnemyPhaseStep[] = []
  for (const e of s.enemies) {
    if (e.hp <= 0) continue
    if (e.intent.type === 'burn') {
      s.censusBurned = true
      const text = '纵火者点燃了户籍库！简册卷入火中。'
      pushLog(s, text)
      steps.push({ uid: e.uid, kind: 'burn', dmg: 0, text })
      e.intent = { type: 'attack', dmg: 0, label: '' }
      continue
    }
    if ((e.intent.type === 'attack' || e.intent.type === 'hidden') && e.intent.dmg > 0 && e.intent.target) {
      const isHidden = e.intent.type === 'hidden'
      const weaponStyle = cfg.enemySpecs[e.specKey]?.weapon
      const stepStyle: EnemyPhaseStep['style'] = isHidden
        ? weaponStyle === 'crossbow'
          ? 'crossbow'
          : 'hidden'
        : weaponStyle === 'mounted'
          ? 'mounted'
          : weaponStyle === 'crossbow'
            ? 'crossbow'
            : 'melee'
      if (s.smoke) {
        const text = isHidden
          ? `${e.name}在烟中失了准头，暗器钉入空处。`
          : stepStyle === 'crossbow'
            ? `${e.name}在烟中失了准头，弩矢射入空处。`
            : `${e.name}在烟中挥空。`
        pushLog(s, text)
        steps.push({ uid: e.uid, kind: 'miss', style: stepStyle, target: e.intent.target, dmg: 0, text })
        continue
      }
      let target = s.heroes[e.intent.target]
      let dmg = e.intent.dmg
      if (target.hp <= 0) {
        const rest = aliveHeroes(s)
        if (rest.length === 0) break
        target = rest[0]
      }
      if (s.guardTarget === target.id) {
        const guard = s.guardHero ? s.heroes[s.guardHero] : null
        const guardCanBlock = guard?.present && guard.hp > 0 && guard.id !== target.id
        if (guard && guardCanBlock) {
          dmg = Math.ceil(dmg / 2)
          guard.hp -= dmg
          const text = isHidden
            ? `${e.name}暗器射向${target.name}，${guard.name}抢身挡下，伤 ${dmg}。`
            : `${e.name}攻向${target.name}，${guard.name}横剑挡下，伤 ${dmg}。`
          pushLog(s, text)
          steps.push({ uid: e.uid, kind: isHidden ? 'hidden' : 'attack', style: stepStyle, target: guard.id, dmg, text })
          if (guard.hp < 0) guard.hp = 0
          continue
        }
      }
      {
        target.hp -= dmg
        const text = isHidden
          ? `${e.name}袖中暗器骤发，击中${target.name}，重伤 ${dmg}。`
          : `${e.name}击中${target.name}，伤 ${dmg}。`
        pushLog(s, text)
        steps.push({ uid: e.uid, kind: isHidden ? 'hidden' : 'attack', style: stepStyle, target: target.id, dmg, text })
        if (target.hp <= 0) {
          target.hp = 0
          pushLog(s, `${target.name}倒下！`)
        }
      }
    }
  }

  if (aliveHeroes(s).length === 0) {
    s.phase = 'lost'
    pushLog(s, '小队全员倒下。任务失败。')
    return steps
  }

  s.round += 1
  s.acted = []
  s.smoke = false
  s.guardTarget = null
  s.guardHero = null
  if (s.smokeCooldown > 0) s.smokeCooldown -= 1

  if (cfg.roundLimit != null && s.round > cfg.roundLimit) {
    s.phase = 'lost'
    pushLog(s, cfg.roundLimitLossLog ?? '战机已失。任务失败。')
    return steps
  }

  // defend 模式：守满回合数即胜（C4 护送：守到秦军前锋抵达）
  if (s.mode === 'defend' && cfg.defendRounds != null && s.round > cfg.defendRounds) {
    s.phase = 'won'
    pushLog(s, '秦军前锋抵达。私兵退走。')
    return steps
  }

  if (s.xiaomanArriveRound != null && s.round >= s.xiaomanArriveRound && !s.heroes.xiaoman.present) {
    s.heroes.xiaoman.present = true
    pushLog(s, '小满背着药篓赶到战场！')
  }

  if (cfg.arsonist && s.round === cfg.arsonist.round && !s.censusBurned && !s.enemies.some((e) => e.specKey === cfg.arsonist!.spec)) {
    const e = makeEnemy(s, cfg, cfg.arsonist.spec)
    s.uidSeq++
    e.uid = s.uidSeq
    s.enemies.push(e)
    pushLog(s, cfg.arsonist.log)
  }

  for (const r of cfg.reinforcements ?? []) {
    if (s.round === r.round && s.enemies.length < 4) {
      const e = makeEnemy(s, cfg, r.spec)
      s.uidSeq++
      e.uid = s.uidSeq
      s.enemies.push(e)
      pushLog(s, r.log)
    }
  }

  s.enemies.forEach((e) => {
    // 截剑只削弱已经公开的这一招，不再永久叠加削弱后续回合。
    e.weakened = 0
    e.intent = rollIntent(s, cfg, e)
  })
  // defend 空场：一波已清、增援未至时回合空转，直到下一波出现或守满判胜，避免我方无目标可点卡死
  if (s.mode === 'defend' && s.enemies.length === 0) {
    pushLog(s, '坡上暂无人冲下。你们守住阵型。')
    return steps.concat(runEnemyPhase(s, cfg))
  }
  s.phase = 'player'
  pushLog(s, `—— 第 ${s.round} 回合 ——`)
  return steps
}
