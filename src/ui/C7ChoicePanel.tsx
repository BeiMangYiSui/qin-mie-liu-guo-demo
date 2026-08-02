import { Check, LockKeyhole } from 'lucide-react'
import {
  C4_TACTIC_LABELS,
  C7_CHOICE_OPTIONS,
  C7_LOCKED_CHOICE_BY_TACTIC,
  C7_LOCK_REASON_BY_TACTIC,
  type C4Tactic,
} from './c7ChoiceData'
import type { C7Choice } from './c8ReportData'

export interface C7ChoicePanelProps {
  c4Tactic: C4Tactic
  currentChoice: C7Choice | null
  onChoose: (choice: C7Choice) => void
  title?: string
}

export default function C7ChoicePanel({
  c4Tactic,
  currentChoice,
  onChoose,
  title = '火起之后',
}: C7ChoicePanelProps) {
  const lockedChoice = C7_LOCKED_CHOICE_BY_TACTIC[c4Tactic]
  const lockReason = C7_LOCK_REASON_BY_TACTIC[c4Tactic]

  return (
    <section
      className="mx-auto w-full max-w-4xl border border-qin-bronze-35 bg-[#121316]/95 p-5 text-qin-parchment shadow-2xl sm:p-8"
      aria-labelledby="c7-choice-title"
    >
      <header className="text-center">
        <p className="text-[0.65rem] tracking-[0.45em] text-qin-bronze-65">C7 · 三择其一</p>
        <h2 id="c7-choice-title" className="mt-3 text-2xl tracking-[0.25em] sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 tracking-[0.08em] text-qin-parchment-50">
          先前战术：{C4_TACTIC_LABELS[c4Tactic]}。兵力有限，只能择一而行。
        </p>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-3" role="radiogroup" aria-label="选择处置方向">
        {C7_CHOICE_OPTIONS.map((option, index) => {
          const isLocked = option.id === lockedChoice
          const isSelected = option.id === currentChoice

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isLocked}
              onClick={() => onChoose(option.id)}
              className={`relative flex min-h-56 flex-col border p-5 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-qin-bronze ${
                isLocked
                  ? 'cursor-not-allowed border-qin-parchment-10 bg-black/10 text-qin-parchment-25'
                  : isSelected
                    ? 'border-qin-bronze-80 bg-qin-bronze-10 shadow-[0_0_24px_rgba(181,138,61,0.12)]'
                    : 'border-qin-bronze-25 bg-[#1b1c20] hover:-translate-y-1 hover:border-qin-bronze-65'
              }`}
            >
              <span className="flex w-full items-center justify-between">
                <span className="text-xs tracking-[0.24em] text-qin-bronze/70">
                  抉择 {index + 1}
                </span>
                {isLocked ? (
                  <LockKeyhole className="size-4 text-qin-parchment-25" aria-hidden="true" />
                ) : isSelected ? (
                  <Check className="size-4 text-qin-bronze-light" aria-hidden="true" />
                ) : (
                  <span
                    className="size-3 rounded-full border border-qin-bronze-50"
                    aria-hidden="true"
                  />
                )}
              </span>

              <span
                className={`mt-7 text-xl tracking-[0.18em] ${
                  isSelected ? 'text-qin-bronze-light' : ''
                }`}
              >
                {option.title}
              </span>
              <span className="mt-4 text-sm leading-7 text-qin-parchment-50">{option.summary}</span>

              <span
                className={`mt-auto border-t pt-4 text-xs leading-6 ${
                  isLocked
                    ? 'border-qin-parchment-10 text-[#C4746A]/75'
                    : isSelected
                      ? 'border-qin-bronze-25 text-qin-bronze-light/80'
                      : 'border-qin-parchment-10 text-qin-parchment-25'
                }`}
              >
                {isLocked ? lockReason : isSelected ? '已选择' : '点击选择'}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

