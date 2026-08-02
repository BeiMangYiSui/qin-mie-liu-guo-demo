import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Clock3, Flag, Footprints, MapPin, Waves, X } from 'lucide-react'
import { playSfx, playSfxFile, stopSfxFile, unlockSfxFile } from '../game/audio'
import type { StoryFlags } from '../game/save'
import {
  PURSUIT_ROUTES,
  createPursuitWaves,
  pursuitResultLabel,
  type PursuitRouteId,
} from './pursuitInterceptData'

const WAVE_SECONDS = 9
const TRACKING_SECONDS = 6

const ROUTE_ICONS: Record<PursuitRouteId, typeof MapPin> = {
  north: Flag,
  market: Footprints,
  canal: Waves,
}

interface WaveResult {
  correct: boolean
  text: string
  total: number
}

export default function PursuitIntercept({
  onFlagsChange,
  onFinish,
}: {
  onFlagsChange: (patch: Pick<StoryFlags, 'c7_troops_intercepted'>) => void
  onFinish: () => void
}) {
  const waves = useMemo(() => createPursuitWaves(), [])
  const [waveIndex, setWaveIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(WAVE_SECONDS)
  const [trackingLeft, setTrackingLeft] = useState(TRACKING_SECONDS)
  const [ready, setReady] = useState(false)
  const [intercepted, setIntercepted] = useState(0)
  const [result, setResult] = useState<WaveResult | null>(null)
  const [finished, setFinished] = useState(false)
  const resolvedRef = useRef(false)
  const audioRetriedRef = useRef(false)
  const completionReportedRef = useRef(false)
  const wave = waves[waveIndex]

  useEffect(() => {
    playSfxFile('sfx/city_siege.mp3', { loop: true, volume: 0.14, channel: 'environment' })
    return () => stopSfxFile('environment')
  }, [])

  const commit = useCallback((choice: PursuitRouteId | null) => {
    if (resolvedRef.current || !wave || !ready) return
    resolvedRef.current = true
    if (!audioRetriedRef.current) {
      audioRetriedRef.current = true
      unlockSfxFile('environment')
    }
    const correct = choice === wave.route
    const total = intercepted + (correct ? 1 : 0)
    setIntercepted(total)
    setResult({
      correct,
      total,
      text: correct
        ? `截中！伏兵在${PURSUIT_ROUTES.find((route) => route.id === wave.route)?.label}合围。`
        : choice == null
          ? `迟了一步。残兵从${PURSUIT_ROUTES.find((route) => route.id === wave.route)?.label}冲了出去。`
          : `判断失误。真正的逃路是${PURSUIT_ROUTES.find((route) => route.id === wave.route)?.label}。`,
    })
    playSfx(correct ? 'hold' : 'steal')
  }, [intercepted, ready, wave])

  useEffect(() => {
    if (finished || result || ready) return
    const timer = window.setInterval(() => {
      setTrackingLeft((current) => Math.max(0, current - 1))
    }, 1000)
    const reveal = window.setTimeout(() => {
      setReady(true)
      setSecondsLeft(WAVE_SECONDS)
    }, TRACKING_SECONDS * 1000)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(reveal)
    }
  }, [finished, ready, result, waveIndex])

  useEffect(() => {
    if (finished || result || !ready) return
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)
    const expiry = window.setTimeout(() => commit(null), WAVE_SECONDS * 1000)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(expiry)
    }
  }, [commit, finished, ready, result, waveIndex])

  useEffect(() => {
    if (!result) return
    const timer = window.setTimeout(() => {
      if (waveIndex >= waves.length - 1) {
        setFinished(true)
        if (!completionReportedRef.current) {
          completionReportedRef.current = true
          onFlagsChange({ c7_troops_intercepted: result.total })
        }
        return
      }
      setWaveIndex((current) => current + 1)
      setSecondsLeft(WAVE_SECONDS)
      setTrackingLeft(TRACKING_SECONDS)
      setReady(false)
      setResult(null)
      resolvedRef.current = false
    }, 1400)
    return () => window.clearTimeout(timer)
  }, [onFlagsChange, result, waveIndex, waves.length])

  return (
    <section className="mx-auto w-full max-w-5xl overflow-hidden border border-qin-bronze-35 bg-[#111317]/95 text-qin-parchment shadow-2xl">
      <div className="relative overflow-hidden border-b border-qin-bronze-25 bg-[linear-gradient(110deg,#17191d,#22211d,#15171a)] p-5 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:linear-gradient(90deg,transparent_49%,#B58A3D_50%,transparent_51%)] [background-size:80px_100%]" />
        <p className="relative text-[0.65rem] tracking-[0.45em] text-qin-bronze/70">C7 · 北道追截</p>
        <div className="relative mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl tracking-[0.2em]">截残军</h2>
            <p className="mt-3 text-sm leading-7 tracking-[0.08em] text-qin-parchment-50">
              五股残兵分路逃窜。读痕迹、判去向，在倒计时结束前派人封路。
            </p>
          </div>
          {!finished && (
            <div className="flex items-center gap-3 border border-[#C4746A]/40 bg-black/30 px-4 py-3 text-[#E6B1A7]">
              <Clock3 className="size-5" aria-hidden="true" />
              <span className="text-2xl tabular-nums">{ready ? secondsLeft : trackingLeft}</span>
              <span className="text-xs tracking-[0.18em]">{ready ? '息' : '追迹'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-8">
        <div className="flex items-center justify-between text-xs tracking-[0.16em] text-qin-parchment-40">
          <span>追截 {Math.min(waveIndex + 1, waves.length)} / {waves.length}</span>
          <span>已截 {intercepted} 股</span>
        </div>
        <div className="mt-3 h-1 overflow-hidden bg-qin-parchment-10">
          <div
            className="h-full bg-qin-bronze transition-all duration-500"
            style={{ width: `${finished ? 100 : (waveIndex / waves.length) * 100}%` }}
          />
        </div>

        {finished ? (
          <div className="py-12 text-center">
            <Flag className="mx-auto size-10 text-qin-bronze-light" aria-hidden="true" />
            <p className="mt-5 text-2xl tracking-[0.2em]">截下 {intercepted} / {waves.length} 股残兵</p>
            <p className="mx-auto mt-4 max-w-xl leading-8 text-qin-parchment-50">
              {pursuitResultLabel(intercepted, waves.length)}
            </p>
            <button
              type="button"
              onClick={onFinish}
              className="mt-8 border border-qin-bronze-50 px-8 py-3 tracking-[0.25em] text-qin-bronze-light hover:bg-qin-bronze-10"
            >
              收拢俘虏
            </button>
          </div>
        ) : (
          <>
            <div className="mt-7 min-h-28 border-l-2 border-[#C4746A] bg-qin-cinnabar-15 px-5 py-4">
              <p className="text-xs tracking-[0.25em] text-[#C98B7E]">{ready ? '斥候急报' : '沿街追迹'}</p>
              <p className="mt-3 text-lg leading-8 tracking-[0.08em]">
                {ready ? wave.clue : '青翎辨旗痕，阿芒听马蹄，小满沿水沟寻找新鲜脚印……'}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
              {PURSUIT_ROUTES.map((route) => {
                const Icon = ROUTE_ICONS[route.id]
                return (
                  <button
                    key={route.id}
                    type="button"
                    disabled={Boolean(result) || !ready}
                    onClick={() => commit(route.id)}
                    className="flex min-h-28 flex-col items-center justify-center gap-2 border border-qin-bronze-25 bg-[#1A1C20] px-2 py-4 transition-all enabled:hover:-translate-y-1 enabled:hover:border-qin-bronze-65 disabled:opacity-45 sm:min-h-32 sm:gap-3 sm:px-5 sm:py-6"
                  >
                    <Icon className="size-6 text-qin-bronze-light" aria-hidden="true" />
                    <span className="text-sm tracking-[0.08em] sm:text-lg sm:tracking-[0.18em]">{route.label}</span>
                    <span className="text-xs tracking-[0.16em] text-qin-parchment-25">派人封路</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 min-h-12 text-center text-sm leading-7" aria-live="polite">
              {result && (
                <span className={`inline-flex items-center gap-2 ${result.correct ? 'text-[#AFC4A8]' : 'text-[#C98B7E]'}`}>
                  {result.correct ? <Check className="size-4" /> : <X className="size-4" />}
                  {result.text}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
