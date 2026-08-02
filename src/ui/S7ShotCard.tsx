import { ChevronRight } from 'lucide-react'
import type { DialogueLine } from '../game/story'

export interface S7Shot {
  id: 'tongfu' | 'gaore' | 'mengye'
  src: string
  alt: string
}

const S7_SHOTS_BY_TEXT: Readonly<Record<string, S7Shot>> = {
  '三个镜头——': {
    id: 'tongfu',
    src: 'https://stats.puck-muling.top/game/assets/shot_tongfu.webp',
    alt: '博物馆展柜中的鸟羽纹铜符',
  },
  '一枚鸟羽纹的铜符。': {
    id: 'tongfu',
    src: 'https://stats.puck-muling.top/game/assets/shot_tongfu.webp',
    alt: '博物馆展柜中的鸟羽纹铜符',
  },
  '一场失控的高热。': {
    id: 'gaore',
    src: 'https://stats.puck-muling.top/game/assets/shot_gaore.webp',
    alt: '暖红虚焦中的高热病榻意象',
  },
  '梦里有人喊：北芒尉。': {
    id: 'mengye',
    src: 'https://stats.puck-muling.top/game/assets/shot_mengye.webp',
    alt: '冷青雨夜山道上回望的人影',
  },
}

// eslint-disable-next-line react-refresh/only-export-components -- 剧情场景与镜头卡共享同一份镜头解析表
export function resolveS7Shot(sceneId: string, line: DialogueLine): S7Shot | null {
  if (sceneId !== 's7_xiandai') return null
  return S7_SHOTS_BY_TEXT[line.text] ?? null
}

export default function S7ShotCard({
  shot,
  text,
  onImageError,
}: {
  shot: S7Shot
  text: string
  onImageError: () => void
}) {
  return (
    <div
      data-testid="s7-shot-card"
      data-shot={shot.id}
      className="pointer-events-none absolute inset-0 z-[20] overflow-hidden animate-[fadein_.35s_ease]"
    >
      <img
        src={shot.src}
        alt={shot.alt}
        className="absolute inset-0 h-full w-full object-cover"
        onError={onImageError}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#10111433] via-transparent to-[#10111466]" />
      <div className="absolute inset-x-0 bottom-0 h-[46vh] bg-gradient-to-b from-transparent via-[#10111477] to-[#101114ed]" />
      <div className="absolute inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 pb-10">
        <div
          data-testid="s7-shot-text"
          className="relative z-20 border-t border-qin-bronze-50 bg-[#101114cc] px-8 py-5 text-center font-serif-sc text-3xl font-semibold leading-10 tracking-[0.16em] text-[#F3EFE4] [text-shadow:0_2px_12px_#000]"
        >
          {text}
        </div>
        <div className="flex items-center justify-end gap-1 text-sm text-qin-parchment-65 animate-pulse">
          继续 <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
