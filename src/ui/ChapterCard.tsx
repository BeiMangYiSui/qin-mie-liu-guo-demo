import { useEffect, useState } from 'react'

export interface ChapterDescriptor {
  number: string
  title: string
}

export type ChapterDirection = 'forward' | 'backward'

export interface ChapterCardProps {
  from?: ChapterDescriptor
  to: ChapterDescriptor
  direction?: ChapterDirection
  transitionMs?: number
  onContinue: () => void
  continueLabel?: string
}

type TransitionPhase = 'from' | 'closing' | 'opening'

/**
 * Full-screen chapter transition.
 *
 * Give the component a new React `key` when switching to another chapter pair,
 * so the entrance sequence restarts from its initial state.
 */
export default function ChapterCard({
  from,
  to,
  direction = 'forward',
  transitionMs = 900,
  onContinue,
  continueLabel = '点击继续',
}: ChapterCardProps) {
  const [phase, setPhase] = useState<TransitionPhase>(from ? 'from' : 'opening')
  const hasPreviousChapter = Boolean(from)
  const canContinue = phase === 'opening'
  const exitOffset = direction === 'forward' ? '-0.75rem' : '0.75rem'
  const entranceOffset = direction === 'forward' ? '0.75rem' : '-0.75rem'

  useEffect(() => {
    if (!hasPreviousChapter) return

    let timer = 0
    const frame = window.requestAnimationFrame(() => {
      setPhase('closing')
      timer = window.setTimeout(() => setPhase('opening'), transitionMs)
    })

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [hasPreviousChapter, transitionMs])

  const continueChapter = () => {
    if (canContinue) onContinue()
  }

  return (
    <section
      className="fixed inset-0 z-[80] flex cursor-pointer select-none items-center justify-center overflow-hidden bg-[#0d0e11] px-6 text-qin-parchment"
      role="button"
      tabIndex={0}
      aria-label={`${to.number}《${to.title}》，${canContinue ? continueLabel : '章节转场中'}`}
      onClick={continueChapter}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          continueChapter()
        }
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 50% 48%, rgba(181, 138, 61, 0.13), transparent 31%), linear-gradient(180deg, #101114 0%, #090a0c 100%)',
        }}
      />

      <div className="relative grid w-full max-w-4xl grid-rows-[1fr_auto_1fr] items-center">
        <div
          className="flex min-h-32 flex-col items-center justify-end transition-all ease-in"
          style={{
            opacity: hasPreviousChapter && phase !== 'opening' ? 1 : 0,
            transform: phase === 'closing' ? `translateY(${exitOffset})` : 'translateY(0)',
            transitionDuration: `${transitionMs}ms`,
          }}
          aria-hidden={!from || phase === 'opening'}
        >
          {from && (
            <>
              <p className="text-sm tracking-[0.45em] text-qin-bronze/70">{from.number}</p>
              <h2 className="mt-3 text-center text-2xl tracking-[0.22em] text-qin-parchment-80 sm:text-3xl">
                《{from.title}》· 完
              </h2>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 py-7 text-qin-bronze-50" aria-hidden="true">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-current" />
          <span className="size-2 rotate-45 border border-current" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-current" />
        </div>

        <div
          className="flex min-h-40 flex-col items-center justify-start transition-all ease-out"
          style={{
            opacity: phase === 'opening' ? 1 : 0,
            transform: phase === 'opening' ? 'translateY(0)' : `translateY(${entranceOffset})`,
            transitionDuration: `${transitionMs}ms`,
          }}
          aria-hidden={!canContinue}
        >
          <p className="flex items-center gap-3 text-sm tracking-[0.5em] text-qin-bronze">
            <img src="/assets/seal_qin.svg" alt="" className="size-8 opacity-60" aria-hidden="true" />
            {to.number}
          </p>
          <h1 className="mt-4 text-center text-3xl tracking-[0.24em] sm:text-5xl">《{to.title}》</h1>
          <p
            className={`mt-10 text-xs tracking-[0.35em] text-qin-parchment-40 transition-opacity duration-700 ${
              canContinue ? 'animate-pulse opacity-100' : 'opacity-0'
            }`}
          >
            {continueLabel}
          </p>
        </div>
      </div>
    </section>
  )
}
