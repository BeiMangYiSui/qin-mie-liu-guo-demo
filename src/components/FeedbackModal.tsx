import { useState } from 'react'
import { X, Send } from 'lucide-react'

/**
 * 玩家反馈表单弹窗
 * 提交方式：生成 mailto 链接，打开玩家邮箱客户端发送
 * 无需后端，0 成本。后续可改为 Formspree / Tally 等专业表单服务。
 */
export type FeedbackType = 'bug' | 'suggestion' | 'story' | 'other'

const TYPE_LABEL: Record<FeedbackType, string> = {
  bug: 'BUG 反馈',
  suggestion: '玩法建议',
  story: '剧情意见',
  other: '其他',
}

const RECIPIENT_EMAIL = 'shixiaofei_sunny@163.com'

export default function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<FeedbackType>('bug')
  const [content, setContent] = useState('')
  const [contact, setContact] = useState('')

  const submit = () => {
    if (!content.trim()) {
      alert('请填写反馈内容')
      return
    }
    const subject = `【秦灭六国 Demo 玩家反馈-${TYPE_LABEL[type]}】`
    const body = [
      `反馈类型：${TYPE_LABEL[type]}`,
      `联系方式：${contact || '（未填写）'}`,
      '',
      '----- 反馈内容 -----',
      content,
      '',
      '-----',
      `设备：${navigator.userAgent}`,
      `时间：${new Date().toLocaleString('zh-CN')}`,
    ].join('\n')
    window.location.href = `mailto:${RECIPIENT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md border border-qin-bronze-35 bg-[#1a1b1f] p-6 text-qin-parchment shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-qin-parchment-50 hover:text-qin-bronze"
          aria-label="关闭"
        >
          <X className="size-5" />
        </button>

        <h2 className="mb-1 text-lg tracking-[0.2em] text-qin-bronze">反馈</h2>
        <p className="mb-5 text-xs tracking-wider text-qin-parchment-40">
          你的反馈会直接发到作者邮箱
        </p>

        <div className="mb-4">
          <label className="mb-2 block text-xs tracking-[0.15em] text-qin-parchment-50">
            反馈类型
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(TYPE_LABEL) as FeedbackType[]).map((k) => (
              <button
                key={k}
                onClick={() => setType(k)}
                className={`border px-3 py-2 text-sm tracking-wider transition-colors ${
                  type === k
                    ? 'border-qin-bronze bg-qin-bronze-15 text-qin-bronze'
                    : 'border-qin-parchment-15 text-qin-parchment-60 hover:border-qin-bronze-35'
                }`}
              >
                {TYPE_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs tracking-[0.15em] text-qin-parchment-50">
            反馈内容 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="说说你的想法…比如剧情、战斗、操作、UI…"
            className="w-full resize-none border border-qin-parchment-15 bg-[#0f1014] px-3 py-2 text-sm tracking-wider text-qin-parchment placeholder:text-qin-parchment-25 focus:border-qin-bronze-35 focus:outline-none"
          />
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-xs tracking-[0.15em] text-qin-parchment-50">
            联系方式 <span className="text-qin-parchment-25">（选填）</span>
          </label>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="微信 / QQ / 邮箱，方便回你"
            className="w-full border border-qin-parchment-15 bg-[#0f1014] px-3 py-2 text-sm tracking-wider text-qin-parchment placeholder:text-qin-parchment-25 focus:border-qin-bronze-35 focus:outline-none"
          />
        </div>

        <button
          onClick={submit}
          className="flex w-full items-center justify-center gap-2 border border-qin-bronze bg-qin-bronze-15 px-5 py-3 text-sm tracking-[0.2em] text-qin-bronze transition-colors hover:bg-qin-bronze-25"
        >
          <Send className="size-4" />
          发送反馈
        </button>
      </div>
    </div>
  )
}