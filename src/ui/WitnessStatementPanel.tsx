import { useState } from 'react'
import { Check, Feather, RotateCcw, X } from 'lucide-react'
import { playSfx, unlockBgm } from '../game/audio'

type StatementId = 'seen' | 'rumor' | 'inference'

const STATEMENTS: readonly {
  id: StatementId
  text: string
  source: string
  correct: boolean
  feedback: string
}[] = [
  {
    id: 'seen',
    text: '郑国深夜密见韩使。',
    source: '北芒亲眼所见',
    correct: true,
    feedback: '这是你看见的。可以落笔。',
  },
  {
    id: 'rumor',
    text: '韩国命水工疲秦坏渠。',
    source: '章台传闻',
    correct: false,
    feedback: '这不是你看见的。传闻不能写成证词。',
  },
  {
    id: 'inference',
    text: '郑国与韩使商定了疲秦之计。',
    source: '无人听见的谈话',
    correct: false,
    feedback: '你只看见他们见面，并没有听见他们谈了什么。',
  },
]

export default function WitnessStatementPanel({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState<StatementId | null>(null)
  const statement = STATEMENTS.find((item) => item.id === selected) ?? null

  const choose = (id: StatementId) => {
    unlockBgm()
    playSfx('select')
    setSelected(id)
  }

  return (
    <section className="mx-auto w-full max-w-4xl border border-qin-bronze-35 bg-[#111317]/95 p-5 text-qin-parchment shadow-2xl sm:p-8">
      <header className="text-center">
        <p className="text-[0.65rem] tracking-[0.45em] text-qin-bronze-65">序章 · 亲见为证</p>
        <h2 className="mt-3 text-2xl tracking-[0.22em] sm:text-3xl">哪一句能写进告书？</h2>
        <p className="mt-3 text-sm leading-7 tracking-[0.08em] text-qin-parchment-50">
          公孙钺只准北芒写下亲眼确认的事实。传闻与推断，不能冒充证词。
        </p>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-3" role="radiogroup" aria-label="选择可以落笔的证词">
        {STATEMENTS.map((item) => {
          const isSelected = selected === item.id
          const resolved = isSelected ? item.correct : null
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => choose(item.id)}
              className={`flex min-h-56 flex-col border p-5 text-left transition-all ${
                isSelected
                  ? resolved
                    ? 'border-[#8FAF8B]/70 bg-[#8FAF8B]/10'
                    : 'border-[#C4746A]/70 bg-[#C4746A]/10'
                  : 'border-qin-bronze-25 bg-[#1A1C20] hover:-translate-y-1 hover:border-qin-bronze-65'
              }`}
            >
              <span className="flex items-center justify-between text-xs tracking-[0.2em] text-qin-bronze-65">
                告书候选
                {isSelected && (resolved
                  ? <Check className="size-4 text-[#9DB89A]" aria-hidden="true" />
                  : <X className="size-4 text-[#C98B7E]" aria-hidden="true" />)}
              </span>
              <span className="mt-8 text-lg leading-8 tracking-[0.1em]">{item.text}</span>
              <span className="mt-auto border-t border-qin-parchment-10 pt-4 text-xs leading-6 text-qin-parchment-40">
                来源：{item.source}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-7 min-h-28 border border-qin-parchment-10 bg-black/20 p-5 text-center">
        {statement ? (
          <>
            <p className={`leading-7 ${statement.correct ? 'text-[#B7C9AE]' : 'text-[#C98B7E]'}`} aria-live="polite">
              {statement.feedback}
            </p>
            {statement.correct ? (
              <button
                type="button"
                onClick={onComplete}
                className="qin-btn mt-5 border border-qin-bronze-50 px-8 py-3 tracking-[0.25em] text-qin-bronze-light hover:bg-qin-bronze-10"
              >
                <Feather className="size-4" aria-hidden="true" />
                落笔封卷
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="qin-btn mt-5 text-sm tracking-[0.2em] text-qin-bronze-light"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                删去重写
              </button>
            )}
          </>
        ) : (
          <p className="pt-5 text-sm tracking-[0.14em] text-qin-parchment-25">选择一句，核对它来自亲见、传闻，还是推断。</p>
        )}
      </div>
    </section>
  )
}
