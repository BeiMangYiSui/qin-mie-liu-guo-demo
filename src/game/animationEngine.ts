// 战斗程序化动画引擎 — Web Animations API 驱动
// 位移由敌我双方实际 DOM 坐标计算；HUD 留在原位，只移动角色立绘。

export type StrikePhase = 'idle' | 'anticipation' | 'strike' | 'impact' | 'recover'
export type HitPhase = 'idle' | 'knockback' | 'down' | 'return'
export type StrikeStyle = 'tuji' | 'jiejian' | 'daduan' | 'zhidu' | 'anqi' | 'enemy' | 'crossbow' | 'mounted'
export type StrikeDirection = 'ltr' | 'rtl'

export interface StrikeAnimCallbacks {
  onPhase?: (phase: StrikePhase) => void
  /** 接触帧触发；随后保持 90ms hit-stop。 */
  onImpact?: () => void
  /** hit-stop 结束后触发，适合启动受击动作。 */
  onHitStopEnd?: () => void
}

export interface HitReactionOptions {
  intensity?: number
  lethal?: boolean
  onPhase?: (phase: HitPhase) => void
}

export interface StrikeGeometry {
  direction: StrikeDirection
  distance: number
  actorCenterX: number
  targetCenterX: number
}

export interface CameraShakeOptions {
  intensity?: number
  direction?: StrikeDirection
  originX?: number
  originY?: number
}

const HIT_STOP_MS = 90

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

function duration(ms: number): number {
  return prefersReducedMotion() ? 1 : ms
}

function actorFigure(el: HTMLElement): HTMLElement {
  return el.querySelector<HTMLElement>('.cinematic-actor__figure') ?? el
}

function waitAnim(el: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions): Animation {
  return el.animate(keyframes, { fill: 'forwards', ...options })
}

async function finishAndCancel(anim: Animation): Promise<void> {
  await anim.finished.then(() => undefined).catch(() => undefined)
  anim.cancel()
}

/** 按双方立绘的真实位置与宽度，计算接敌方向和需要跨越的像素距离。 */
export function measureStrikeGeometry(actorEl: HTMLElement, targetEl: HTMLElement): StrikeGeometry {
  const actorRect = actorFigure(actorEl).getBoundingClientRect()
  const targetRect = actorFigure(targetEl).getBoundingClientRect()
  const actorCenterX = actorRect.left + actorRect.width / 2
  const targetCenterX = targetRect.left + targetRect.width / 2
  const direction: StrikeDirection = targetCenterX >= actorCenterX ? 'ltr' : 'rtl'
  const sign = direction === 'ltr' ? 1 : -1
  // 两张立绘各保留约 22% 宽度作为近身接触距离，防止中心完全重叠。
  const contactGap = Math.max(18, (actorRect.width + targetRect.width) * 0.22)
  const centerDistance = Math.abs(targetCenterX - actorCenterX)
  return {
    direction,
    distance: sign * Math.max(0, centerDistance - contactGap),
    actorCenterX,
    targetCenterX,
  }
}

type StrikeProfile = {
  reach: number
  windupX: number
  windupY: number
  contactY: number
  overshoot: number
  anticipationMs: number
  strikeMs: number
  recoverMs: number
  contactRotate: number
}

const STRIKE_PROFILES: Record<StrikeStyle, StrikeProfile> = {
  // 突击：深蓄力、贴身贯穿、长距离直线冲锋。
  tuji: { reach: 1, windupX: 16, windupY: 2, contactY: -2, overshoot: 7, anticipationMs: 135, strikeMs: 175, recoverMs: 310, contactRotate: -2 },
  // 截剑：斜向上步切入，不完全贴身，挥剑弧线更明显。
  jiejian: { reach: 0.86, windupX: 7, windupY: 5, contactY: -14, overshoot: 2, anticipationMs: 105, strikeMs: 215, recoverMs: 285, contactRotate: -8 },
  // 打断：短促压步后猛撞，位移短、下盘更低、回弹更硬。
  daduan: { reach: 0.68, windupX: 5, windupY: -3, contactY: 7, overshoot: 11, anticipationMs: 80, strikeMs: 130, recoverMs: 235, contactRotate: 5 },
  // 掷毒：只前探少量距离，主要靠抛掷动作完成攻击。
  zhidu: { reach: 0.24, windupX: 8, windupY: 5, contactY: -8, overshoot: 0, anticipationMs: 150, strikeMs: 220, recoverMs: 260, contactRotate: -5 },
  // 暗器：压腕后快速扬手，人物只做极短前探，飞行距离由特效承担。
  anqi: { reach: 0.12, windupX: 5, windupY: 3, contactY: -10, overshoot: 0, anticipationMs: 95, strikeMs: 125, recoverMs: 190, contactRotate: -7 },
  // 弩击：人物留在原地举弩，飞行距离完全交给弩矢特效。
  crossbow: { reach: 0.04, windupX: 3, windupY: 5, contactY: -9, overshoot: 0, anticipationMs: 190, strikeMs: 90, recoverMs: 210, contactRotate: -2 },
  // 骑影冲杀：更深、更快的贯穿位移，回位带明显惯性。
  mounted: { reach: 1.06, windupX: 22, windupY: 3, contactY: -4, overshoot: 14, anticipationMs: 115, strikeMs: 145, recoverMs: 360, contactRotate: 4 },
  enemy: { reach: 0.94, windupX: 10, windupY: 2, contactY: -3, overshoot: 4, anticipationMs: 110, strikeMs: 185, recoverMs: 290, contactRotate: 3 },
}

/** 多阶段攻击：蓄力 → 按真实坐标接敌 → 90ms 命中冻结 → 回位。 */
export async function playStrikeAnimation(
  actorEl: HTMLElement,
  targetEl: HTMLElement,
  style: StrikeStyle,
  callbacks?: StrikeAnimCallbacks,
): Promise<void> {
  const figure = actorFigure(actorEl)
  const geometry = measureStrikeGeometry(actorEl, targetEl)
  const profile = STRIKE_PROFILES[style]
  const sign = geometry.direction === 'ltr' ? 1 : -1
  const travel = geometry.distance * profile.reach
  const contactX = travel + sign * profile.overshoot
  const windupX = -sign * profile.windupX

  callbacks?.onPhase?.('anticipation')
  const anticipation = waitAnim(
    figure,
    [
      { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)', filter: 'brightness(1)' },
      {
        transform: `translate3d(${windupX}px, ${profile.windupY}px, 0) rotate(${-sign * profile.contactRotate * 0.35}deg) scaleX(0.93) scaleY(1.055)`,
        filter: 'brightness(0.88)',
      },
    ],
    { duration: duration(profile.anticipationMs), easing: 'ease-in' },
  )
  await finishAndCancel(anticipation)

  callbacks?.onPhase?.('strike')
  const strike = waitAnim(
    figure,
    style === 'jiejian'
      ? [
          { transform: `translate3d(${windupX}px, ${profile.windupY}px, 0) rotate(${sign * 3}deg) scale(0.96)` },
          { transform: `translate3d(${contactX * 0.55}px, ${profile.contactY - 8}px, 0) rotate(${-sign * 11}deg) scaleX(1.04) scaleY(0.96)`, offset: 0.52 },
          { transform: `translate3d(${contactX}px, ${profile.contactY}px, 0) rotate(${sign * profile.contactRotate}deg) scaleX(1.08) scaleY(0.93)`, filter: 'brightness(1.18)' },
        ]
      : style === 'daduan'
        ? [
            { transform: `translate3d(${windupX}px, ${profile.windupY}px, 0) rotate(${-sign * 2}deg) scaleX(0.9) scaleY(1.08)` },
            { transform: `translate3d(${contactX * 0.38}px, ${profile.contactY + 4}px, 0) rotate(${sign * 1}deg) scaleX(1.14) scaleY(0.87)`, offset: 0.42 },
            { transform: `translate3d(${contactX}px, ${profile.contactY}px, 0) rotate(${sign * profile.contactRotate}deg) scaleX(1.2) scaleY(0.82)`, filter: 'brightness(1.2)' },
          ]
        : style === 'zhidu' || style === 'anqi' || style === 'crossbow'
          ? [
              { transform: `translate3d(${windupX}px, ${profile.windupY}px, 0) rotate(${sign * 5}deg) scale(0.96)` },
              { transform: `translate3d(${contactX * 0.7}px, ${profile.contactY - 7}px, 0) rotate(${-sign * 8}deg) scale(1.04)`, offset: 0.58 },
              { transform: `translate3d(${contactX}px, ${profile.contactY}px, 0) rotate(${sign * profile.contactRotate}deg) scale(1.02)`, filter: 'brightness(1.14) saturate(1.2)' },
            ]
          : style === 'mounted'
            ? [
                { transform: `translate3d(${windupX}px, ${profile.windupY}px, 0) rotate(${-sign * 3}deg) scaleX(0.9) scaleY(1.06)` },
                { transform: `translate3d(${contactX * 0.72}px, ${profile.contactY - 4}px, 0) rotate(${sign * 2}deg) scaleX(1.19) scaleY(0.87)`, offset: 0.55 },
                { transform: `translate3d(${contactX}px, ${profile.contactY}px, 0) rotate(${sign * profile.contactRotate}deg) scaleX(1.14) scaleY(0.9)`, filter: 'brightness(1.2)' },
              ]
            : [
              { transform: `translate3d(${windupX}px, ${profile.windupY}px, 0) rotate(0deg) scaleX(0.93) scaleY(1.055)` },
              { transform: `translate3d(${contactX * 0.82}px, ${profile.contactY}px, 0) rotate(${sign * profile.contactRotate}deg) scaleX(1.14) scaleY(0.89)`, offset: 0.68 },
              { transform: `translate3d(${contactX}px, ${profile.contactY}px, 0) rotate(${sign * profile.contactRotate}deg) scaleX(1.07) scaleY(0.96)`, filter: 'brightness(1.18)' },
            ],
    { duration: duration(profile.strikeMs), easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  )
  await finishAndCancel(strike)

  // 接触姿势在冻结和受击启动期间保持不动。
  const hold = waitAnim(
    figure,
    [{ transform: `translate3d(${contactX}px, ${profile.contactY}px, 0) rotate(${sign * profile.contactRotate}deg) scaleX(1.07) scaleY(0.96)`, filter: 'brightness(1.18)' }],
    // hit-stop 是节奏反馈而非持续运动，减少动态效果时仍保留完整 90ms。
    { duration: HIT_STOP_MS },
  )
  callbacks?.onPhase?.('impact')
  callbacks?.onImpact?.()
  await finishAndCancel(hold)
  callbacks?.onHitStopEnd?.()

  callbacks?.onPhase?.('recover')
  const recover = waitAnim(
    figure,
    [
      { transform: `translate3d(${contactX}px, ${profile.contactY}px, 0) rotate(${sign * profile.contactRotate}deg) scaleX(1.07) scaleY(0.96)`, filter: 'brightness(1.18)' },
      { transform: `translate3d(${sign * 8}px, 2px, 0) rotate(${-sign * 2}deg) scaleX(0.98) scaleY(1.02)`, filter: 'brightness(1)', offset: style === 'daduan' ? 0.6 : 0.46 },
      { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)', filter: 'brightness(1)' },
    ],
    { duration: duration(profile.recoverMs), easing: style === 'daduan' ? 'cubic-bezier(0.2, 0.75, 0.35, 1)' : 'cubic-bezier(0.34, 1.35, 0.64, 1)' },
  )
  await finishAndCancel(recover)
  callbacks?.onPhase?.('idle')
}

/** 受击三段式：击退 → 倒地 → 回位；致命攻击停留在倒地姿态等待状态提交。 */
export async function playHitReaction(
  el: HTMLElement,
  direction: StrikeDirection,
  options: HitReactionOptions = {},
): Promise<void> {
  const figure = actorFigure(el)
  const sign = direction === 'ltr' ? 1 : -1
  const intensity = options.intensity ?? 1
  const knockback = sign * 18 * intensity

  options.onPhase?.('knockback')
  const knock = waitAnim(
    figure,
    [
      { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)', filter: 'brightness(1)' },
      { transform: 'translate3d(0, 0, 0) rotate(0deg) scaleX(1.2) scaleY(0.8)', filter: 'brightness(2.35) saturate(0.25)', offset: 0.25 },
      { transform: `translate3d(${knockback}px, 2px, 0) rotate(${sign * 4}deg) scaleX(0.88) scaleY(1.1)`, filter: 'brightness(0.72)' },
    ],
    { duration: duration(135), easing: 'cubic-bezier(0.18, 0.82, 0.3, 1)' },
  )
  await finishAndCancel(knock)

  options.onPhase?.('down')
  const downX = knockback + sign * 5 * intensity
  const downRotate = sign * 11 * intensity
  const down = waitAnim(
    figure,
    [
      { transform: `translate3d(${knockback}px, 2px, 0) rotate(${sign * 4}deg) scaleX(0.88) scaleY(1.1)`, filter: 'brightness(0.72)' },
      { transform: `translate3d(${downX}px, ${8 + 4 * intensity}px, 0) rotate(${downRotate}deg) scaleX(1.05) scaleY(0.9)`, filter: 'brightness(0.64) saturate(0.72)' },
    ],
    { duration: duration(options.lethal ? 210 : 145), easing: 'cubic-bezier(0.4, 0, 0.8, 0.65)' },
  )
  await down.finished.then(() => undefined).catch(() => undefined)

  if (options.lethal) {
    // fill:forwards 保持倒地；调用方紧接着提交状态并卸载目标。
    options.onPhase?.('idle')
    return
  }
  down.cancel()

  options.onPhase?.('return')
  const returnAnim = waitAnim(
    figure,
    [
      { transform: `translate3d(${downX}px, ${8 + 4 * intensity}px, 0) rotate(${downRotate}deg) scaleX(1.05) scaleY(0.9)`, filter: 'brightness(0.64) saturate(0.72)' },
      { transform: `translate3d(${sign * 6}px, -2px, 0) rotate(${-sign * 2}deg) scaleX(0.97) scaleY(1.04)`, filter: 'brightness(1)', offset: 0.55 },
      { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)', filter: 'brightness(1)' },
    ],
    { duration: duration(235), easing: 'cubic-bezier(0.25, 1.35, 0.5, 1)' },
  )
  await finishAndCancel(returnAnim)
  options.onPhase?.('idle')
}

/** 施法/治疗动画 — 下沉蓄力 → 上升释放。 */
export async function playCastAnimation(el: HTMLElement): Promise<void> {
  const figure = actorFigure(el)
  const anim = waitAnim(
    figure,
    [
      { transform: 'translateY(0) scale(1)', filter: 'brightness(1) drop-shadow(0 0 0 transparent)' },
      { transform: 'translateY(4px) scale(0.97)', filter: 'brightness(0.9)', offset: 0.25 },
      { transform: 'translateY(-6px) scale(1.03)', filter: 'brightness(1.25) drop-shadow(0 0 16px rgba(157,184,154,0.6))', offset: 0.55 },
      { transform: 'translateY(0) scale(1)', filter: 'brightness(1) drop-shadow(0 0 0 transparent)' },
    ],
    { duration: duration(620), easing: 'ease-in-out' },
  )
  await finishAndCancel(anim)
}

/** 镜头震动，以实际受击目标为震源，并按来刀方向偏移。 */
export function playCameraShake(container: HTMLElement, options: CameraShakeOptions = {}): void {
  const intensity = options.intensity ?? 1
  const sign = options.direction === 'rtl' ? -1 : 1
  container.style.transformOrigin = `${options.originX ?? 50}% ${options.originY ?? 50}%`
  const shake = container.animate(
    [
      { transform: 'translate(0, 0) scale(1)' },
      { transform: `translate(${-sign * 4 * intensity}px, ${2 * intensity}px) scale(1.008)`, offset: 0.2 },
      { transform: `translate(${sign * 3 * intensity}px, ${-1 * intensity}px) scale(1.005)`, offset: 0.5 },
      { transform: `translate(${-sign * 2 * intensity}px, 0) scale(1.002)`, offset: 0.75 },
      { transform: 'translate(0, 0) scale(1)' },
    ],
    { duration: duration(240), easing: 'linear' },
  )
  shake.onfinish = () => shake.cancel()
}
