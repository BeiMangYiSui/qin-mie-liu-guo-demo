import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Crosshair, Flag, FlaskConical, HeartPulse, Shield, Sword, Wind, Cog, Hand, ScrollText } from 'lucide-react'
import {
  ACTIONS,
  actionAvailable,
  actionsFor,
  applyHeroAction,
  canAct,
  resolveEnemyPhase,
  type ActionId,
  type BattleConfig,
  type BattleState,
  type HeroId,
} from '../game/battle'
import { playSfx, playSfxFile, stopSfxFile, unlockSfxFile } from '../game/audio'
import {
  playStrikeAnimation,
  playHitReaction,
  playCastAnimation,
  playCameraShake,
  type StrikeDirection,
  type StrikeStyle,
} from '../game/animationEngine'
import type { ParticleData, SkillEffectData, SkillEffectKind } from '../components/BattleEffects'
import CinematicBattlefield, {
  type BattlefieldEnemy,
  type BattlefieldHero,
} from '../components/CinematicBattlefield'

const HERO_STYLE: Record<HeroId, { border: string; badge: string; role: string }> = {
  beimang: { border: '#B58A3D', badge: '头领', role: '判断 · 突击 · 打断' },
  mengjia: { border: '#C4A484', badge: '老卒', role: '截剑 · 护卫' },
  xiaoman: { border: '#9DB89A', badge: '医者', role: '治疗 · 布烟 · 掷毒' },
  yuenu: { border: '#7FA3C4', badge: '剑士', role: '截剑 · 护卫' },
}

const HERO_SPRITE: Record<HeroId, string> = {
  beimang: '/assets/battle/hero_beimang_idle_v1.webp',
  mengjia: '/assets/battle/hero_mengjia_idle_v2.webp',
  xiaoman: '/assets/battle/hero_xiaoman_idle_v1.webp',
  yuenu: '/assets/battle/hero_qingling_idle_v1.webp',
}

const DEFAULT_ENEMY_SPRITE = '/assets/battle/enemy_assassin_idle_v1.webp'

const ENEMY_SPRITE_BY_SPEC: Record<string, string> = {
  youxia: DEFAULT_ENEMY_SPRITE,
  toutmu: '/assets/battle/enemy_toumu_idle_v1.webp',
  zu: '/assets/battle/enemy_hanzu_idle_v1.webp',
  zhang: '/assets/battle/enemy_hanwu_idle_v1.webp',
  huo: '/assets/battle/enemy_zonghuo_idle_v1.webp',
  sibing: DEFAULT_ENEMY_SPRITE,
  jingrui: '/assets/battle/enemy_toumu_idle_v1.webp',
  sishi: DEFAULT_ENEMY_SPRITE,
  qishou: '/assets/battle/enemy_rider_idle_v1.webp',
  weishi: '/assets/battle/enemy_hanzu_idle_v1.webp',
  anzhuang: DEFAULT_ENEMY_SPRITE,
  mengzu: DEFAULT_ENEMY_SPRITE,
  nushou: '/assets/battle/enemy_crossbow_idle_v1.webp',
  zhizao: '/assets/battle/enemy_toumu_idle_v1.webp',
}

const ACTION_ICON: Record<ActionId, typeof Sword> = {
  tuji: Sword,
  daduan: Hand,
  duokong: Cog,
  zhiliao: HeartPulse,
  buyan: Wind,
  zhidu: FlaskConical,
  feizhen: Crosshair,
  jiejian: Sword,
  huwei: Shield,
}

const ACTION_SFX: Record<ActionId, 'hit' | 'interrupt' | 'rescue' | 'hold' | 'select'> = {
  tuji: 'hit',
  daduan: 'interrupt',
  duokong: 'select',
  zhiliao: 'rescue',
  buyan: 'hold',
  zhidu: 'hold',
  feizhen: 'interrupt',
  jiejian: 'hit',
  huwei: 'hold',
}

const ACTION_KIND: Record<ActionId, 'attack' | 'support' | 'interact'> = {
  tuji: 'attack',
  daduan: 'attack',
  duokong: 'interact',
  zhiliao: 'support',
  buyan: 'support',
  zhidu: 'attack',
  feizhen: 'attack',
  jiejian: 'attack',
  huwei: 'support',
}

const ACTION_VISUAL: Record<ActionId, { effect: SkillEffectKind; color: string; particle?: ParticleData['kind']; shake: boolean; speed: boolean }> = {
  tuji: { effect: 'thrust', color: '#F4D47A', particle: 'shard', shake: true, speed: true },
  daduan: { effect: 'break', color: '#D9A36A', particle: 'shard', shake: true, speed: false },
  duokong: { effect: 'winch', color: '#D2AC63', shake: false, speed: false },
  zhiliao: { effect: 'heal', color: '#9DB89A', particle: 'droplet', shake: false, speed: false },
  buyan: { effect: 'smoke', color: '#B7C1AF', shake: false, speed: false },
  zhidu: { effect: 'poison', color: '#82A66F', particle: 'droplet', shake: false, speed: false },
  feizhen: { effect: 'needle', color: '#8FC8D8', particle: 'shard', shake: false, speed: false },
  jiejian: { effect: 'sword', color: '#E9C46A', particle: 'spark', shake: true, speed: false },
  huwei: { effect: 'guard', color: '#C4A484', shake: false, speed: false },
}

type Floater = { id: number; target: number | HeroId; text: string; color: string }
type ImpactPoint = { x: number; y: number }

export default function BattleScene({
  battle,
  cfg,
  title,
  objective,
  enemyLabel,
  defeatText,
  setBattle,
  onFinish,
  onRetry,
}: {
  battle: BattleState
  cfg: BattleConfig
  title: string
  objective: string
  enemyLabel: string
  /** 战败旁白（附录冻结文案）：战败回卷时随重试按钮展示 */
  defeatText?: string
  setBattle: (b: BattleState) => void
  onFinish: () => void
  onRetry: () => void
}) {
  const [pendingAction, setPendingAction] = useState<ActionId | null>(null)
  const [floaters, setFloaters] = useState<Floater[]>([])
  const [hitUids, setHitUids] = useState<number[]>([])
  const [actingHero, setActingHero] = useState<HeroId | null>(null)
  const [actingEnemy, setActingEnemy] = useState<number | null>(null)
  const [actingKind, setActingKind] = useState<'attack' | 'support' | 'interact' | null>(null)
  const [impactTarget, setImpactTarget] = useState<number | HeroId | null>(null)
  const [enemyImpactHero, setEnemyImpactHero] = useState<HeroId | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [particles, setParticles] = useState<ParticleData[]>([])
  const [speedLines, setSpeedLines] = useState<{ active: boolean; direction: 'ltr' | 'rtl' }>({ active: false, direction: 'ltr' })
  const [skillEffect, setSkillEffect] = useState<SkillEffectData | null>(null)
  const seq = useRef(1)
  const actionFxTimers = useRef<number[]>([])
  const enemyFxTimers = useRef<number[]>([])
  const enemySequenceRunning = useRef(false)
  const actionRun = useRef(0)
  const enemyRun = useRef(0)
  const audioRetriedRef = useRef(false)
  const battleLogRef = useRef<HTMLDivElement | null>(null)
  const battlefieldRef = useRef<HTMLElement | null>(null)
  const heroEls = useRef<Map<string, HTMLElement>>(new Map())
  const enemyEls = useRef<Map<number, HTMLElement>>(new Map())

  const registerHeroRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) heroEls.current.set(id, el)
    else heroEls.current.delete(id)
  }, [])
  const registerEnemyRef = useCallback((uid: number, el: HTMLElement | null) => {
    if (el) enemyEls.current.set(uid, el)
    else enemyEls.current.delete(uid)
  }, [])

  const targetCenter = useCallback((targetEl: HTMLElement): ImpactPoint => {
    const battlefield = battlefieldRef.current
    if (!battlefield) return { x: 50, y: 50 }
    const targetFigure = targetEl.querySelector<HTMLElement>('.cinematic-actor__figure') ?? targetEl
    const fieldRect = battlefield.getBoundingClientRect()
    const targetRect = targetFigure.getBoundingClientRect()
    if (fieldRect.width <= 0 || fieldRect.height <= 0) return { x: 50, y: 50 }
    return {
      x: ((targetRect.left + targetRect.width / 2 - fieldRect.left) / fieldRect.width) * 100,
      y: ((targetRect.top + targetRect.height * 0.44 - fieldRect.top) / fieldRect.height) * 100,
    }
  }, [])

  const spawnImpact = useCallback((
    targetEl: HTMLElement,
    effect: SkillEffectKind,
    color: string,
    direction: StrikeDirection,
    intensity = 1,
    particle?: ParticleData['kind'],
    shake = true,
  ) => {
    const { x, y } = targetCenter(targetEl)
    const id = seq.current++
    if (particle) {
      setParticles((old) => [...old, { id, x, y, color, kind: particle }])
      window.setTimeout(() => setParticles((old) => old.filter((p) => p.id !== id)), 700)
    }
    setSkillEffect({ id, x, y, kind: effect, direction, color })
    window.setTimeout(() => setSkillEffect((current) => current?.id === id ? null : current), 720)
    if (shake && battlefieldRef.current) {
      playCameraShake(battlefieldRef.current, { direction, intensity, originX: x, originY: y })
    }
  }, [targetCenter])

  const spawnFieldEffect = useCallback((
    effect: SkillEffectKind,
    color: string,
    x = 50,
    y = 50,
    direction: StrikeDirection = 'ltr',
  ) => {
    const id = seq.current++
    setSkillEffect({ id, x, y, kind: effect, direction, color })
    window.setTimeout(() => setSkillEffect((current) => current?.id === id ? null : current), 760)
  }, [])

  // 战斗环境音由场景显式指定；仅为旧配置保留 mode 兜底。
  useEffect(() => {
    const env = cfg.environmentSfx ?? (cfg.mode === 'annihilate' ? 'sfx/farmyard_fight.mp3' : 'sfx/city_siege.mp3')
    audioRetriedRef.current = false
    playSfxFile(env, { loop: true, volume: 0.12, channel: 'environment' })
    return () => {
      stopSfxFile('environment')
      actionFxTimers.current.forEach((timer) => window.clearTimeout(timer))
      actionFxTimers.current = []
      enemyFxTimers.current.forEach((timer) => window.clearTimeout(timer))
      enemyFxTimers.current = []
      enemySequenceRunning.current = false
      actionRun.current += 1
      enemyRun.current += 1
    }
  }, [cfg.environmentSfx, cfg.mode])

  const unlockBattleAudio = () => {
    if (audioRetriedRef.current) return
    audioRetriedRef.current = true
    unlockSfxFile('environment')
  }

  // 绞盘进度音：每拨动一次绞盘响一声
  useEffect(() => {
    if (cfg.mode === 'winch' && battle.winch > 0 && battle.winch < 3) {
      playSfxFile('sfx/winch_chains.mp3', { volume: 0.3 })
    }
    if (cfg.mode === 'winch' && battle.winch >= 3) {
      playSfxFile('sfx/winch_chains.mp3', { volume: 0.35 })
    }
  }, [battle.winch, cfg.mode])

  const activeHero: HeroId | null = useMemo(() => {
    const order: HeroId[] = ['beimang', 'mengjia', 'xiaoman', 'yuenu']
    return order.find((id) => canAct(battle, id)) ?? null
  }, [battle])

  const addFloaters = (prev: BattleState, next: BattleState, markEnemyHits = true) => {
    const fs: Floater[] = []
    for (const p of prev.enemies) {
      const e = next.enemies.find((x) => x.uid === p.uid)
      const damage = next.lastHit?.uid === p.uid ? next.lastHit.damage : e ? p.hp - e.hp : p.hp
      if (damage > 0) fs.push({ id: seq.current++, target: p.uid, text: `-${damage}`, color: '#E9C46A' })
    }
    for (const id of Object.keys(next.heroes) as HeroId[]) {
      const p = prev.heroes[id]
      const n = next.heroes[id]
      if (n.hp < p.hp) fs.push({ id: seq.current++, target: id, text: `-${p.hp - n.hp}`, color: '#E06A5A' })
      else if (n.hp > p.hp) fs.push({ id: seq.current++, target: id, text: `+${n.hp - p.hp}`, color: '#9DB89A' })
    }
    if (fs.length > 0) {
      setFloaters((old) => [...old, ...fs])
      const ids = fs.map((f) => f.id)
      setTimeout(() => setFloaters((old) => old.filter((f) => !ids.includes(f.id))), 950)
    }
    const hit = prev.enemies.filter((p) => {
      const e = next.enemies.find((x) => x.uid === p.uid)
      return !e || e.hp < p.hp
    })
    if (markEnemyHits && hit.length > 0) {
      setHitUids(hit.map((enemy) => enemy.uid))
      setTimeout(() => setHitUids([]), 300)
    }
    const heroHurt = (Object.keys(next.heroes) as HeroId[]).some((id) => next.heroes[id].hp < prev.heroes[id].hp)
    if (heroHurt) playSfx('hurt')
    if (next.phase === 'won' && prev.phase !== 'won') playSfx('win')
  }

  useEffect(() => {
    if (battle.phase !== 'enemy' || enemySequenceRunning.current) return
    const { state: next, steps } = resolveEnemyPhase(battle, cfg)
    enemySequenceRunning.current = true
    const runId = ++enemyRun.current
    enemyFxTimers.current.forEach((timer) => window.clearTimeout(timer))
    enemyFxTimers.current = []

    const remainingHp = Object.fromEntries(
      (Object.keys(battle.heroes) as HeroId[]).map((id) => [id, battle.heroes[id].hp]),
    ) as Record<HeroId, number>

    const showStepFloater = (target: number | HeroId, text: string, color: string) => {
      const floater = { id: seq.current++, target, text, color }
      setFloaters((old) => [...old, floater])
      enemyFxTimers.current.push(
        window.setTimeout(() => setFloaters((old) => old.filter((item) => item.id !== floater.id)), 950),
      )
    }

    const runSequence = async () => {
      for (const step of steps) {
        if (enemyRun.current !== runId) return
        const enemyEl = enemyEls.current.get(step.uid)
        const targetEl = step.target ? heroEls.current.get(step.target) : null
        setActingEnemy(step.uid)
        setEnemyImpactHero(null)

        if ((step.kind === 'attack' || step.kind === 'hidden' || step.kind === 'miss') && enemyEl && targetEl) {
          let reaction: Promise<void> = Promise.resolve()
          const lethal = step.kind !== 'miss' && step.target
            ? remainingHp[step.target] > 0 && remainingHp[step.target] - step.dmg <= 0
            : false
          const enemyStrikeStyle: StrikeStyle = step.style === 'crossbow'
            ? 'crossbow'
            : step.style === 'mounted'
              ? 'mounted'
              : step.style === 'hidden'
                ? 'anqi'
                : 'enemy'
          const enemyEffect: SkillEffectKind = step.style === 'crossbow'
            ? 'crossbow-bolt'
            : step.style === 'mounted'
              ? 'mounted-strike'
              : step.kind === 'hidden'
                ? 'hidden-weapon'
                : 'enemy-slash'
          const ranged = step.style === 'crossbow' || step.kind === 'hidden'
          await playStrikeAnimation(enemyEl, targetEl, enemyStrikeStyle, {
            onImpact: () => {
              if (enemyRun.current !== runId) return
              if ((step.kind === 'attack' || step.kind === 'hidden') && step.target) {
                showStepFloater(step.target, `-${step.dmg}`, '#E06A5A')
                playSfx('hurt')
                spawnImpact(
                  targetEl,
                  enemyEffect,
                  ranged ? '#8FC8D8' : step.style === 'mounted' ? '#E9A06F' : '#E06A5A',
                  'rtl',
                  lethal ? 1.25 : 0.9,
                  ranged ? 'shard' : 'spark',
                  step.style !== 'crossbow' && step.kind !== 'hidden',
                )
              } else {
                showStepFloater(step.uid, '落空', '#C4A484')
              }
              if (!ranged) {
                setSpeedLines({ active: true, direction: 'rtl' })
                enemyFxTimers.current.push(
                  window.setTimeout(() => setSpeedLines((current) => ({ ...current, active: false })), 250),
                )
              }
            },
            onHitStopEnd: () => {
              if (step.kind === 'attack' || step.kind === 'hidden') {
                reaction = playHitReaction(targetEl, 'rtl', { lethal, intensity: lethal ? 1.25 : 0.9 })
              }
            },
          })
          await reaction
          if ((step.kind === 'attack' || step.kind === 'hidden') && step.target) {
            remainingHp[step.target] = Math.max(0, remainingHp[step.target] - step.dmg)
          }
        } else if (step.kind === 'burn') {
          showStepFloater(step.uid, '纵火！', '#E06A5A')
          if (enemyEl) {
            spawnFieldEffect('fire', '#E06A5A', 70, 45, 'rtl')
            await playCastAnimation(enemyEl)
          }
        } else {
          showStepFloater(step.uid, step.kind === 'miss' ? '落空' : step.text, '#C4A484')
          await new Promise<void>((resolve) => window.setTimeout(resolve, 360))
        }

        setActingEnemy(null)
        setEnemyImpactHero(null)
      }

      if (enemyRun.current !== runId) return
      setBattle(next)
      enemySequenceRunning.current = false
      setIsAnimating(false)
    }

    enemyFxTimers.current.push(
      window.setTimeout(() => {
        if (enemyRun.current !== runId) return
        setIsAnimating(true)
        void runSequence().catch(() => {
          if (enemyRun.current !== runId) return
          setBattle(next)
          setActingEnemy(null)
          setEnemyImpactHero(null)
          enemySequenceRunning.current = false
          setIsAnimating(false)
        })
      }, 0),
    )
  }, [battle, cfg, setBattle, spawnFieldEffect, spawnImpact])

  // 只滚动右侧日志自身。scrollIntoView 会连带滚动整个页面，点技能触发重渲染时就会造成战场下跳。
  useEffect(() => {
    const log = battleLogRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [battle.log.length])

  const act = (action: ActionId, targetUid?: number, targetHero?: HeroId) => {
    if (!activeHero || isAnimating) return
    unlockBattleAudio()
    const next = applyHeroAction(battle, activeHero, action, targetUid, targetHero)
    if (next === battle) return
    const hero = activeHero
    const kind = ACTION_KIND[action]
    const runId = ++actionRun.current
    setActingHero(hero)
    setActingKind(kind)
    // 攻击特效在真实接触帧生成；治疗等支援仍提前标出目标。
    setImpactTarget(kind === 'support' ? targetUid ?? targetHero ?? null : null)
    setIsAnimating(true)
    setPendingAction(null)
    actionFxTimers.current.forEach((timer) => window.clearTimeout(timer))
    actionFxTimers.current = []

    const heroEl = heroEls.current.get(hero)
    const targetEl = targetUid != null ? enemyEls.current.get(targetUid) : targetHero ? heroEls.current.get(targetHero) : null

    if (kind === 'attack' && heroEl && targetEl) {
      const targetBefore = targetUid != null ? battle.enemies.find((enemy) => enemy.uid === targetUid) : null
      const targetAfter = targetUid != null ? next.enemies.find((enemy) => enemy.uid === targetUid) : null
      const lethal = Boolean(targetBefore && !targetAfter)
      const strikeStyle: StrikeStyle = action === 'feizhen' ? 'anqi' : action as StrikeStyle
      const intensity = action === 'tuji' ? 1.2 : action === 'daduan' ? 0.82 : action === 'zhidu' ? 0.68 : action === 'feizhen' ? 0.76 : 1
      const visual = ACTION_VISUAL[action]

      const runAttack = async () => {
        let reaction: Promise<void> = Promise.resolve()
        await playStrikeAnimation(heroEl, targetEl, strikeStyle, {
          onImpact: () => {
            if (actionRun.current !== runId) return
            playSfx(ACTION_SFX[action])
            addFloaters(battle, next, false)
            spawnImpact(targetEl, visual.effect, visual.color, 'ltr', intensity, visual.particle, visual.shake)
            if (visual.speed) {
              setSpeedLines({ active: true, direction: 'ltr' })
              actionFxTimers.current.push(
                window.setTimeout(() => setSpeedLines((current) => ({ ...current, active: false })), 250),
              )
            }
          },
          onHitStopEnd: () => {
            reaction = playHitReaction(targetEl, 'ltr', { lethal, intensity })
          },
        })
        await reaction
        if (actionRun.current !== runId) return
        // 数值与退场只在完整受击动作结束后提交。
        setBattle(next)
        setActingHero(null)
        setActingKind(null)
        setImpactTarget(null)
        setIsAnimating(false)
      }

      void runAttack().catch(() => {
        if (actionRun.current !== runId) return
        setBattle(next)
        setActingHero(null)
        setActingKind(null)
        setImpactTarget(null)
        setIsAnimating(false)
      })
    } else if (kind === 'support' && heroEl) {
      // 施法/治疗动画
      void playCastAnimation(heroEl).then(() => {
        if (actionRun.current !== runId) return
        setBattle(next)
        setActingHero(null)
        setActingKind(null)
        setImpactTarget(null)
        setIsAnimating(false)
      })
      actionFxTimers.current.push(
        window.setTimeout(() => {
          playSfx(ACTION_SFX[action])
          addFloaters(battle, next)
          const visual = ACTION_VISUAL[action]
          if (targetEl) {
            spawnImpact(targetEl, visual.effect, visual.color, 'ltr', 0.35, visual.particle, false)
          } else if (action === 'buyan') {
            spawnFieldEffect('smoke', visual.color, 42, 55)
          }
        }, 280),
      )
    } else {
      // interact 或无元素回退：保留计时器方案
      actionFxTimers.current = [
        window.setTimeout(() => {
          playSfx(ACTION_SFX[action])
          addFloaters(battle, next)
          const visual = ACTION_VISUAL[action]
          if (heroEl) {
            spawnImpact(heroEl, visual.effect, visual.color, 'ltr', 0.25, visual.particle, false)
          }
        }, 260),
        window.setTimeout(() => setBattle(next), 610),
        window.setTimeout(() => {
          setActingHero(null)
          setActingKind(null)
          setImpactTarget(null)
          setIsAnimating(false)
        }, 880),
      ]
    }
  }

  const pickAction = (a: ActionId) => {
    if (isAnimating) return
    unlockBattleAudio()
    playSfx('select')
    const def = ACTIONS[a]
    if (def.target === 'none') act(a)
    else setPendingAction(a)
  }

  const pendingDef = pendingAction ? ACTIONS[pendingAction] : null
  const hasAvailableTarget = (action: ActionId) => {
    if (action === 'zhiliao') {
      return Object.values(battle.heroes).some((hero) => hero.present && hero.hp > 0 && hero.hp < hero.maxHp)
    }
    if (action === 'huwei') {
      return Object.values(battle.heroes).some((hero) => hero.id !== activeHero && hero.present && hero.hp > 0)
    }
    return true
  }
  const battleBackground =
    cfg.bg ?? (cfg.mode === 'winch' ? '/assets/bg_jiaopanfang.webp' : cfg.mode === 'defend' ? '/assets/bg_zhengdi_dao.webp' : '/assets/bg_nongjia.webp')
  const heroOrder: HeroId[] = ['mengjia', 'xiaoman', 'yuenu', 'beimang']
  const heroViews: BattlefieldHero[] = heroOrder.map((id) => {
    const hero = battle.heroes[id]
    const style = HERO_STYLE[id]
    const injured = hero.hp < hero.maxHp && hero.maxHp > 24 && id === 'beimang' && hero.present
    return {
      id,
      name: hero.name,
      sprite: HERO_SPRITE[id],
      hp: hero.hp,
      maxHp: hero.maxHp,
      color: style.border,
      present: hero.present,
      active: activeHero === id && battle.phase === 'player' && !isAnimating,
      down: hero.present && hero.hp <= 0,
      status: !hero.present
        ? '尚未归队'
        : hero.hp <= 0
          ? '倒地'
          : injured
            ? '伤未愈'
            : battle.acted.includes(id)
              ? '已行动'
              : activeHero === id
                ? '待命'
                : '等待',
      scale: id === 'beimang' ? 1.45 : id === 'yuenu' ? 1.39 : id === 'mengjia' ? 1.34 : 1.37,
      targetable:
        pendingAction === 'zhiliao'
          ? hero.hp < hero.maxHp
          : pendingAction === 'huwei'
            ? id !== activeHero
            : true,
    }
  })
  const enemyViews: BattlefieldEnemy[] = battle.enemies.map((enemy) => ({
    uid: enemy.uid,
    name: enemy.name,
    sprite: ENEMY_SPRITE_BY_SPEC[enemy.specKey] ?? DEFAULT_ENEMY_SPRITE,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    intent: enemy.intent.label || '意图不明',
    intentType: enemy.intent.type,
    danger: enemy.intent.type === 'burn' || enemy.intent.type === 'hidden',
    variant:
      enemy.intent.type === 'burn'
        ? 'arsonist'
        : enemy.specKey === 'zhizao' || enemy.name.includes('头目') || enemy.name.includes('伍长')
          ? 'leader'
          : 'normal',
  }))
  const currentEnemyLabel = [...new Set(battle.enemies.map((enemy) => enemy.name))].join(' / ') || enemyLabel
  const urgentIntent = [...battle.enemies]
    .filter((enemy) => enemy.intent.dmg > 0)
    .sort((left, right) => right.intent.dmg - left.intent.dmg)[0]
  const tacticalNotice = urgentIntent?.intent.target
    ? urgentIntent.intent.type === 'hidden'
      ? `${urgentIntent.name}正以暗器锁定${battle.heroes[urgentIntent.intent.target].name}：用打断、布烟、飞针封穴或护卫拆招。`
      : `${urgentIntent.name}将攻击${battle.heroes[urgentIntent.intent.target].name}：可用截剑削弱、打断取消，或护卫承伤。`
    : null

  return (
    <div className="relative min-h-screen overflow-hidden bg-qin-charcoal text-qin-parchment flex flex-col">
      <img
        src={battleBackground}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.style.display = 'none'
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-qin-ink/65" />

      <header className="relative z-10 py-3 pl-6 pr-16 border-b border-qin-bronze-25 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-qin-bronze tracking-[0.2em] text-sm">{title}</span>
        <span className="text-sm text-qin-parchment-65">第 {battle.round} 回合</span>
        {battle.mode === 'winch' && (
          <span className="flex items-center gap-2 text-sm">
            <Flag className="w-4 h-4 text-qin-bronze" />
            绞盘
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`w-6 h-2 border ${i < battle.winch ? 'bg-qin-bronze border-qin-bronze' : 'border-qin-parchment-25'}`}
                />
              ))}
            </span>
          </span>
        )}
        {battle.mode === 'defend' && cfg.defendRounds != null && (
          <span className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-qin-bronze" />
            坚守 {Math.min(battle.round, cfg.defendRounds)}/{cfg.defendRounds} 回合
          </span>
        )}
        {cfg.arsonist && (
          <span className={`flex items-center gap-1 text-sm ${battle.censusBurned ? 'text-[#C4746A]' : 'text-qin-parchment-65'}`}>
            <ScrollText className="w-4 h-4" />
            {battle.censusBurned ? '户籍已焚' : '户籍尚在'}
          </span>
        )}
        <span className="ml-auto text-xs text-qin-parchment-40">{objective}</span>
      </header>

      <div className="relative z-10 flex-1 flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] min-h-0">
        <div className="flex min-w-0 flex-1 flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
          <CinematicBattlefield
            roundLabel={`第 ${battle.round} 回合`}
            turnLabel={
              battle.phase === 'enemy'
                ? isAnimating
                  ? '敌方进攻'
                  : '敌方行动'
                : isAnimating
                ? '招式演出'
                : battle.phase === 'won'
                  ? '战局已定'
                  : battle.phase === 'lost'
                    ? '小队溃败'
                    : activeHero
                      ? `${battle.heroes[activeHero].name} 行动`
                      : '等待行动'
            }
            enemyLabel={currentEnemyLabel}
            heroes={heroViews}
            enemies={enemyViews}
            targetMode={!isAnimating && pendingDef?.target === 'enemy' ? 'enemy' : !isAnimating && pendingDef?.target === 'ally' ? 'ally' : null}
            actingHero={actingHero}
            actingEnemy={actingEnemy}
            actingKind={actingKind}
            impactTarget={impactTarget}
            enemyImpactHero={enemyImpactHero}
            hitEnemyIds={hitUids}
            floaters={floaters}
            smoke={battle.smoke}
            particles={particles}
            speedLines={speedLines}
            skillEffect={skillEffect}
            weather={cfg.weather ?? 'clear'}
            containerRef={battlefieldRef}
            registerHeroRef={registerHeroRef}
            registerEnemyRef={registerEnemyRef}
            onEnemyClick={(uid) => {
              if (pendingAction) act(pendingAction, uid)
            }}
            onHeroClick={(id) => {
              if (pendingAction) act(pendingAction, undefined, id as HeroId)
            }}
          />

          {/* 行动面板 */}
          <div className="battle-command sticky bottom-0 z-20 min-h-28 border border-qin-bronze-50 p-3 sm:p-4">
            {battle.phase === 'won' && <EndPanel text={battle.log[battle.log.length - 1]?.text ?? '任务完成。'} btn="继续" onClick={onFinish} />}
            {battle.phase === 'lost' && (
              <EndPanel text={defeatText ?? '小队全员倒下。任务失败。'} btn="重整旗鼓，再试一次" onClick={onRetry} />
            )}
            {battle.phase === 'enemy' && (
              <div className="flex min-h-20 items-center text-[#C4746A]">
                敌方行动中{isAnimating ? '……' : '…'}
              </div>
            )}
            {battle.phase === 'player' && activeHero && (
              <div>
                {tacticalNotice && !isAnimating && (
                  <div className={`mb-3 border-l-2 px-3 py-2 text-xs leading-5 ${urgentIntent?.intent.type === 'hidden' ? 'border-[#E06A5A] bg-qin-cinnabar-15 text-[#F0A293]' : 'border-qin-bronze bg-qin-bronze-10 text-[#E9C46A]'}`}>
                    <strong className="mr-2 tracking-wider">敌方计谋</strong>
                    {tacticalNotice}
                  </div>
                )}
                <div className="text-sm text-qin-bronze mb-3">
                  {isAnimating
                    ? '招式演出中'
                    : pendingDef
                      ? `选择「${pendingDef.name}」的目标（点击${pendingDef.target === 'enemy' ? '敌方' : '我方'}单位）`
                      : `${battle.heroes[activeHero].name} 待命`}
                  {pendingDef && !isAnimating && (
                    <button className="ml-4 text-qin-parchment-50 underline text-xs" onClick={() => setPendingAction(null)}>
                      取消
                    </button>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:gap-3">
                  {actionsFor(battle, activeHero).map((a) => {
                    const def = ACTIONS[a]
                    const Icon = ACTION_ICON[a]
                    const ok = actionAvailable(battle, a) && hasAvailableTarget(a)
                    return (
                      <button
                        key={a}
                        disabled={!ok || isAnimating}
                        onClick={() => pickAction(a)}
                        className={`battle-command__action flex min-w-[8.5rem] items-start gap-2 border px-3 py-2.5 text-left transition-colors sm:min-w-0 sm:px-4 sm:py-3 ${
                          pendingAction === a
                            ? 'border-qin-bronze bg-qin-bronze-15'
                            : ok && !isAnimating
                              ? 'border-qin-parchment-10 hover:border-qin-bronze hover:bg-qin-cinnabar-15'
                              : 'border-qin-parchment-10 opacity-40'
                        }`}
                      >
                        <span className="battle-command__icon">
                          <Icon className="h-4 w-4 text-[#E9C46A]" />
                        </span>
                        <span>
                          <span className="block font-bold">{def.name}</span>
                          <span className="block text-xs text-qin-parchment-50 mt-0.5 max-w-52">{def.desc}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 战斗记录 */}
        <details className="battle-log-mobile mx-3 mb-4 border border-qin-bronze-25 bg-[#17181be8] lg:hidden">
          <summary className="cursor-pointer px-4 py-3 text-sm text-qin-bronze">
            战况纪要
            <span className="ml-3 text-xs text-qin-parchment-65">{battle.log[battle.log.length - 1]?.text}</span>
          </summary>
          <div className="max-h-44 overflow-y-auto border-t border-qin-bronze-15 px-4 py-3">
            {battle.log.slice(-6).map((l, i) => (
              <div key={i} className="text-sm leading-6 text-qin-parchment-65">
                {l.text}
              </div>
            ))}
          </div>
        </details>
        <aside className="hidden border-t border-qin-bronze-25 bg-[#17181be8] lg:flex lg:max-h-none lg:flex-col lg:border-l lg:border-t-0">
          <div className="px-4 py-2 text-xs tracking-widest text-qin-bronze border-b border-qin-bronze-15">战斗记录</div>
          <div ref={battleLogRef} className="battle-log__scroll flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
            {battle.log.map((l, i) => (
              <div key={i} className={`text-sm leading-6 ${i === battle.log.length - 1 ? 'text-qin-parchment' : 'text-qin-parchment-65'}`}>
                {l.text}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

function EndPanel({ text, btn, onClick }: { text: string; btn: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="text-lg">{text}</div>
      <button onClick={onClick} className="px-6 py-3 bg-qin-cinnabar hover:bg-qin-cinnabar-hover transition-colors tracking-[0.2em]">
        {btn}
      </button>
    </div>
  )
}
