import { useState } from 'react'
import type { StoryFlags } from '../game/save'
import C7ChoicePanel from './C7ChoicePanel'
import C8ReportPanel from './C8ReportPanel'
import CaseFragmentBoard from './CaseFragmentBoard'
import ChapterCard from './ChapterCard'
import {
  C4_TACTIC_LABELS,
  C7_CHOICE_OPTIONS,
  C7_LOCKED_CHOICE_BY_TACTIC,
  type C4Tactic,
} from './c7ChoiceData'
import type { C7Choice } from './c8ReportData'
import { C4_TACTIC_REPORTS } from './c4TacticData'

const ART_PLACEHOLDERS = [
  { id: 'bg_qukou.png', label: '渠口查验', src: './assets/bg_qukou.webp', type: 'background' },
  { id: 'bg_hangong.png', label: '韩王宫', src: './assets/bg_hangong.webp', type: 'background' },
  { id: 'bg_xinzheng.png', label: '新郑受降', src: './assets/bg_xinzheng.webp', type: 'background' },
  { id: 'bg_guanshu_huo.png', label: '官署火起', src: './assets/bg_guanshu_huo.webp', type: 'background' },
  { id: '韩王安', label: '韩王安', src: './assets/npc_hanwang.webp', type: 'portrait' },
  { id: '司马朔', label: '司马朔', src: './assets/npc_simashuo.webp', type: 'portrait' },
] as const

function firstAvailableChoice(tactic: C4Tactic): C7Choice {
  const locked = C7_LOCKED_CHOICE_BY_TACTIC[tactic]
  return C7_CHOICE_OPTIONS.find((option) => option.id !== locked)?.id ?? 'register'
}

export default function UiMechanicsPreview() {
  const [flags, setFlags] = useState<StoryFlags>({
    plead_soldier: true,
    c4_tactic: 'ambush',
    c7_choice: 'register',
  })
  const [caseResult, setCaseResult] = useState('等待勘验')
  const [caseKey, setCaseKey] = useState(0)
  const [showChapterCard, setShowChapterCard] = useState(false)

  const tactic = (flags.c4_tactic as C4Tactic | undefined) ?? 'ambush'
  const c7Choice = (flags.c7_choice as C7Choice | undefined) ?? null
  const tacticReport = C4_TACTIC_REPORTS[tactic]

  const updateTactic = (next: C4Tactic) => {
    setFlags((current) => ({
      ...current,
      c4_tactic: next,
      c7_choice: firstAvailableChoice(next),
    }))
  }

  return (
    <main className="min-h-screen bg-[#0d0e11] px-4 py-10 text-qin-parchment sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-qin-bronze-35 pb-7">
          <p className="text-xs tracking-[0.4em] text-qin-bronze/70">UI MECHANICS PREVIEW</p>
          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl tracking-[0.22em] sm:text-4xl">美术与交互验收台</h1>
              <p className="mt-3 text-sm leading-7 text-qin-parchment-50">
                占位机制独立验收，不改变当前剧情场景与对白顺序。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowChapterCard(true)}
                className="border border-qin-bronze-25 px-5 py-2 text-center text-sm tracking-[0.2em] text-qin-bronze-light hover:bg-qin-bronze-10"
              >
                预览章节卡
              </button>
              <a
                href="/"
                className="border border-qin-bronze-25 px-5 py-2 text-center text-sm tracking-[0.2em] text-qin-bronze-light hover:bg-qin-bronze-10"
              >
                返回游戏
              </a>
            </div>
          </div>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="border border-qin-bronze-25 bg-[#151619] p-6">
            <p className="text-xs tracking-[0.3em] text-qin-bronze/70">S10 → C4 · FLAG</p>
            <h2 className="mt-3 text-2xl tracking-[0.18em]">失期秦卒回响</h2>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setFlags((current) => ({ ...current, plead_soldier: true }))}
                className={`flex-1 border px-4 py-3 ${flags.plead_soldier ? 'border-qin-bronze bg-qin-bronze-10' : 'border-qin-parchment-10'}`}
              >
                求情
              </button>
              <button
                type="button"
                onClick={() => setFlags((current) => ({ ...current, plead_soldier: false }))}
                className={`flex-1 border px-4 py-3 ${flags.plead_soldier === false ? 'border-qin-bronze bg-qin-bronze-10' : 'border-qin-parchment-10'}`}
              >
                不开口
              </button>
            </div>
            <blockquote className="mt-6 border-l-2 border-qin-bronze bg-black/20 p-5 leading-8 text-qin-parchment-80">
              {flags.plead_soldier
                ? '“那次你替我说情，这次我替你守口。”'
                : '“那次你没有开口。今天我守这里，不为还债，只因军令。”'}
            </blockquote>
          </article>

          <article className="border border-qin-bronze-25 bg-[#151619] p-6">
            <p className="text-xs tracking-[0.3em] text-qin-bronze/70">C4 · TACTIC</p>
            <h2 className="mt-3 text-2xl tracking-[0.18em]">截杀战前</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {(Object.keys(C4_TACTIC_LABELS) as C4Tactic[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateTactic(option)}
                  className={`border px-3 py-3 text-sm ${tactic === option ? 'border-qin-bronze bg-qin-bronze-10 text-qin-bronze-light' : 'border-qin-parchment-10 text-qin-parchment-50'}`}
                >
                  {C4_TACTIC_LABELS[option]}
                </button>
              ))}
            </div>
            <div className="mt-6 border border-qin-parchment-10 bg-black/15 p-5 text-sm leading-7">
              <div className="tracking-[0.18em] text-qin-bronze-light">{tacticReport.heading} · 战后报告</div>
              <p className="mt-3 text-qin-parchment-80">{tacticReport.result}</p>
              <p className="text-qin-parchment-40">{tacticReport.cost}</p>
            </div>
          </article>
        </section>

        <section className="mt-10">
          <C7ChoicePanel
            c4Tactic={tactic}
            currentChoice={c7Choice}
            onChoose={(choice) => setFlags((current) => ({ ...current, c7_choice: choice }))}
          />
        </section>

        {c7Choice && (
          <section className="mt-10">
            <C8ReportPanel choice={c7Choice} />
          </section>
        )}

        <section className="mt-10">
          <CaseFragmentBoard
            key={caseKey}
            onReveal={(fragment) => setCaseResult(`已翻开：${fragment.owner}·${fragment.source}`)}
            onCombine={() => setCaseResult('并案完成，可进入章台')}
          />
          <div className="mt-3 flex items-center justify-between text-xs tracking-[0.15em] text-qin-parchment-40">
            <span aria-live="polite">{caseResult}</span>
            <button
              type="button"
              onClick={() => {
                setCaseResult('等待勘验')
                setCaseKey((value) => value + 1)
              }}
              className="text-qin-bronze-light hover:text-qin-bronze-light/80"
            >
              重置碎片
            </button>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl tracking-[0.2em]">占位素材挂载</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ART_PLACEHOLDERS.map((asset) => (
              <figure key={asset.id} className="overflow-hidden border border-qin-bronze-25 bg-[#151619]">
                <img
                  src={asset.src}
                  alt={`${asset.label}占位素材`}
                  className={`w-full object-cover ${asset.type === 'portrait' ? 'aspect-square object-top' : 'aspect-video'}`}
                />
                <figcaption className="p-4">
                  <div className="text-qin-bronze-light">{asset.label}</div>
                  <div className="mt-1 break-all text-xs text-qin-parchment-25">{asset.id}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <pre className="mt-10 overflow-x-auto border border-qin-parchment-10 bg-black/20 p-4 text-xs leading-6 text-qin-parchment-50">
          {JSON.stringify(flags, null, 2)}
        </pre>
      </div>

      {showChapterCard && (
        <ChapterCard
          from={{ number: '序章', title: '郑地伏杀' }}
          to={{ number: '第一章', title: '新郑覆旗' }}
          transitionMs={700}
          onContinue={() => setShowChapterCard(false)}
        />
      )}
    </main>
  )
}
