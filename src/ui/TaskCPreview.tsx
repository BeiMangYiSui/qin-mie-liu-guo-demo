import { useMemo, useState } from 'react'
import type { StoryFlags } from '../game/save'
import BattleRetryOverlay from './BattleRetryOverlay'
import C8ReportPanel from './C8ReportPanel'
import DefenseBattlePanel from './DefenseBattlePanel'
import FireRescue from './FireRescue'
import SettlePanel from './SettlePanel'
import ShichengPage from './ShichengPage'
import ScrollInspect from './ScrollInspect'
import PursuitIntercept from './PursuitIntercept'
import { S3_SCROLL_STACKS } from './scrollInspectData'
import { SHICHENG_CARDS } from './shichengData'

const RATING_PRESETS: Record<string, StoryFlags> = {
  head: {
    plead_soldier: false,
    c4_tactic: 'ambush',
    c7_choice: 'register',
    c7_saved_registers: ['huji', 'liangce', 'ditu'],
  },
  second: {
    plead_soldier: true,
    c4_tactic: 'valley',
    c7_choice: 'camp',
    evac_survival: 'high',
  },
  balanced: {
    plead_soldier: true,
    c4_tactic: 'rear',
    c7_choice: 'register',
    c7_saved_registers: ['liangce', 'ditu', 'junji'],
  },
}

export default function TaskCPreview() {
  const [flags, setFlags] = useState<StoryFlags>(RATING_PRESETS.head)
  const [fireKey, setFireKey] = useState(0)
  const [evacKey, setEvacKey] = useState(0)
  const [pursuitKey, setPursuitKey] = useState(0)
  const [shichengOpen, setShichengOpen] = useState(false)
  const [retryOpen, setRetryOpen] = useState(false)
  const [unlockedCount, setUnlockedCount] = useState(2)

  const unlockedCards = useMemo(
    () => SHICHENG_CARDS.slice(0, unlockedCount).map((card) => card.id),
    [unlockedCount],
  )

  const patchFlags = (patch: StoryFlags) => {
    setFlags((current) => ({ ...current, ...patch }))
  }

  return (
    <main className="min-h-screen bg-[#0d0e11] px-4 py-10 text-qin-parchment sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-qin-bronze-35 pb-7">
          <p className="text-xs tracking-[0.4em] text-qin-bronze/70">TASK C · ACCEPTANCE</p>
          <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl tracking-[0.22em] sm:text-4xl">增补 UI 与玩法验收台</h1>
              <p className="mt-3 text-sm leading-7 text-qin-parchment-50">
                所有剧情文字保持占位符；组件接口按三路任务约定输出。
              </p>
            </div>
            <a
              href="/"
              className="border border-qin-bronze-35 px-5 py-2 text-center text-sm tracking-[0.2em] text-qin-bronze-light hover:bg-qin-bronze-10"
            >
              返回游戏
            </a>
          </div>
        </header>

        <section className="mt-10">
          <ScrollInspect
            sceneId="s3_chaan"
            stacks={S3_SCROLL_STACKS}
            requiredFindings={2}
            eyebrow="S3 · 渠口查验"
            title="翻查三叠简"
            fallbackText="异常尚未找齐，再核对一遍。"
            onContinue={() => window.alert('S3 挂载口通过')}
          />
        </section>

        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl tracking-[0.2em]">C7 火场</h2>
            <button
              type="button"
              onClick={() => {
                setFireKey((value) => value + 1)
                patchFlags({ c7_saved_registers: [] })
              }}
              className="text-sm tracking-[0.16em] text-qin-bronze-light"
            >
              重置火场
            </button>
          </div>
          <FireRescue
            key={fireKey}
            durationSeconds={45}
            onFlagsChange={patchFlags}
          />
        </section>

        <section className="mt-12 grid gap-6 xl:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl tracking-[0.2em]">C7 截残军</h2>
              <button
                type="button"
                onClick={() => setPursuitKey((value) => value + 1)}
                className="text-sm tracking-[0.16em] text-qin-bronze-light"
              >
                重置追截
              </button>
            </div>
            <PursuitIntercept
              key={pursuitKey}
              onFlagsChange={patchFlags}
              onFinish={() => window.alert('C7 截残军挂载口通过')}
            />
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl tracking-[0.2em]">C8 军报联动</h2>
              <select
                value={flags.c7_choice ?? 'register'}
                onChange={(event) => patchFlags({ c7_choice: event.target.value as StoryFlags['c7_choice'] })}
                className="border border-qin-bronze-35 bg-[#151619] px-3 py-2 text-sm"
              >
                <option value="register">保户籍</option>
                <option value="troops">截残军</option>
                <option value="camp">护疫营</option>
              </select>
            </div>
            <C8ReportPanel
              choice={flags.c7_choice ?? 'register'}
              savedRegisters={flags.c7_saved_registers}
              evacSurvival={flags.evac_survival}
            />
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl tracking-[0.2em]">C7 撤离战</h2>
              <button
                type="button"
                onClick={() => setEvacKey((value) => value + 1)}
                className="text-sm tracking-[0.16em] text-qin-bronze-light"
              >
                重置战斗
              </button>
            </div>
            <DefenseBattlePanel
              key={evacKey}
              onFlagsChange={patchFlags}
              onDefeat={() => setRetryOpen(true)}
            />
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl tracking-[0.2em]">结算三档</h2>
            <div className="flex flex-wrap gap-2">
              {Object.keys(RATING_PRESETS).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFlags({ ...RATING_PRESETS[preset] })}
                  className="border border-qin-bronze-25 px-4 py-2 text-xs tracking-[0.15em] text-qin-bronze-light"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
          <SettlePanel flags={flags} shichengUnlocked={unlockedCount} />
        </section>

        <section className="mt-12 border border-qin-bronze-25 bg-[#151619] p-6">
          <h2 className="text-2xl tracking-[0.2em]">史乘与回卷</h2>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className="text-sm text-qin-parchment-50">
              解锁卡数
              <select
                value={unlockedCount}
                onChange={(event) => setUnlockedCount(Number(event.target.value))}
                className="ml-3 border border-qin-bronze-25 bg-[#111317] px-3 py-2"
              >
                {[0, 1, 2, 3, 4].map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setShichengOpen(true)}
              className="border border-qin-bronze-35 px-5 py-2 text-sm tracking-[0.18em] text-qin-bronze-light"
            >
              打开史乘
            </button>
            <button
              type="button"
              onClick={() => setRetryOpen(true)}
              className="border border-[#C4746A]/45 px-5 py-2 text-sm tracking-[0.18em] text-[#C98B7E]"
            >
              预览战败回卷
            </button>
          </div>
        </section>

        <pre className="mt-10 overflow-x-auto border border-qin-parchment-10 bg-black/20 p-4 text-xs leading-6 text-qin-parchment-50">
          {JSON.stringify(flags, null, 2)}
        </pre>
      </div>

      {shichengOpen && (
        <ShichengPage
          unlockedCardIds={unlockedCards}
          onClose={() => setShichengOpen(false)}
        />
      )}
      {retryOpen && (
        <BattleRetryOverlay
          battleId="c7_evac"
          onRetry={() => {
            setRetryOpen(false)
            setEvacKey((value) => value + 1)
          }}
        />
      )}
    </main>
  )
}
