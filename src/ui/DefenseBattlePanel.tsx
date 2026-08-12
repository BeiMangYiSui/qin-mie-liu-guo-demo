import { useEffect, useMemo, useRef, useState } from 'react'
import { HeartPulse, Shield, Swords } from 'lucide-react'
import type { StoryFlags } from '../game/save'
import { playSfxFile, stopSfxFile, unlockSfxFile } from '../game/audio'
import {
  EVAC_BATTLE_CONFIG,
  createDefenseBattle,
  currentDefenseThreat,
  defenseOutcome,
  previewDefenseAction,
  resolveDefenseRound,
  type DefenseAction,
  type DefenseBattleConfig,
} from '../game/defenseBattle'

export interface DefenseBattlePanelProps {
  config?: DefenseBattleConfig
  onFlagsChange: (patch: Pick<StoryFlags, 'evac_survival'>) => void
  onFinish?: () => void
  onDefeat?: () => void
}

const ACTIONS: readonly {
  id: DefenseAction
  label: string
  desc: string
  icon: typeof Shield
}[] = [
  { id: 'hold', label: '结阵守线', desc: '克制正面冲阵；连续结阵会疲惫', icon: Shield },
  { id: 'heal', label: '抢救伤者', desc: '克制担架断裂；同时抢回少量状态', icon: HeartPulse },
  { id: 'strike', label: '反击乱兵', desc: '克制突入头目；对齐整冲阵效果有限', icon: Swords },
]

export default function DefenseBattlePanel({
  config = EVAC_BATTLE_CONFIG,
  onFlagsChange,
  onFinish,
  onDefeat,
}: DefenseBattlePanelProps) {
  const randomBattle = () => createDefenseBattle(
    config,
    Math.floor(Math.random() * Math.max(1, config.wavePlans.length)),
  )
  const [battle, setBattle] = useState(randomBattle)
  const resolvedRef = useRef(false)
  const audioRetriedRef = useRef(false)

  useEffect(() => {
    if (config.id !== 'c7_evac') return
    playSfxFile('sfx/city_siege.mp3', { loop: true, volume: 0.14, channel: 'environment' })
    return () => stopSfxFile('environment')
  }, [config.id])

  useEffect(() => {
    if (battle.phase === 'won' && !resolvedRef.current) {
      resolvedRef.current = true
      onFlagsChange({ evac_survival: defenseOutcome(battle, config) })
      onFinish?.()
    }
    if (battle.phase === 'lost' && !resolvedRef.current) {
      resolvedRef.current = true
      onDefeat?.()
    }
  }, [battle, config, onDefeat, onFinish, onFlagsChange])

  const enemyCount = useMemo(
    () => config.waveEnemyCount[Math.min(battle.round - 1, config.waveEnemyCount.length - 1)] ?? 1,
    [battle.round, config.waveEnemyCount],
  )

  const act = (action: DefenseAction) => {
    // 场景切换后的自动播放若被浏览器拦截，第一次玩家出招时在明确交互中重试。
    if (config.id === 'c7_evac' && !audioRetriedRef.current) {
      audioRetriedRef.current = true
      unlockSfxFile('environment')
    }
    setBattle((current) => resolveDefenseRound(current, config, action))
  }

  const reset = () => {
    resolvedRef.current = false
    setBattle(randomBattle())
  }

  const hpPercent = Math.max(0, Math.min(100, battle.targetHp / config.maxTargetHp * 100))
  const survival = battle.phase === 'won' ? defenseOutcome(battle, config) : null
  const threat = currentDefenseThreat(battle)

  return (
    <section
      className="mx-auto w-full max-w-5xl overflow-hidden border border-qin-bronze-35 bg-[#111317]/95 text-qin-parchment shadow-2xl"
      data-scene-id={config.id}
      aria-labelledby={`${config.id}-title`}
    >
      <div
        className="relative min-h-64 bg-cover bg-center p-5 sm:p-8"
        style={{
          backgroundImage:
            "linear-gradient(rgba(13,14,17,.32),rgba(13,14,17,.9)),url('./assets/bg_yiying.webp')",
        }}
      >
        <p className="text-[0.65rem] tracking-[0.45em] text-qin-bronze/75">防守战 · 局势应对</p>
        <h2 id={`${config.id}-title`} className="mt-3 text-3xl tracking-[0.2em]">{config.title}</h2>
        <p className="mt-3 text-sm tracking-[0.12em] text-qin-parchment-50">{config.objective}</p>

        <div className="mt-8 flex min-h-28 items-end gap-2">
          {Array.from({ length: enemyCount }, (_, index) => (
            <img
              key={`${battle.round}-${index}`}
              src={config.enemySprite}
              alt=""
              className="h-24 w-24 object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,.55)] sm:h-32 sm:w-32"
            />
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-8">
        {battle.phase === 'player' && (
          <div className="mb-5 border-l-2 border-[#C4746A] bg-qin-cinnabar-15 px-4 py-3">
            <span className="text-[0.65rem] tracking-[0.25em] text-[#C98B7E]">本轮危机</span>
            <strong className="ml-3 tracking-[0.14em] text-qin-parchment">{threat.label}</strong>
            <p className="mt-2 text-xs leading-6 text-qin-parchment-50">{threat.detail}</p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="tracking-[0.16em] text-qin-bronze-light">{config.targetName}</span>
              <span className="tabular-nums text-qin-parchment-50">
                {battle.targetHp} / {config.maxTargetHp}
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden border border-qin-bronze-25 bg-black/30">
              <div
                className="h-full bg-gradient-to-r from-qin-cinnabar to-qin-bronze transition-[width] duration-500"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
          <div className="border border-qin-parchment-10 bg-black/15 px-5 py-3 text-center">
            <span className="block text-xs tracking-[0.16em] text-qin-parchment-25">回合</span>
            <strong className="mt-1 block text-xl text-qin-bronze-light">
              {Math.min(battle.round, config.rounds)} / {config.rounds}
            </strong>
          </div>
        </div>

        {battle.phase === 'player' ? (
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {ACTIONS.map((action) => {
              const Icon = action.icon
              const preview = previewDefenseAction(battle, config, action.id)
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => act(action.id)}
                  className="border border-qin-bronze-25 bg-[#17191d] p-4 text-left transition-all hover:-translate-y-1 hover:border-qin-bronze-65"
                >
                  <span className="flex items-center gap-3 text-qin-bronze-light">
                    <Icon className="size-5" aria-hidden="true" />
                    <strong className="tracking-[0.14em]">{action.label}</strong>
                  </span>
                  <span className="mt-3 block text-xs leading-6 text-qin-parchment-40">{action.desc}</span>
                  <span className={`mt-3 block border-t pt-2 text-[0.68rem] ${preview.isCounter ? 'border-qin-bronze-light/25 text-qin-bronze-light' : 'border-qin-parchment-10 text-qin-parchment-25'}`}>
                    预计受损 {preview.damage}
                    {preview.healed > 0 ? ` · 抢回 ${preview.healed}` : ''}
                    {preview.fatigued ? ' · 连用疲惫' : ''}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="mt-6 border border-qin-bronze-25 bg-black/15 p-5 text-center">
            <strong className={battle.phase === 'won' ? 'text-qin-bronze-light' : 'text-[#C98B7E]'}>
              {battle.phase === 'won'
                ? `撤离完成 · 存活率 ${survival === 'high' ? '高' : '低'}`
                : '防线失守'}
            </strong>
            <p className="mt-3 text-sm text-qin-parchment-40">
              {battle.log.at(-1)}
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 border border-qin-bronze-35 px-6 py-2 text-sm tracking-[0.2em] text-qin-bronze-light"
            >
              重新演练
            </button>
          </div>
        )}

        <div className="mt-6 max-h-28 overflow-y-auto border-t border-qin-parchment-10 pt-4 text-xs leading-6 text-qin-parchment-25">
          {battle.log.slice(-4).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
        </div>
      </div>
    </section>
  )
}
