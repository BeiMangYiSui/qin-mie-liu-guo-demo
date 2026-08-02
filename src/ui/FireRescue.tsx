import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Clock3, Flame, ScrollText, X } from 'lucide-react'
import type { SavedRegisterId, StoryFlags } from '../game/save'
import {
  FIRE_TEXT,
  REGISTER_PILES,
  burnedRegisters,
  createFireThreatSchedule,
  resolveFireRescueStep,
} from './fireRescueData'

export interface FireRescueProps {
  durationSeconds?: number
  maxSaved?: number
  onFlagsChange: (patch: Pick<StoryFlags, 'c7_saved_registers'>) => void
  onComplete?: (saved: SavedRegisterId[]) => void
}

export default function FireRescue({
  durationSeconds = 18,
  maxSaved = 3,
  onFlagsChange,
  onComplete,
}: FireRescueProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds)
  const [saved, setSaved] = useState<SavedRegisterId[]>([])
  const [burned, setBurned] = useState<SavedRegisterId[]>([])
  const [lastPile, setLastPile] = useState<SavedRegisterId | null>(null)
  const [lastCost, setLastCost] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [schedule] = useState(() => createFireThreatSchedule(durationSeconds))
  const savedRef = useRef<SavedRegisterId[]>([])
  const completedRef = useRef(false)

  useEffect(() => {
    savedRef.current = saved
  }, [saved])

  const finish = useCallback((result: SavedRegisterId[]) => {
    if (completedRef.current) return
    completedRef.current = true
    setCompleted(true)
    const finalResult = [...result].slice(0, maxSaved)
    onFlagsChange({ c7_saved_registers: finalResult })
    onComplete?.(finalResult)
  }, [maxSaved, onComplete, onFlagsChange])

  useEffect(() => {
    if (completed) return
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          queueMicrotask(() => finish(savedRef.current))
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [completed, finish])

  useEffect(() => {
    if (completed) return
    const nextBurned = [...new Set([...burned, ...burnedRegisters(schedule, secondsLeft, savedRef.current)])]
    if (nextBurned.length !== burned.length) setBurned(nextBurned)
    if (nextBurned.length + savedRef.current.length >= REGISTER_PILES.length) {
      queueMicrotask(() => finish(savedRef.current))
    }
  }, [burned, completed, finish, schedule, secondsLeft])

  const rescue = (id: SavedRegisterId) => {
    if (completed) return
    const step = resolveFireRescueStep({
      saved: savedRef.current,
      burned,
      secondsLeft,
      lastPile,
      schedule,
      id,
      maxSaved,
    })
    if (!step.rescued) return
    savedRef.current = step.saved
    setSaved(step.saved)
    setBurned(step.burned)
    setSecondsLeft(step.secondsLeft)
    setLastPile(step.lastPile)
    setLastCost(step.cost)
    if (step.saved.length >= maxSaved || step.saved.length + step.burned.length >= REGISTER_PILES.length) {
      finish(step.saved)
    }
  }

  const heat = Math.max(0, Math.min(100, (1 - secondsLeft / durationSeconds) * 100))

  return (
    <section
      className="relative mx-auto w-full max-w-5xl overflow-hidden border border-[#C4746A]/45 bg-[#171316]/95 p-5 text-qin-parchment shadow-2xl sm:p-8"
      aria-labelledby="fire-rescue-title"
      data-scene-id="c7_fire"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(196,116,106,0.22),transparent_58%)]" />
      <header className="relative">
        <p className="text-[0.65rem] tracking-[0.45em] text-[#C98B7E]/75">C7 · 官署火场</p>
        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h2 id="fire-rescue-title" className="flex items-center gap-3 text-3xl tracking-[0.25em]">
              <Flame className="size-7 text-[#C4746A]" aria-hidden="true" />
              抢救简册
            </h2>
            <p className="mt-3 text-sm leading-7 text-qin-parchment-50">{FIRE_TEXT.instruction}</p>
          </div>
          <div className="min-w-44 border border-[#C4746A]/35 bg-black/20 px-4 py-3 text-right">
            <span className="block text-xs tracking-[0.2em] text-qin-parchment-25">剩余火势</span>
            <strong className="mt-1 block text-2xl tabular-nums text-[#C98B7E]">
              {completed ? '撤离' : `${secondsLeft}s`}
            </strong>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden border border-[#C4746A]/30 bg-black/25" aria-label={`火势 ${Math.round(heat)}%`}>
          <div
            className="h-full bg-gradient-to-r from-qin-cinnabar to-[#C4746A] transition-[width] duration-700"
            style={{ width: `${heat}%` }}
          />
        </div>
      </header>

      <div className="relative mt-5 grid grid-cols-2 gap-2 sm:mt-7 sm:gap-3 lg:grid-cols-5">
        {REGISTER_PILES.map((pile) => {
          const isSaved = saved.includes(pile.id)
          const isBurned = burned.includes(pile.id)
          const threat = schedule.find((item) => item.id === pile.id)
          const burnsIn = Math.max(0, secondsLeft - (threat?.burnsAt ?? 0))
          const shelfDistance = lastPile == null
            ? 0
            : Math.abs(
                REGISTER_PILES.findIndex((item) => item.id === lastPile)
                - REGISTER_PILES.findIndex((item) => item.id === pile.id),
              )
          const actionCost = pile.rescueSeconds + (shelfDistance >= 2 ? 1 : 0)
          const disabled = completed || isSaved || isBurned || saved.length >= maxSaved
          return (
            <button
              key={pile.id}
              type="button"
              disabled={disabled}
              onClick={() => rescue(pile.id)}
              className={`min-h-40 border p-3 text-left transition-all sm:min-h-48 sm:p-4 ${
                isSaved
                  ? 'border-qin-bronze-50 bg-qin-bronze-10'
                  : isBurned
                    ? 'cursor-not-allowed border-qin-cinnabar/45 bg-[#241415] opacity-45'
                  : disabled
                    ? 'cursor-not-allowed border-qin-parchment-10 bg-black/15 opacity-35'
                    : burnsIn <= actionCost
                      ? 'border-[#E06A5A]/75 bg-[#32191a] shadow-[inset_0_0_24px_rgba(224,106,90,.12)] hover:-translate-y-1'
                      : 'border-[#C4746A]/30 bg-[#24191a] hover:-translate-y-1 hover:border-[#C4746A]/70'
              }`}
            >
              <span className="flex items-center justify-between">
                <ScrollText className="size-5 text-qin-bronze-light" aria-hidden="true" />
                {isSaved && <Check className="size-4 text-qin-bronze-light" aria-hidden="true" />}
                {isBurned && <X className="size-4 text-[#C4746A]" aria-hidden="true" />}
              </span>
              <span className="mt-4 block text-lg tracking-[0.18em] sm:mt-8 sm:text-xl">{pile.label}</span>
              <span className="mt-2 block text-xs tracking-[0.12em] text-qin-parchment-40">{pile.subtitle}</span>
              <span className="mt-3 block border-t border-qin-parchment-10 pt-3 text-xs leading-5 text-qin-parchment-25 sm:mt-5 sm:pt-4 sm:leading-6">
                {isSaved ? '已抢出' : isBurned ? '已焚毁' : pile.placeholder}
              </span>
              {!isSaved && !isBurned && (
                <span className={`mt-3 flex items-center justify-between text-[0.68rem] ${burnsIn <= actionCost ? 'text-[#F0A293]' : 'text-qin-parchment-40'}`}>
                  <span className="flex items-center gap-1"><Flame className="size-3" />{burnsIn}s 后烧到</span>
                  <span className="flex items-center gap-1"><Clock3 className="size-3" />耗 {actionCost}s</span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="relative mt-6 flex flex-col justify-between gap-3 border-t border-[#C4746A]/20 pt-5 text-sm sm:flex-row sm:items-center">
        <span className="text-qin-parchment-50">
          已抢出 {saved.length} / {maxSaved} 册 · 已焚 {burned.length} 册
          {lastCost > 0 ? ` · 上次耗时 ${lastCost}s` : ''}
        </span>
        <span className={completed ? 'text-qin-bronze-light' : 'text-qin-parchment-25'} aria-live="polite">
          {completed ? FIRE_TEXT.withdraw : '火路每局重排，抢满三册强制撤离'}
        </span>
      </div>
    </section>
  )
}
