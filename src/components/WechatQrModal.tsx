import { X } from 'lucide-react'
import { SOCIAL_LINKS } from '../lib/social'

interface Props {
  onClose: () => void
}

export default function WechatQrModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 px-4"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center gap-4 border border-qin-bronze-25 bg-qin-charcoal p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-qin-parchment-40 transition-colors hover:text-qin-bronze"
          aria-label="关闭"
        >
          <X className="size-5" />
        </button>
        <p className="text-sm tracking-[0.25em] text-qin-bronze">微信扫码 · 加开发者好友</p>
        <img
          src={SOCIAL_LINKS.wechatQr}
          alt="微信二维码"
          className="size-56 border border-qin-parchment-10 object-contain"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
        <p className="text-xs text-qin-parchment-40">手机长按图片可识别二维码</p>
      </div>
    </div>
  )
}
