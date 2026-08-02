import { X } from 'lucide-react'
import { SOCIAL_LINKS } from '../lib/social'

interface Props {
  onClose: () => void
  /** 'wechat' | 'telegram' */
  type?: 'wechat' | 'telegram'
}

export default function WechatQrModal({ onClose, type = 'wechat' }: Props) {
  const isTelegram = type === 'telegram'
  const qrSrc = isTelegram ? SOCIAL_LINKS.telegramQr : SOCIAL_LINKS.wechatQr
  const label = isTelegram ? 'Telegram · @BEIMANGYISUI' : '微信扫码 · 加开发者好友'
  const altText = isTelegram ? 'Telegram 二维码' : '微信二维码'

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
        <p className="text-sm tracking-[0.25em] text-qin-bronze">{label}</p>
        <img
          src={qrSrc}
          alt={altText}
          className="size-56 border border-qin-parchment-10 object-contain"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
        {isTelegram && (
          <a
            href={SOCIAL_LINKS.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-qin-bronze underline underline-offset-2 transition-colors hover:text-qin-parchment"
          >
            或直接点击 t.me/BEIMANGYISUI
          </a>
        )}
        <p className="text-xs text-qin-parchment-40">手机长按图片可识别二维码</p>
      </div>
    </div>
  )
}
