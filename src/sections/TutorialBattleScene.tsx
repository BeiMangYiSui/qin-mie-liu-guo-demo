import { useCallback, useEffect, useRef, useState } from 'react'
import { Cog, Hand, Map as MapIcon, Shield, Swords, UserRound, Hourglass } from 'lucide-react'
import {
  AP_PER_ROUND,
  CART_COST,
  MAX_ROUNDS,
  RESCUE_COST,
  T_ACTIONS,
  applyTutorialAction,
  endTutorialTurn,
  type TAction,
  type TutorialState,
} from '../game/tutorial'
import { playSfx } from '../game/audio'
import {
  playCameraShake,
  playCastAnimation,
  playHitReaction,
  playStrikeAnimation,
  type StrikeDirection,
} from '../game/animationEngine'
import type { ParticleData, SkillEffectData, SkillEffectKind } from '../components/BattleEffects'
import CinematicBattlefield, {
  type BattlefieldEnemy,
  type BattlefieldHero,
} from '../components/CinematicBattlefield'

type Floater = { id: number; target: number | 'hero'; text: string; color: string }

const HERO_SPRITE = './assets/battle/hero_beimang_idle_v1.webp'
const ENEMY_SPRITE = './assets/battle/enemy_assassin_idle_v1.webp'

export default function TutorialBattleScene({
  battle,
  setBattle,
  onFinish,
  onRetry,
}: {
  battle: TutorialState
  setBattle: (b: TutorialState) => void
  onFinish: (battle: TutorialState) => void
  onRetry: () => void
}) {
  const [pending, setPending] = useState<TAction | null>(null)
  const [floaters, setFloaters] = useState<Floater[]>([])
  const [hitUids, setHitUids] = useState<number[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [actingKind, setActingKind] = useState<'attack' | 'support' | null>(null)
  const [actingEnemy, setActingEnemy] = useState<number | null>(null)
  const [impactTarget, setImpactTarget] = useState<number | string | null>(null)
  const [particles, setParticles] = useState<ParticleData[]>([])
  const [speedLines, setSpeedLines] = useState<{ active: boolean; direction: 'ltr' | 'rtl' }>({ active: false, direction: 'ltr' })
  const [skillEffect, setSkillEffect] = useState<SkillEffectData | null>(null)
  const seq = useRef(1)
  const actionTimers = useRef<number[]>([])
  const actionRun = useRef(0)
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

  useEffect(
    () => () => {
      actionTimers.current.forEach((timer) => window.clearTimeout(timer))
      actionTimers.current = []
      actionRun.current += 1
    },
    [],
  )

  useEffect(() => {
    const log = battleLogRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [battle.log.length])

  const targetCenter = useCallback((targetEl: HTMLElement) => {
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
    particle: ParticleData['kind'] = 'shard',
    shake = true,
  ) => {
    const { x, y } = targetCenter(targetEl)
    const id = seq.current++
    setParticles((old) => [...old, { id, x, y, color, kind: particle }])
    setSkillEffect({ id, x, y, kind: effect, direction, color })
    actionTimers.current.push(
      window.setTimeout(() => setParticles((old) => old.filter((item) => item.id !== id)), 700),
      window.setTimeout(() => setSkillEffect((current) => current?.id === id ? null : current), 720),
    )
    if (shake && battlefieldRef.current) {
      playCameraShake(battlefieldRef.current, { direction, intensity: 0.95, originX: x, originY: y })
    }
  }, [targetCenter])

  const showFloater = (target: number | 'hero', text: string, color: string) => {
    const floater = { id: seq.current++, target, text, color }
    setFloaters((old) => [...old, floater])
    actionTimers.current.push(
      window.setTimeout(() => setFloaters((old) => old.filter((item) => item.id !== floater.id)), 950),
    )
  }

  const addFloaters = (prev: TutorialState, next: TutorialState, markEnemyHits = true) => {
    const fs: Floater[] = []
    for (const p of prev.enemies) {
      const e = next.enemies.find((x) => x.uid === p.uid)
      const damage = next.lastHit?.uid === p.uid ? next.lastHit.damage : e ? p.hp - e.hp : p.hp
      if (damage > 0) fs.push({ id: seq.current++, target: p.uid, text: `-${damage}`, color: '#E9C46A' })
    }
    if (next.hp < prev.hp) fs.push({ id: seq.current++, target: 'hero', text: `-${prev.hp - next.hp}`, color: '#E06A5A' })
    if (prev.yutu === 'safe' && next.yutu === 'lost')
      fs.push({ id: seq.current++, target: 'hero', text: '副本被夺！', color: '#E06A5A' })
    if (fs.length > 0) {
      setFloaters((old) => [...old, ...fs])
      const ids = fs.map((f) => f.id)
      actionTimers.current.push(window.setTimeout(() => setFloaters((old) => old.filter((f) => !ids.includes(f.id))), 950))
    }
    const hit = prev.enemies.filter((p) => {
      const e = next.enemies.find((x) => x.uid === p.uid)
      return !e || e.hp < p.hp
    })
    if (markEnemyHits && hit.length > 0) {
      setHitUids(hit.map((enemy) => enemy.uid))
      actionTimers.current.push(window.setTimeout(() => setHitUids([]), 300))
    }
  }

  const SFX: Record<TAction, 'hit' | 'interrupt' | 'rescue' | 'hold'> = {
    tuji: 'hit',
    daduan: 'interrupt',
    mengjia: 'rescue',
    cart: 'hold',
  }

  const act = (a: TAction, uid?: number) => {
    if (isAnimating) return
    const next = applyTutorialAction(battle, a, uid)
    if (next === battle) return
    const attack = a === 'tuji' || a === 'daduan'
    const runId = ++actionRun.current
    setActingKind(attack ? 'attack' : 'support')
    setImpactTarget(attack ? null : 'hero')
    setIsAnimating(true)
    setPending(null)
    actionTimers.current.forEach((timer) => window.clearTimeout(timer))
    actionTimers.current = []
    setFloaters([])
    setHitUids([])
    setParticles([])
    setSkillEffect(null)
    setSpeedLines({ active: false, direction: 'ltr' })

    const heroEl = heroEls.current.get('hero')
    const targetEl = uid != null ? enemyEls.current.get(uid) : null

    if (attack && heroEl && targetEl) {
      const targetBefore = battle.enemies.find((enemy) => enemy.uid === uid)
      const targetAfter = next.enemies.find((enemy) => enemy.uid === uid)
      const lethal = Boolean(targetBefore && !targetAfter)
      const effect: SkillEffectKind = a === 'tuji' ? 'thrust' : 'break'
      const color = a === 'tuji' ? '#F4D47A' : '#D9A36A'
      const runAttack = async () => {
        let reaction: Promise<void> = Promise.resolve()
        await playStrikeAnimation(heroEl, targetEl, a === 'tuji' ? 'tuji' : 'daduan', {
          onImpact: () => {
            if (actionRun.current !== runId) return
            playSfx(SFX[a])
            addFloaters(battle, next, false)
            spawnImpact(targetEl, effect, color, 'ltr')
            if (a === 'tuji') {
              setSpeedLines({ active: true, direction: 'ltr' })
              actionTimers.current.push(
                window.setTimeout(() => setSpeedLines((current) => ({ ...current, active: false })), 250),
              )
            }
          },
          onHitStopEnd: () => {
            reaction = playHitReaction(targetEl, 'ltr', { lethal, intensity: a === 'tuji' ? 1.15 : 0.82 })
          },
        })
        await reaction
        if (actionRun.current !== runId) return
        setBattle(next)
        setActingKind(null)
        setImpactTarget(null)
        setIsAnimating(false)
      }
      void runAttack().catch(() => {
        if (actionRun.current !== runId) return
        setBattle(next)
        setActingKind(null)
        setImpactTarget(null)
        setIsAnimating(false)
      })
      return
    }

    if (heroEl) {
      const effect: SkillEffectKind = a === 'mengjia' ? 'guard' : 'winch'
      const color = a === 'mengjia' ? '#C4A484' : '#D2AC63'
      actionTimers.current.push(
        window.setTimeout(() => {
          if (actionRun.current !== runId) return
          playSfx(SFX[a])
          addFloaters(battle, next)
          spawnImpact(heroEl, effect, color, 'ltr', a === 'mengjia' ? 'spark' : 'shard', false)
        }, 260),
      )
      void playCastAnimation(heroEl).then(() => {
        if (actionRun.current !== runId) return
        setBattle(next)
        setActingKind(null)
        setImpactTarget(null)
        setIsAnimating(false)
      })
      return
    }

    setBattle(next)
    setActingKind(null)
    setImpactTarget(null)
    setIsAnimating(false)
  }

  const endTurn = () => {
    if (isAnimating) return
    const next = endTutorialTurn(battle)
    const runId = ++actionRun.current
    actionTimers.current.forEach((timer) => window.clearTimeout(timer))
    actionTimers.current = []
    setFloaters([])
    setHitUids([])
    setParticles([])
    setSkillEffect(null)
    setSpeedLines({ active: false, direction: 'rtl' })
    setPending(null)
    setIsAnimating(true)

    const runEnemySequence = async () => {
      const heroEl = heroEls.current.get('hero')
      let remainingHp = battle.hp
      for (const enemy of battle.enemies) {
        if (actionRun.current !== runId) return
        const enemyEl = enemyEls.current.get(enemy.uid)
        setActingEnemy(enemy.uid)

        if (enemy.intent.type === 'attack' && enemy.intent.dmg > 0 && enemyEl && heroEl) {
          const lethal = remainingHp > 0 && remainingHp - enemy.intent.dmg <= 0
          let reaction: Promise<void> = Promise.resolve()
          await playStrikeAnimation(enemyEl, heroEl, 'enemy', {
            onImpact: () => {
              if (actionRun.current !== runId) return
              playSfx('hurt')
              showFloater('hero', `-${enemy.intent.dmg}`, '#E06A5A')
              spawnImpact(heroEl, 'enemy-slash', '#E06A5A', 'rtl', 'spark', true)
              setSpeedLines({ active: true, direction: 'rtl' })
              actionTimers.current.push(
                window.setTimeout(() => setSpeedLines((current) => ({ ...current, active: false })), 250),
              )
            },
            onHitStopEnd: () => {
              reaction = playHitReaction(heroEl, 'rtl', { lethal, intensity: lethal ? 1.22 : 0.9 })
            },
          })
          await reaction
          remainingHp = Math.max(0, remainingHp - enemy.intent.dmg)
          if (remainingHp <= 0) break
        } else if (enemy.intent.type === 'steal' && battle.yutu === 'safe' && enemyEl && heroEl) {
          await playStrikeAnimation(enemyEl, heroEl, 'anqi', {
            onImpact: () => {
              if (actionRun.current !== runId) return
              playSfx('steal')
              showFloater('hero', '明卷被夺！', '#E06A5A')
              spawnImpact(heroEl, 'hidden-weapon', '#8FC8D8', 'rtl', 'shard', false)
            },
          })
        } else {
          showFloater(enemy.uid, '踉跄', '#C4A484')
          await new Promise<void>((resolve) => window.setTimeout(resolve, 260))
        }
        setActingEnemy(null)
      }

      if (actionRun.current !== runId) return
      if (next.phase === 'done' && battle.phase !== 'done') playSfx('fall')
      setBattle(next)
      setActingEnemy(null)
      setIsAnimating(false)
    }

    void runEnemySequence().catch(() => {
      if (actionRun.current !== runId) return
      setBattle(next)
      setActingEnemy(null)
      setIsAnimating(false)
    })
  }

  const pick = (a: TAction) => {
    if (isAnimating) return
    playSfx('select')
    if (T_ACTIONS[a].target === 'none') act(a)
    else setPending(a)
  }

  const objectives = [
    {
      icon: MapIcon,
      name: '护住明卷',
      state: battle.yutu === 'safe' ? '明卷尚在囊中' : '明卷被夺',
      ok: battle.yutu === 'safe',
      progress: null as number | null,
    },
    {
      icon: UserRound,
      name: '救出孟甲',
      state: battle.mengjia >= RESCUE_COST ? '已救出' : `${battle.mengjia}/${RESCUE_COST}`,
      ok: battle.mengjia >= RESCUE_COST,
      progress: battle.mengjia / RESCUE_COST,
    },
    {
      icon: Shield,
      name: '守住谷口退路',
      state: battle.cart >= CART_COST ? '退路已守住' : `${battle.cart}/${CART_COST}`,
      ok: battle.cart >= CART_COST,
      progress: battle.cart / CART_COST,
    },
  ]

  const actionIcons: Record<TAction, typeof Swords> = { tuji: Swords, daduan: Hand, mengjia: UserRound, cart: Shield }

  const heroViews: BattlefieldHero[] = [
    {
      id: 'hero',
      name: '北芒',
      sprite: HERO_SPRITE,
      hp: battle.hp,
      maxHp: battle.maxHp,
      color: '#B58A3D',
      present: true,
      active: battle.ap > 0 && battle.phase === 'player' && !isAnimating,
      down: battle.phase === 'lost',
      status: battle.phase === 'lost' ? '倒地' : battle.ap > 0 ? `剩余 ${battle.ap} 行动点` : '等待回合结束',
      scale: 1.45,
    },
  ]
  const enemyViews: BattlefieldEnemy[] = battle.enemies.map((enemy) => ({
    uid: enemy.uid,
    name: enemy.name,
    sprite: ENEMY_SPRITE,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    intent: enemy.intent.label || '意图不明',
    danger: enemy.intent.type === 'steal',
    variant: enemy.kind === 'qiang' ? 'thief' : 'normal',
  }))

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[#14161c] text-qin-parchment">
      <img
        src="./assets/bg_zhengdi_yuye.webp"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.style.display = 'none'
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[#101218ad]" />

      <header className="relative z-10 flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-qin-bronze-25 py-2 pl-4 pr-16">
        <span className="text-sm tracking-[0.2em] text-qin-bronze">序章 · 郑地山道 · 雨夜</span>
        <span className="text-sm text-qin-parchment-65">
          第 {battle.round} / {MAX_ROUNDS} 回合
        </span>
        <span className="flex items-center gap-1 text-sm">
          <Hourglass className="h-4 w-4 text-qin-bronze" />
          行动点
          {Array.from({ length: AP_PER_ROUND }).map((_, i) => (
            <span key={i} className={`h-3 w-3 rotate-45 border ${i < battle.ap ? 'border-qin-bronze bg-qin-bronze' : 'border-qin-parchment-25'} transition-colors`} />
          ))}
        </span>
        <span className="ml-auto text-xs text-[#C4746A]">三项不可全成</span>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
          {/* 三项目标 */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2">
            {objectives.map((o) => (
              <div
                key={o.name}
                className={`border bg-[#1a1d24] px-3 py-2 transition-colors ${o.ok ? 'border-qin-bronze-50' : o.progress === null && !o.ok ? 'border-[#C4746A88]' : 'border-qin-parchment-10'}`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <o.icon className={`h-4 w-4 ${o.ok ? 'text-qin-bronze' : 'text-qin-parchment-50'}`} />
                  {o.name}
                </div>
                <div className={`mt-0.5 text-xs ${o.ok ? 'text-qin-bronze' : 'text-qin-parchment-50'}`}>{o.state}</div>
                {o.progress !== null && (
                  <div className="mt-1 h-1 bg-[#00000055]">
                    <div className="h-full bg-qin-bronze transition-all" style={{ width: `${o.progress * 100}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <CinematicBattlefield
            roundLabel={`第 ${battle.round} / ${MAX_ROUNDS} 回合`}
            turnLabel={battle.phase === 'lost' ? '北芒倒下' : actingEnemy != null ? '敌方进攻' : isAnimating ? '招式演出' : battle.ap > 0 ? `剩余 ${battle.ap} 行动点` : '准备结束回合'}
            enemyLabel="灭口伏兵"
            heroes={heroViews}
            enemies={enemyViews}
            targetMode={!isAnimating && (pending === 'tuji' || pending === 'daduan') ? 'enemy' : null}
            actingHero={isAnimating && actingEnemy == null && actingKind != null ? 'hero' : null}
            actingEnemy={actingEnemy}
            actingKind={actingKind}
            impactTarget={impactTarget}
            hitEnemyIds={hitUids}
            floaters={floaters}
            particles={particles}
            speedLines={speedLines}
            skillEffect={skillEffect}
            weather="rain"
            containerRef={battlefieldRef}
            registerHeroRef={registerHeroRef}
            registerEnemyRef={registerEnemyRef}
            onEnemyClick={(uid) => {
              if (pending) act(pending, uid)
            }}
            onHeroClick={() => undefined}
          />

          {/* 行动面板 */}
          <div className="battle-command sticky bottom-0 z-20 border border-qin-bronze-50 p-2.5 sm:p-3">
            {battle.phase === 'lost' ? (
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <div className="text-lg leading-8 text-[#C4746A]">北芒倒下。伏兵越过谷口，任务失败。</div>
                  <div className="mt-2 text-sm text-qin-parchment-50">留意敌方公开意图；该打断时若强攻，可能被围杀。</div>
                </div>
                <button onClick={onRetry} className="bg-qin-cinnabar px-6 py-3 tracking-[0.2em] transition-colors hover:bg-qin-cinnabar-hover">
                  重整旗鼓，再试一次
                </button>
              </div>
            ) : battle.phase === 'done' ? (
              <div className="flex items-end justify-between gap-5 flex-wrap">
                <div className="max-w-3xl text-lg leading-8">
                  伏兵主力压上坡口。雨幕里，一道剑光正从山坡上杀下来——
                  <div className="mt-3 grid gap-1 text-sm text-qin-parchment-65 sm:grid-cols-3">
                    <span>{battle.yutu === 'safe' ? '明卷保住' : '明卷被夺；暗层未明'}</span>
                    <span>{battle.mengjia >= RESCUE_COST ? '孟甲已被北芒救出' : '孟甲仍困在辎重旁'}</span>
                    <span>{battle.cart >= CART_COST ? '谷口退路守住' : '谷口失守，旧部四散'}</span>
                  </div>
                  <div className="text-sm text-qin-parchment-50 mt-2">绝境还没有解开。那个本该离开的人，到了。</div>
                </div>
                <button onClick={() => onFinish(battle)} className="px-6 py-3 bg-qin-cinnabar hover:bg-qin-cinnabar-hover transition-colors tracking-[0.2em]">
                  迎战
                </button>
              </div>
            ) : (
              <div>
                <div className="text-sm text-qin-bronze mb-3">
                  {isAnimating
                    ? '招式演出中'
                    : pending
                      ? `选择「${T_ACTIONS[pending].name}」的目标（点击伏兵）`
                      : battle.ap > 0
                        ? '北芒待命'
                        : '行动点已用尽'}
                  {pending && !isAnimating && (
                    <button className="ml-4 text-qin-parchment-50 underline text-xs" onClick={() => setPending(null)}>
                      取消
                    </button>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:gap-3">
                  {(Object.keys(T_ACTIONS) as TAction[]).map((a) => {
                    const def = T_ACTIONS[a]
                    const Icon = actionIcons[a]
                    const disabled =
                      isAnimating ||
                      battle.ap <= 0 ||
                      (a === 'mengjia' && battle.mengjia >= RESCUE_COST) ||
                      (a === 'cart' && battle.cart >= CART_COST)
                    return (
                      <button
                        key={a}
                        disabled={disabled}
                        onClick={() => pick(a)}
                        className={`battle-command__action flex min-w-[8.5rem] items-start gap-2 border px-3 py-2.5 text-left transition-colors sm:min-w-0 sm:px-4 sm:py-3 ${
                          pending === a
                            ? 'border-qin-bronze bg-qin-bronze-15'
                            : disabled
                              ? 'border-qin-parchment-10 opacity-40'
                              : 'border-qin-parchment-10 hover:border-qin-bronze hover:bg-qin-cinnabar-15'
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
                  <button
                    disabled={isAnimating}
                    onClick={endTurn}
                    className="battle-command__action ml-auto flex min-w-[8.5rem] items-center justify-center gap-2 border border-[#C4746A88] px-5 py-3 text-[#C4746A] transition-colors hover:bg-qin-cinnabar-15 disabled:opacity-40"
                  >
                    <Cog className="w-4 h-4" />
                    结束回合
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 战斗记录 */}
        <details className="battle-log-mobile mx-3 mb-4 border border-qin-bronze-25 bg-[#12141ae8] lg:hidden">
          <summary className="cursor-pointer px-4 py-3 text-sm text-qin-bronze">
            战况纪要
            <span className="ml-3 text-xs text-qin-parchment-65">{battle.log[battle.log.length - 1]}</span>
          </summary>
          <div className="max-h-44 overflow-y-auto border-t border-qin-bronze-15 px-4 py-3">
            {battle.log.slice(-6).map((l, i) => (
              <div key={i} className="text-sm leading-6 text-qin-parchment-65">
                {l}
              </div>
            ))}
          </div>
        </details>
        <aside className="hidden border-t border-qin-bronze-25 bg-[#12141ae8] lg:flex lg:max-h-none lg:flex-col lg:border-l lg:border-t-0">
          <div className="px-4 py-2 text-xs tracking-widest text-qin-bronze border-b border-qin-bronze-15">战斗记录</div>
          <div ref={battleLogRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
            {battle.log.map((l, i) => (
              <div key={i} className={`text-sm leading-6 ${i === battle.log.length - 1 ? 'text-qin-parchment' : 'text-qin-parchment-65'}`}>
                {l}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
