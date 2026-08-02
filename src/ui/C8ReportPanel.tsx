import type { EvacSurvival, SavedRegisterId } from '../game/save'
import {
  C8_FIXED_REPORTS,
  resolveC8ReportVariant,
  type C7Choice,
  type MilitaryReportSection,
} from './c8ReportData'

export interface C8ReportPanelProps {
  choice: C7Choice
  savedRegisters?: readonly SavedRegisterId[]
  evacSurvival?: EvacSurvival
  title?: string
  onContinue?: () => void
  continueLabel?: string
}

function ReportSection({
  report,
  emphasis = false,
}: {
  report: MilitaryReportSection
  emphasis?: boolean
}) {
  return (
    <article
      className={`relative border px-5 py-5 sm:px-7 ${
        emphasis
          ? 'border-qin-bronze-50 bg-qin-bronze-10'
          : 'border-qin-parchment-10 bg-black/10'
      }`}
    >
      <div
        className={`absolute left-0 top-5 h-8 w-0.5 ${emphasis ? 'bg-qin-bronze' : 'bg-qin-parchment-25'}`}
        aria-hidden="true"
      />
      <h3 className={`text-sm tracking-[0.2em] ${emphasis ? 'text-qin-bronze-light' : 'text-qin-parchment-65'}`}>
        {report.heading}
      </h3>
      <dl className="mt-4 grid gap-3 text-sm leading-7 sm:grid-cols-[3.5rem_1fr]">
        <dt className="text-qin-bronze/75">结果</dt>
        <dd className="text-qin-parchment-80">{report.result}</dd>
        <dt className="text-qin-bronze/75">代价</dt>
        <dd className="text-qin-parchment-65">{report.cost}</dd>
      </dl>
    </article>
  )
}

export default function C8ReportPanel({
  choice,
  savedRegisters = [],
  evacSurvival,
  title = '新郑战后军报',
  onContinue,
  continueLabel = '收起军报',
}: C8ReportPanelProps) {
  const variant = resolveC8ReportVariant(choice, savedRegisters, evacSurvival)

  return (
    <section
      className="mx-auto w-full max-w-3xl border border-qin-bronze-35 bg-[#151619]/95 p-4 text-qin-parchment shadow-2xl sm:p-8"
      aria-labelledby="c8-report-title"
    >
      <header className="mb-6 text-center">
        <p className="text-[0.65rem] tracking-[0.45em] text-qin-bronze-65">C8 · 军报汇录</p>
        <h2 id="c8-report-title" className="mt-3 text-2xl tracking-[0.25em] sm:text-3xl">
          {title}
        </h2>
        <div className="mx-auto mt-4 h-px w-32 bg-gradient-to-r from-transparent via-qin-bronze/70 to-transparent" />
      </header>

      <div className="grid gap-3">
        <ReportSection report={C8_FIXED_REPORTS.surrender} />
        <ReportSection report={variant} emphasis />
        <ReportSection report={C8_FIXED_REPORTS.canal} />
      </div>

      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          className="qin-btn mt-7 w-full border border-qin-bronze-35 px-5 py-3 text-sm tracking-[0.25em] text-qin-bronze-light hover:bg-qin-bronze-10"
        >
          {continueLabel}
        </button>
      )}
    </section>
  )
}
