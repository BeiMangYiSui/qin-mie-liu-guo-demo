// 战斗特效组件：命中粒子、速度线、斩击弧光
import { useEffect, useRef, type CSSProperties } from 'react'

export interface ParticleData {
  id: number
  x: number // 百分比 0-100
  y: number // 百分比 0-100
  color: string
  kind?: 'spark' | 'shard' | 'droplet'
}

export type SkillEffectKind =
  | 'thrust'
  | 'sword'
  | 'break'
  | 'poison'
  | 'needle'
  | 'enemy-slash'
  | 'hidden-weapon'
  | 'crossbow-bolt'
  | 'mounted-strike'
  | 'heal'
  | 'guard'
  | 'smoke'
  | 'winch'
  | 'fire'

export interface SkillEffectData {
  id: number
  x: number
  y: number
  kind: SkillEffectKind
  direction: 'ltr' | 'rtl'
  color: string
}

/** 命中粒子爆发 — 在目标位置生成方向性碎片 */
export function ImpactParticles({ particles }: { particles: ParticleData[] }) {
  return (
    <>
      {particles.map((p) => (
        <ParticleBurst key={p.id} x={p.x} y={p.y} color={p.color} kind={p.kind ?? 'spark'} />
      ))}
    </>
  )
}

function ParticleBurst({ x, y, color, kind }: { x: number; y: number; color: string; kind: NonNullable<ParticleData['kind']> }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const count = 10
    const frags: HTMLSpanElement[] = []
    for (let i = 0; i < count; i++) {
      const frag = document.createElement('span')
      frag.className = `battle-particle is-${kind}`
      frag.style.background = color
      frag.style.color = color
      container.appendChild(frag)
      frags.push(frag)

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
      const dist = (kind === 'droplet' ? 18 : 28) + Math.random() * (kind === 'droplet' ? 28 : 42)
      const dx = Math.cos(angle) * dist
      const dy = Math.sin(angle) * dist - 12 // 偏上
      const size = (kind === 'shard' ? 2 : 3) + Math.random() * (kind === 'shard' ? 3 : 4)

      frag.style.width = `${size}px`
      frag.style.height = `${size}px`

      const anim = frag.animate(
        [
          { transform: `translate(0, 0) scale(1) rotate(${kind === 'shard' ? 35 : 0}deg)`, opacity: 1 },
          { transform: `translate(${dx}px, ${kind === 'droplet' ? Math.abs(dy) + 8 : dy}px) scale(0.2) rotate(${Math.random() * 180}deg)`, opacity: 0 },
        ],
        { duration: 420 + Math.random() * 180, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)', fill: 'forwards' },
      )
      anim.onfinish = () => frag.remove()
    }
    return () => frags.forEach((f) => f.remove())
  }, [color, kind])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute z-30"
      style={{ left: `${x}%`, top: `${y}%`, width: 0, height: 0 }}
    />
  )
}

/** 每类武器/技能拥有独立轮廓；所有图形的原点都是目标立绘中心。 */
export function SkillImpact({ effect }: { effect: SkillEffectData | null }) {
  if (!effect) return null
  const sign = effect.direction === 'ltr' ? 1 : -1
  return (
    <div
      key={effect.id}
      className={`battle-skill-effect is-${effect.kind}`}
      style={{
        left: `${effect.x}%`,
        top: `${effect.y}%`,
        color: effect.color,
        '--effect-direction': sign,
      } as CSSProperties}
      aria-hidden="true"
    >
      {(effect.kind === 'sword' || effect.kind === 'enemy-slash') && (
        <svg viewBox="0 0 150 100" fill="none">
          <path className="battle-skill-effect__arc is-main" d="M12 88 Q72 8 140 24" />
          {effect.kind === 'sword' && <path className="battle-skill-effect__arc is-cross" d="M28 14 Q78 88 136 70" />}
        </svg>
      )}
      {(effect.kind === 'thrust' || effect.kind === 'needle' || effect.kind === 'hidden-weapon' || effect.kind === 'crossbow-bolt' || effect.kind === 'mounted-strike') && (
        <>
          <span className="battle-skill-effect__trail" />
          <span className="battle-skill-effect__point" />
        </>
      )}
      {effect.kind === 'break' && (
        <>
          <span className="battle-skill-effect__ring" />
          <span className="battle-skill-effect__ring is-second" />
          <span className="battle-skill-effect__crack" />
        </>
      )}
      {(effect.kind === 'poison' || effect.kind === 'smoke' || effect.kind === 'fire') && (
        <>
          <span className="battle-skill-effect__cloud is-one" />
          <span className="battle-skill-effect__cloud is-two" />
          <span className="battle-skill-effect__cloud is-three" />
        </>
      )}
      {effect.kind === 'heal' && (
        <>
          <span className="battle-skill-effect__heal-ring" />
          <span className="battle-skill-effect__heal-cross">十</span>
        </>
      )}
      {effect.kind === 'guard' && <span className="battle-skill-effect__shield" />}
      {effect.kind === 'winch' && (
        <>
          <span className="battle-skill-effect__gear">✣</span>
          <span className="battle-skill-effect__chain" />
        </>
      )}
    </div>
  )
}

/** 全屏速度线 — 攻击瞬间闪现 */
export function SpeedLines({ active, direction }: { active: boolean; direction: 'ltr' | 'rtl' }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || !ref.current) return
    const el = ref.current
    const anim = el.animate(
      [
        { opacity: 0, transform: `scaleX(${direction === 'ltr' ? 0.6 : -0.6}) scaleY(0.8)` },
        { opacity: 0.7, transform: 'scaleX(1) scaleY(1)', offset: 0.3 },
        { opacity: 0, transform: 'scaleX(1.1) scaleY(1.05)' },
      ],
      { duration: 200, easing: 'ease-out', fill: 'forwards' },
    )
    anim.onfinish = () => anim.cancel()
  }, [active, direction])

  if (!active) return null
  return <div ref={ref} className="battle-speed-lines" />
}

/** 斩击弧光 — 命中时在目标处划过一道弧线 */
