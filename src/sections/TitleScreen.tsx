import { useState } from 'react'
import { BookOpenText, FolderOpen, MessageCircle, Sword, Tv } from 'lucide-react'
import SaveLoadModal from '../components/SaveLoadModal'
import WechatQrModal from '../components/WechatQrModal'
import { findLatestSave, listSaveSlots, type SaveData } from '../game/save'
import ShichengPage from '../ui/ShichengPage'
import type { ShichengCard } from '../ui/shichengData'
import { SOCIAL_LINKS, SOCIAL_READY } from '../lib/social'

interface Props {
  onStart: () => void
  onLoad: (data: SaveData) => void
  shichengUnlockedCardIds?: readonly ShichengCard['id'][]
}

export default function TitleScreen({
  onStart,
  onLoad,
  shichengUnlockedCardIds = [],
}: Props) {
  const [showLoad, setShowLoad] = useState(false)
  const [showShicheng, setShowShicheng] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const saveSlots = listSaveSlots()
  const hasSave = saveSlots.some((save) => save.status === 'ready')
  const hasStoredSave = saveSlots.some((save) => save.status !== 'empty')

  const handleLoad = (data: SaveData) => {
    setShowLoad(false)
    onLoad(data)
  }

  const quickContinue = () => {
    const latest = findLatestSave()
    if (latest) onLoad(latest)
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-qin-charcoal text-qin-parchment">
      <img
        src="./assets/title_keyart.webp"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.style.display = 'none'
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-qin-ink/40" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-qin-ink/25 via-qin-ink/55 to-qin-ink/65" />
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center [text-shadow:0_2px_8px_#000]">
        <div className="text-xs font-sans tracking-[0.4em] text-qin-bronze">前 230 — 前 221 · 战国末年</div>
        <img src="./assets/seal_qin.svg" alt="" className="size-12 opacity-70" aria-hidden="true" />
        <h1 className="font-serif-sc text-4xl font-bold tracking-[0.2em] sm:text-5xl md:text-6xl lg:text-7xl">秦灭六国</h1>
        <div className="font-sans tracking-[0.25em] text-qin-parchment-65">玩法 Demo · 序章《郑地伏杀》+ 第一章《新郑覆旗》</div>
        <div className="mt-2 max-w-md font-serif-sc text-sm leading-8 tracking-wide text-qin-parchment-65">
          郑国下狱，逐客令下。现代青年阿芒，在秦军秘密行动头领北芒的
          身体里醒来，与医者小满、剑士青翎结为三人小队——历史结局已定，
          你决定的，是方法、代价，和战争之后的路。
        </div>
        <button
          onClick={onStart}
          className="qin-btn mt-6 border border-qin-bronze-50 bg-qin-cinnabar px-10 py-4 font-sans text-lg tracking-[0.15em] hover:bg-qin-cinnabar-hover"
        >
          <Sword className="size-5" />
          奉令出发
        </button>
        {hasSave && (
          <button
            onClick={quickContinue}
            className="qin-btn border border-qin-bronze-35 bg-[#202226] px-8 py-3 font-sans tracking-[0.15em] hover:bg-qin-cinnabar-15"
          >
            <FolderOpen className="size-4 text-qin-bronze" />
            继续游戏
          </button>
        )}
        <div className="flex flex-wrap items-center justify-center gap-5">
          <button
            onClick={() => setShowLoad(true)}
            disabled={!hasStoredSave}
            className={`text-xs tracking-[0.3em] transition-colors ${
              hasStoredSave
                ? 'text-qin-parchment-50 hover:text-qin-bronze'
                : 'cursor-not-allowed text-qin-parchment-40'
            }`}
          >
            {hasSave ? '选择存档载入…' : hasStoredSave ? '处理旧存档…' : '尚无存档'}
          </button>
          <button
            onClick={() => setShowShicheng(true)}
            className="flex items-center gap-2 text-xs tracking-[0.3em] text-qin-parchment-50 transition-colors hover:text-qin-bronze"
          >
            <BookOpenText className="size-4" />
            史乘
          </button>
        </div>
        <div className="mt-8 text-xs text-qin-parchment-25">三人固定小队 · 无等级 · 无装备 · 目标不止全歼</div>
        <div className="mt-2 text-xs text-qin-parchment-25">本作剧情对部分历史事件的时间线作戏剧性合并</div>

        {SOCIAL_READY && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-xs tracking-[0.2em] text-qin-parchment-40">关注开发者 / 反馈 BUG</p>
            <div className="flex items-center gap-5">
              <button
                onClick={() => setShowQr(true)}
                className="flex items-center gap-1.5 text-sm tracking-[0.15em] text-qin-bronze transition-colors hover:text-qin-bronze-light"
              >
                <MessageCircle className="size-4" />
                加我微信
              </button>
              <a
                href={SOCIAL_LINKS.bilibili}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm tracking-[0.15em] text-qin-parchment-50 transition-colors hover:text-qin-bronze"
              >
                <Tv className="size-4" />
                B站
              </a>
            </div>
          </div>
        )}
      </div>

      {showLoad && (
        <SaveLoadModal
          mode="load"
          onClose={() => setShowLoad(false)}
          onLoad={handleLoad}
          onReset={() => {
            setShowLoad(false)
            onStart()
          }}
        />
      )}

      {showShicheng && (
        <ShichengPage
          unlockedCardIds={shichengUnlockedCardIds}
          onClose={() => setShowShicheng(false)}
        />
      )}

      {showQr && <WechatQrModal onClose={() => setShowQr(false)} />}
    </div>
  )
}
