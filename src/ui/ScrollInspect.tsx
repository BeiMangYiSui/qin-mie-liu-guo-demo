import { useMemo, useState } from 'react'
import { Check, FileSearch, LockKeyhole, ScrollText, TriangleAlert } from 'lucide-react'

export interface ScrollInspectFinding {
  title: string
  detail: string
}

export interface ScrollInspectStack {
  id: string
  label: string
  cover: string
  detail: string
  finding?: ScrollInspectFinding
}

export interface ScrollInspectProps {
  sceneId: 's3_chaan' | 'c1_pinan'
  stacks: readonly ScrollInspectStack[]
  requiredFindings?: number
  title?: string
  eyebrow?: string
  instruction?: string
  continueLabel?: string
  fallbackText?: string
  onReveal?: (stack: ScrollInspectStack, index: number) => void
  onContinue: () => void
}

export default function ScrollInspect({
  sceneId,
  stacks,
  requiredFindings = stacks.filter((stack) => stack.finding).length,
  title = '简册翻查',
  eyebrow = '案卷复核',
  instruction = '逐叠翻查，找齐异常后继续剧情',
  continueLabel = '继续剧情',
  fallbackText = '异常尚未找齐，再核对一遍。',
  onReveal,
  onContinue,
}: ScrollInspectProps) {
  const [revealedIds, setRevealedIds] = useState<readonly string[]>([])

  const findings = useMemo(
    () => stacks.filter((stack) => revealedIds.includes(stack.id) && stack.finding),
    [revealedIds, stacks],
  )
  const allRevealed = revealedIds.length === stacks.length
  const canContinue = findings.length >= requiredFindings

  const reveal = (stack: ScrollInspectStack, index: number) => {
    if (revealedIds.includes(stack.id)) return
    setRevealedIds((current) => [...current, stack.id])
    onReveal?.(stack, index)
  }

  return (
    <section
      className="mx-auto w-full max-w-5xl border border-qin-bronze-35 bg-[#121316]/95 p-5 text-qin-parchment shadow-2xl sm:p-8"
      aria-labelledby={`${sceneId}-scroll-title`}
      data-scene-id={sceneId}
    >
      <header className="text-center">
        <p className="text-[0.65rem] tracking-[0.45em] text-qin-bronze-65">{eyebrow}</p>
        <h2 id={`${sceneId}-scroll-title`} className="mt-3 text-2xl tracking-[0.25em] sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-sm tracking-[0.12em] text-qin-parchment-50">{instruction}</p>
      </header>

      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {stacks.map((stack, index) => {
          const revealed = revealedIds.includes(stack.id)
          return (
            <li key={stack.id} className="min-h-72">
              <button
                type="button"
                onClick={() => reveal(stack, index)}
                aria-expanded={revealed}
                className={`group relative flex h-full w-full flex-col border p-5 text-left transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-qin-bronze ${
                  revealed
                    ? 'border-qin-bronze-50 bg-qin-bronze-10'
                    : 'cursor-pointer border-qin-bronze-25 bg-[#1b1c20] hover:-translate-y-1 hover:border-qin-bronze-65 hover:shadow-[0_12px_30px_rgba(0,0,0,0.3)]'
                }`}
              >
                <span className="flex w-full items-center justify-between">
                  <span className="text-xs tracking-[0.25em] text-qin-bronze/75">简册 {index + 1}</span>
                  {revealed ? (
                    <Check className="size-4 text-qin-bronze" aria-hidden="true" />
                  ) : (
                    <FileSearch className="size-4 text-qin-bronze/75" aria-hidden="true" />
                  )}
                </span>

                <span className="mt-8 flex items-center gap-3 text-xl tracking-[0.14em]">
                  <ScrollText className="size-5 text-qin-bronze/70" aria-hidden="true" />
                  {stack.label}
                </span>
                <span className="mt-4 text-sm leading-7 text-qin-parchment-40">
                  {revealed ? stack.detail : stack.cover}
                </span>

                <span className="mt-auto border-t border-qin-parchment-10 pt-5 text-sm leading-7">
                  {revealed ? (
                    stack.finding ? (
                      <span className="block border border-[#C4746A]/35 bg-[#C4746A]/10 p-3">
                        <span className="block text-xs tracking-[0.2em] text-[#C98B7E]">异常记录</span>
                        <span className="mt-2 block text-qin-parchment-80">{stack.finding.title}</span>
                        <span className="mt-1 block text-qin-parchment-50">{stack.finding.detail}</span>
                      </span>
                    ) : (
                      <span className="text-qin-parchment-40">本叠未见异常。</span>
                    )
                  ) : (
                    <span className="text-qin-parchment-25">点击翻开</span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="mt-7 flex flex-col items-center">
        <p className="mb-3 text-xs tracking-[0.2em] text-qin-parchment-40" aria-live="polite">
          已翻查 {revealedIds.length} / {stacks.length} · 异常 {findings.length} / {requiredFindings}
        </p>

        {allRevealed && !canContinue && (
          <div className="mb-4 flex max-w-xl items-start gap-3 border border-[#C4746A]/35 bg-[#C4746A]/10 p-4 text-sm leading-7 text-qin-parchment-65">
            <TriangleAlert className="mt-1 size-4 shrink-0 text-[#C98B7E]" aria-hidden="true" />
            <span>{fallbackText}</span>
          </div>
        )}

        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="qin-btn min-w-52 border border-qin-bronze-50 px-8 py-3 tracking-[0.3em] text-qin-bronze-light enabled:hover:bg-qin-bronze-10 disabled:cursor-not-allowed disabled:border-qin-parchment-10 disabled:text-qin-parchment-25"
        >
          {canContinue ? continueLabel : (
            <span className="inline-flex items-center gap-2">
              <LockKeyhole className="size-4" aria-hidden="true" />
              尚缺异常
            </span>
          )}
        </button>
      </div>
    </section>
  )
}
