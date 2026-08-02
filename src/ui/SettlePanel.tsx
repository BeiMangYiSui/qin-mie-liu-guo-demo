import { CheckCircle2, CircleDashed, Medal } from 'lucide-react'
import type { StoryFlags } from '../game/save'
import {
  SETTLE_RATING_LABELS,
  SETTLE_TEXT,
  branchOutcomeSucceeded,
  c7OutcomeLabel,
  c4PerformanceLabel,
  c4TacticLabel,
  c7ChoiceLabel,
  calculateSettleRating,
  s6OutcomeLabel,
} from './settleData'

export interface SettlePanelProps {
  flags: StoryFlags
  shichengUnlocked: number
  shichengTotal?: number
  onContinue?: () => void
  continueLabel?: string
}

interface Row {
  label: string
  value: string
  complete?: boolean
}

function Column({ title, rows }: { title: string; rows: readonly Row[] }) {
  return (
    <section className="border border-qin-parchment-10 bg-black/10 p-5">
      <h3 className="border-b border-qin-bronze-25 pb-3 text-sm tracking-[0.25em] text-qin-bronze-light">
        {title}
      </h3>
      <ul className="mt-4 space-y-4">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start gap-3 text-sm leading-6">
            {row.complete === undefined ? (
              <CircleDashed className="mt-1 size-4 shrink-0 text-qin-bronze-50" aria-hidden="true" />
            ) : row.complete ? (
              <CheckCircle2 className="mt-1 size-4 shrink-0 text-qin-bronze" aria-hidden="true" />
            ) : (
              <CircleDashed className="mt-1 size-4 shrink-0 text-qin-parchment-25" aria-hidden="true" />
            )}
            <span>
              <span className="block text-xs tracking-[0.16em] text-qin-parchment-40">{row.label}</span>
              <span className="mt-1 block text-qin-parchment-80">{row.value}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function SettlePanel({
  flags,
  shichengUnlocked,
  shichengTotal = 4,
  onContinue,
  continueLabel = '进入章节转场',
}: SettlePanelProps) {
  const rating = calculateSettleRating(flags)
  const branchSuccess = branchOutcomeSucceeded(flags)
  const savedRegisters = flags.c7_saved_registers ?? []

  const columns: readonly { title: string; rows: readonly Row[] }[] = [
    {
      title: '战绩',
      rows: [
        {
          label: 'C4 战绩',
          value: `${c4TacticLabel(flags)} · ${c4PerformanceLabel(flags)}`,
          complete: flags.c4_performance ? flags.c4_performance !== 'low' : Boolean(flags.c4_tactic),
        },
        {
          label: 'C7 战果',
          value: c7OutcomeLabel(flags),
          complete: branchSuccess,
        },
      ],
    },
    {
      title: '抉择',
      rows: [
        {
          label: '失期秦卒',
          value:
            flags.plead_soldier === true
              ? '求过情'
              : flags.plead_soldier === false
                ? '未开口'
                : '尚未作出抉择',
          complete: flags.plead_soldier !== undefined,
        },
        { label: '官署火起', value: c7ChoiceLabel(flags), complete: Boolean(flags.c7_choice) },
      ],
    },
    {
      title: '支线',
      rows: [
        {
          label: '韩蕙',
          value: savedRegisters.includes('huji') ? SETTLE_TEXT.hanhui.reunited : SETTLE_TEXT.hanhui.lost,
          complete: savedRegisters.includes('huji'),
        },
        {
          label: '郑地伏杀',
          value: s6OutcomeLabel(flags),
        },
      ],
    },
    {
      title: '史乘',
      rows: [
        {
          label: '收集进度',
          value: `${Math.min(shichengUnlocked, shichengTotal)} / ${shichengTotal}`,
          complete: shichengUnlocked >= shichengTotal,
        },
        { label: '本章新录', value: '疲秦计 · 逐客令 · 韩亡 · 郑国渠' },
      ],
    },
  ]

  return (
    <section
      className="mx-auto w-full max-w-6xl border border-qin-bronze-35 bg-[#121316]/95 p-5 text-qin-parchment shadow-2xl sm:p-8"
      aria-labelledby="settle-title"
      data-scene-id="c8_settle"
    >
      <header className="flex flex-col justify-between gap-5 border-b border-qin-bronze-25 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-[0.65rem] tracking-[0.45em] text-qin-bronze-65">C8 · 章末结算</p>
          <h2 id="settle-title" className="mt-3 text-3xl tracking-[0.28em]">新郑覆旗</h2>
        </div>
        <div className="flex items-center gap-3 border border-qin-bronze-35 bg-qin-bronze-10 px-5 py-3">
          <Medal className="size-6 text-qin-bronze-light" aria-hidden="true" />
          <span>
            <span className="block text-xs tracking-[0.2em] text-qin-parchment-40">本章评级</span>
            <strong className="mt-1 block text-xl tracking-[0.25em] text-qin-bronze-light">
              {SETTLE_RATING_LABELS[rating]}
            </strong>
          </span>
        </div>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => <Column key={column.title} {...column} />)}
      </div>

      <p className="mt-6 border-l-2 border-qin-bronze-50 pl-4 text-sm leading-7 text-qin-parchment-50">
        {SETTLE_TEXT.ratingLine[rating]}
      </p>

      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          className="qin-btn mt-7 w-full border border-qin-bronze-50 px-5 py-3 text-sm tracking-[0.25em] text-qin-bronze-light hover:bg-qin-bronze-10"
        >
          {continueLabel}
        </button>
      )}
    </section>
  )
}
