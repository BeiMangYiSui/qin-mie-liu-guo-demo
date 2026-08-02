import { RotateCcw } from 'lucide-react'
import {
  BATTLE_DEFEAT_PLACEHOLDERS,
  type RetryBattleId,
} from '../game/battleRetry'

export interface BattleRetryOverlayProps {
  battleId: RetryBattleId
  onRetry: () => void
  buttonLabel?: string
}

export default function BattleRetryOverlay({
  battleId,
  onRetry,
  buttonLabel = '再守一次',
}: BattleRetryOverlayProps) {
  return (
    <section
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black px-6 text-qin-parchment"
      role="dialog"
      aria-modal="true"
      aria-labelledby="battle-defeat-title"
    >
      <div className="max-w-xl text-center">
        <p className="text-[0.65rem] tracking-[0.5em] text-[#C4746A]/65">战败回卷</p>
        <h2 id="battle-defeat-title" className="sr-only">战斗失败</h2>
        <p className="mt-6 text-xl leading-10 tracking-[0.12em] text-qin-parchment-65">
          {BATTLE_DEFEAT_PLACEHOLDERS[battleId]}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="qin-btn mx-auto mt-10 border border-qin-bronze-50 px-8 py-3 tracking-[0.25em] text-qin-bronze-light hover:bg-qin-bronze-10"
        >
          <RotateCcw className="size-5" aria-hidden="true" />
          {buttonLabel}
        </button>
      </div>
    </section>
  )
}
