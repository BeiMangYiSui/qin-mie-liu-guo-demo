import { X } from 'lucide-react'
import { SOCIAL_LINKS } from '../lib/social'

/**
 * 玩家反馈入口：直接展示开发者联系方式
 * 加好友 / 拉群反馈，比邮件表单更直接
 */
export default function FeedbackModal({ onClose }: { onClose: () => void }) {
  const telegramHandle = SOCIAL_LINKS.telegram.replace('https://t.me/', '@')

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

        <h2 className="mb-1 text-lg tracking-[0.2em] text-qin-bronze">联系作者</h2>
        <p className="mb-5 text-xs tracking-wider text-qin-parchment-40">
          玩得开心？想吐槽？想提建议？加我吧
        </p>

        <div className="mb-4 flex items-start gap-3 border border-qin-parchment-15 bg-[#0f1014] p-4">
          <div className="size-10 shrink-0 bg-[#07c160]" />
          <div className="min-w-0">
            <div className="text-sm font-medium tracking-wider text-qin-parchment">微信</div>
            <div className="mt-1 text-sm tracking-wider text-qin-bronze">
              标题页「微信」按钮扫码
            </div>
            <div className="mt-1 text-xs tracking-wider text-qin-parchment-40">
              或直接搜：{SOCIAL_LINKS.wechatId}
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-start gap-3 border border-qin-parchment-15 bg-[#0f1014] p-4">
          <div className="size-10 shrink-0 bg-[#0088cc]" />
          <div className="min-w-0">
            <div className="text-sm font-medium tracking-wider text-qin-parchment">Telegram</div>
            <div className="mt-1 text-sm tracking-wider text-qin-bronze">
              {telegramHandle}
            </div>
            <a
              href={SOCIAL_LINKS.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs tracking-wider text-qin-parchment-50 underline-offset-4 hover:text-qin-bronze hover:underline"
            >
              直接打开 →
            </a>
          </div>
        </div>

        <p className="mt-5 text-center text-xs tracking-wider text-qin-parchment-40">
          留言前最好说一声「秦灭六国玩家」
        </p>
      </div>
    </div>
  )
}