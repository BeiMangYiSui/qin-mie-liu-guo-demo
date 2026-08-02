// 跳过剧情按钮：点击后跳过当前场景的全部对白，自动选第一个 choice 选项

import { useState } from 'react'
import { FastForward } from 'lucide-react'

interface Props {
  onSkip: () => void
  // 是否可用（例如 PinanScene 碎片都点过才能跳）
  disabled?: boolean
  // 自定义提示文字
  hint?: string
}

export default function SkipButton({ onSkip, disabled, hint }: Props) {
  const [showHint, setShowHint] = useState(false)
  const trigger = () => {
    if (disabled) return
    onSkip()
    setShowHint(true)
    window.setTimeout(() => setShowHint(false), 800)
  }
  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2 pointer-events-none">
      {showHint && (
        <div className="bg-[#202226] border border-qin-bronze-50 px-4 py-2 text-sm tracking-widest text-qin-bronze animate-[fadein_.2s_ease] pointer-events-auto">
          已跳过当前场景
        </div>
      )}
      <button
        onClick={trigger}
        disabled={disabled}
        className={`qin-btn pointer-events-auto px-5 py-2.5 border tracking-widest text-sm ${
          disabled
            ? 'border-qin-parchment-25 text-qin-parchment-25 cursor-not-allowed'
            : 'border-qin-bronze-50 text-qin-parchment-80 hover:bg-qin-cinnabar-15 hover:border-qin-bronze'
        }`}
        title={hint ?? '一键跳过当前场景所有对白（自动选择第一个选项）'}
      >
        <FastForward className="w-4 h-4" />
        跳过
      </button>
      {disabled && hint && (
        <div className="text-xs text-qin-parchment-25 tracking-wider pointer-events-auto">{hint}</div>
      )}
    </div>
  )
}
