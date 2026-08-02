import { type CSSProperties, type RefObject } from 'react'
import { Crosshair, Flame, ShieldAlert, Swords } from 'lucide-react'
import { ImpactParticles, SkillImpact, SpeedLines, type ParticleData, type SkillEffectData } from './BattleEffects'

export type BattlefieldFloat = {
  id: number
  target: number | string
  text: string
  color: string
}

export type BattlefieldHero = {
  id: string
  name: string
  sprite: string
  hp: number
  maxHp: number
  color: string
  present: boolean
  active: boolean
  down: boolean
  status: string
  scale?: number
  targetable?: boolean
}

export type BattlefieldEnemy = {
  uid: number
  name: string
  sprite: string
  hp: number
  maxHp: number
  intent: string
  intentType?: 'attack' | 'hidden' | 'burn'
  danger?: boolean
  variant?: 'normal' | 'leader' | 'arsonist' | 'thief'
}

export default function CinematicBattlefield({
  roundLabel,
  turnLabel,
  enemyLabel,
  heroes,
  enemies,
  targetMode,
  actingHero,
  actingEnemy,
  actingKind,
  impactTarget,
  enemyImpactHero,
  hitEnemyIds,
  floaters,
  smoke,
  particles,
  speedLines,
  skillEffect,
  weather = 'clear',
  containerRef,
  registerHeroRef,
  registerEnemyRef,
  onEnemyClick,
  onHeroClick,
}: {
  roundLabel: string
  turnLabel: string
  enemyLabel: string
  heroes: BattlefieldHero[]
  enemies: BattlefieldEnemy[]
  targetMode: 'enemy' | 'ally' | null
  actingHero: string | null
  actingEnemy?: number | null
  actingKind: 'attack' | 'support' | 'interact' | null
  impactTarget: number | string | null
  enemyImpactHero?: string | null
  hitEnemyIds: number[]
  floaters: BattlefieldFloat[]
  smoke?: boolean
  particles?: ParticleData[]
  speedLines?: { active: boolean; direction: 'ltr' | 'rtl' }
  skillEffect?: SkillEffectData | null
  weather?: 'clear' | 'rain'
  containerRef?: RefObject<HTMLElement | null>
  registerHeroRef?: (id: string, el: HTMLElement | null) => void
  registerEnemyRef?: (uid: number, el: HTMLElement | null) => void
  onEnemyClick: (uid: number) => void
  onHeroClick: (id: string) => void
}) {
  const presentHeroCount = Math.max(heroes.filter((hero) => hero.present).length, 1)
  const heroStyle = {
    '--formation-count': presentHeroCount,
  } as CSSProperties
  const enemyStyle = {
    '--formation-count': Math.max(enemies.length, 1),
  } as CSSProperties

  return (
    <section ref={containerRef as RefObject<HTMLElement>} className={`cinematic-battlefield ${smoke ? 'is-smoked' : ''}`}>
      <div className="cinematic-battlefield__vignette" />
      {weather === 'rain' && <div className="cinematic-battlefield__rain" />}
      {speedLines && <SpeedLines active={speedLines.active} direction={speedLines.direction} />}
      {particles && particles.length > 0 && <ImpactParticles particles={particles} />}
      <SkillImpact effect={skillEffect ?? null} />
      <div className="cinematic-battlefield__turn">
        <span>{roundLabel}</span>
        <strong>{turnLabel}</strong>
      </div>
      <div className="cinematic-battlefield__enemy-label">
        <Swords className="h-3.5 w-3.5" />
        {enemyLabel}
        <span>{enemies.length} 人</span>
      </div>

      <div className="cinematic-formation cinematic-formation--heroes" style={heroStyle}>
        {heroes.map((hero) => {
          const targeted = targetMode === 'ally' && hero.present && !hero.down && hero.targetable !== false
          const isActing = actingHero === hero.id
          const actorClass = isActing
            ? actingKind === 'attack'
              ? 'fx-stage-strike'
              : actingKind === 'interact'
                ? 'fx-stage-interact'
                : 'fx-stage-cast'
            : ''
          return (
            <button
              key={hero.id}
              type="button"
              ref={(el) => registerHeroRef?.(hero.id, el)}
              aria-label={`${hero.name}，${hero.status}，生命 ${hero.hp}/${hero.maxHp}`}
              disabled={!targeted}
              onClick={() => onHeroClick(hero.id)}
              className={`cinematic-actor cinematic-actor--hero ${hero.active ? 'is-active' : ''} ${
                targeted ? 'is-targetable' : ''
              } ${hero.down ? 'is-down' : ''} ${!hero.present ? 'is-absent' : ''} ${
                impactTarget === hero.id ? 'fx-stage-heal' : ''
              } ${enemyImpactHero === hero.id ? 'fx-stage-hero-hit' : ''} ${actorClass}`}
              style={
                {
                  '--actor-color': hero.color,
                  '--actor-scale': hero.scale ?? 1,
                  '--strike-distance': presentHeroCount === 1 ? '36vw' : '18vw',
                } as CSSProperties
              }
            >
              {hero.active && <span className="cinematic-actor__active-tag">行动</span>}
              <span className="cinematic-actor__figure">
                <img src={hero.sprite} alt="" draggable={false} />
              </span>
              <span className="cinematic-actor__shadow" />
              <span className="cinematic-actor__hud">
                <span className="cinematic-actor__name">
                  <b>{hero.name}</b>
                  <small>{hero.status}</small>
                </span>
                <span className="cinematic-actor__hp">
                  <span style={{ width: `${Math.max(0, (hero.hp / hero.maxHp) * 100)}%` }} />
                </span>
                <small>
                  {hero.hp} / {hero.maxHp}
                </small>
              </span>
              {floaters
                .filter((floater) => floater.target === hero.id)
                .map((floater) => (
                  <span key={floater.id} className="cinematic-floater" style={{ color: floater.color }}>
                    {floater.text}
                  </span>
                ))}
            </button>
          )
        })}
      </div>

      <div className="cinematic-formation cinematic-formation--enemies" style={enemyStyle}>
        {enemies.map((enemy) => {
          const targeted = targetMode === 'enemy'
          const hit = hitEnemyIds.includes(enemy.uid) || impactTarget === enemy.uid
          return (
            <button
              key={enemy.uid}
              type="button"
              ref={(el) => registerEnemyRef?.(enemy.uid, el)}
              aria-label={`${enemy.name}，${enemy.intent || '意图不明'}，生命 ${enemy.hp}/${enemy.maxHp}`}
              disabled={!targeted}
              onClick={() => onEnemyClick(enemy.uid)}
              className={`cinematic-actor cinematic-actor--enemy ${targeted ? 'is-targetable' : ''} ${
                enemy.danger ? 'is-danger' : ''
              } is-${enemy.variant ?? 'normal'} ${hit ? 'fx-stage-hit' : ''} ${
                actingEnemy === enemy.uid ? 'fx-stage-enemy-strike' : ''
              }`}
            >
              <span className="cinematic-actor__intent">
                {enemy.intentType === 'burn' ? (
                  <Flame className="h-3.5 w-3.5" />
                ) : enemy.intentType === 'hidden' ? (
                  <Crosshair className="h-3.5 w-3.5" />
                ) : (
                  <ShieldAlert className="h-3.5 w-3.5" />
                )}
                <span>{enemy.intent || '意图不明'}</span>
              </span>
              <span className="cinematic-actor__figure">
                <img src={enemy.sprite} alt="" draggable={false} />
              </span>
              <span className="cinematic-actor__shadow" />
              <span className="cinematic-actor__hud">
                <span className="cinematic-actor__name">
                  <b>{enemy.name}</b>
                </span>
                <span className="cinematic-actor__hp">
                  <span style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }} />
                </span>
              </span>
              {floaters
                .filter((floater) => floater.target === enemy.uid)
                .map((floater) => (
                  <span key={floater.id} className="cinematic-floater" style={{ color: floater.color }}>
                    {floater.text}
                  </span>
                ))}
            </button>
          )
        })}
      </div>

      {smoke && <div className="cinematic-smoke" />}
      <div className="cinematic-battlefield__ground" />
    </section>
  )
}
