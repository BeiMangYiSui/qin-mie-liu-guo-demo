import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { DialogueLine, LineType, StoryScene as Scene } from '../game/story'
import type { StoryFlags } from '../game/save'
import { playSfxFile, playVoiceLine, stopVoice, unlockAudio, unlockBgm } from '../game/audio'
import { MEDIA_CDN } from '../lib/cdn'
import SkipButton from '../components/SkipButton'
import S7ShotCard, { resolveS7Shot } from '../ui/S7ShotCard'
import {
  flagPatchForChoice,
  selectLinesByFlags,
  type ChoiceFlagBinding,
  type FlagLineVariant,
} from '../ui/flags'

const SPEAKER_COLOR: Record<string, string> = {
  旁白: '#8A8578',
  阿芒: '#B58A3D',
  北芒: '#B58A3D',
  小满: '#9DB89A',
  青翎: '#7FA3C4',
  越女: '#7FA3C4',
  孟甲: '#C4A484',
  公孙钺: '#C4746A',
  郑国: '#7FA3A0',
  秦王: '#C4746A',
  姚贾: '#A8A29E',
  韩王: '#C4A484',
  韩王安: '#C4A484',
  小吏: '#A8A29E',
  狱卒: '#A8A29E',
  军吏: '#A8A29E',
  商队老执事: '#A8A29E',
  农家老翁: '#A8A29E',
  守谷口老卒: '#C4A484',
  秦卒: '#C4A484',
  韩地伤兵: '#A8A29E',
  韩老伯: '#A8A29E',
  韩老媪: '#A8A29E',
}

const SPEAKER_AVATAR: Record<string, string> = {
  阿芒: `${MEDIA_CDN}assets/avatar_beimang.webp`,
  北芒: `${MEDIA_CDN}assets/avatar_beimang.webp`,
  小满: `${MEDIA_CDN}assets/avatar_xiaoman.webp`,
  青翎: `${MEDIA_CDN}assets/avatar_qingling.webp`,
  越女: `${MEDIA_CDN}assets/avatar_qingling.webp`,
  公孙钺: `${MEDIA_CDN}assets/npc_gongsunyue.webp`,
  郑国: `${MEDIA_CDN}assets/npc_zhengguo.webp`,
  孟甲: `${MEDIA_CDN}assets/npc_mengjia.webp`,
  秦王: `${MEDIA_CDN}assets/npc_qinwang.webp`,
  姚贾: `${MEDIA_CDN}assets/npc_yaojia.webp`,
  韩王: `${MEDIA_CDN}assets/npc_hanwang.webp`,
  韩王安: `${MEDIA_CDN}assets/npc_hanwang.webp`,
  韩老伯: `${MEDIA_CDN}assets/npc_hanlaobo.webp`,
  // —— 缺图暂代（见交付报告缺图清单）——
  韩老媪: `${MEDIA_CDN}assets/npc_hanlaomu.webp`,
  农家老翁: `${MEDIA_CDN}assets/npc_hanlaomu.webp`,
  小吏: `${MEDIA_CDN}assets/npc_shizu.webp`,
  狱卒: `${MEDIA_CDN}assets/npc_shizu.webp`,
  军吏: `${MEDIA_CDN}assets/npc_shizu.webp`,
  商队老执事: `${MEDIA_CDN}assets/npc_shangdui.webp`,
  守谷口老卒: `${MEDIA_CDN}assets/npc_shizu.webp`,
  秦卒: `${MEDIA_CDN}assets/npc_shizu.webp`,
  韩地伤兵: `${MEDIA_CDN}assets/npc_shizu.webp`,
}

// 演出轨不配音（配音台本轨约定）；字幕轨尝试查找——有条目则播（如 S7 三个镜头，通览标【旁白】），无条目静默
const VOICE_SKIP_TYPES: ReadonlySet<LineType> = new Set(['stage'])

export default function StoryScene({
  scene,
  flags = {},
  lineVariants,
  choiceFlag,
  onFlagsChange,
  onDone,
  onSkipAvailable,
  completeOnLastLine = false,
}: {
  scene: Scene
  flags?: StoryFlags
  lineVariants?: readonly FlagLineVariant<DialogueLine>[]
  choiceFlag?: ChoiceFlagBinding
  onFlagsChange?: (patch: Partial<StoryFlags>) => void
  onDone: (tag: string | null) => void
  onSkipAvailable?: boolean
  /** 点击正在显示的最后一句时直接结束场景，不再多留一个空白“继续”状态。 */
  completeOnLastLine?: boolean
}) {
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<null | { tag: string; lines: number }>(null)
  const [respIdx, setRespIdx] = useState(0)
  const [failedS7Shot, setFailedS7Shot] = useState<string | null>(null)

  const lines = selectLinesByFlags(scene.lines, lineVariants ?? scene.lineVariants, flags)
  const atEndOfMain = idx >= lines.length
  const choice = scene.choice
  const chosenOpt = chosen && choice ? choice.options.find((o) => o.tag === chosen.tag)! : null
  // 选项回应 + 分支共用收尾（choice.after）按序播放
  const postChoiceLines: DialogueLine[] = chosenOpt ? [...chosenOpt.response, ...(choice?.after ?? [])] : []

  const recordChoiceFlag = (tag: string) => {
    const patch = flagPatchForChoice(choiceFlag, tag)
    if (Object.keys(patch).length > 0) onFlagsChange?.(patch)
  }

  // 配音触发：监听 scene.id / idx / respIdx 变化，统一播放当前 active 行
  useEffect(() => {
    let line: DialogueLine | null = null

    if (!atEndOfMain) {
      line = lines[idx]
    } else if (chosen && respIdx < postChoiceLines.length) {
      line = postChoiceLines[respIdx]
    }

    if (line && !VOICE_SKIP_TYPES.has(line.type)) {
      void playVoiceLine(scene.id, line.speaker, line.text)
    } else {
      stopVoice()
    }
    return stopVoice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atEndOfMain, choice, chosen, idx, lines, respIdx, scene.id])

  const advance = () => {
    unlockAudio()
    unlockBgm()
    // 剧情推进点击音：丝滑瓷音（替代默认 select）
    playSfxFile('sfx/silk_click.mp3', { volume: 0.7 })
    if (!atEndOfMain) {
      if (completeOnLastLine && idx === lines.length - 1 && !choice) {
        stopVoice()
        onDone(null)
        return
      }
      setIdx(idx + 1)
      return
    }
    if (choice && !chosen) return
    if (chosen && respIdx < postChoiceLines.length) {
      setRespIdx(respIdx + 1)
      return
    }
    stopVoice()
    onDone(chosen?.tag ?? null)
  }

  // 有选择时只跳到选择点，绝不替玩家自动落子；已选分支则跳过余下回应。
  const skip = () => {
    stopVoice()
    if (choice && !chosen) {
      setIdx(lines.length)
      return
    }
    onDone(chosen?.tag ?? null)
  }

  const visible = lines.slice(0, idx)
  const current = !atEndOfMain ? lines[idx] : null
  const respVisible = postChoiceLines.slice(0, respIdx)
  const respCurrent = chosen && respIdx < postChoiceLines.length ? postChoiceLines[respIdx] : null
  const background = scene.bg
  const s7Shot = current ? resolveS7Shot(scene.id, current) : null
  const showS7Shot = Boolean(s7Shot && failedS7Shot !== s7Shot.src)

  useEffect(() => {
    setFailedS7Shot(null)
  }, [scene.id, s7Shot?.src])

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden bg-qin-charcoal text-qin-parchment cursor-pointer select-none"
      onClick={advance}
    >
      {background && (
        <img
          src={background}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-qin-charcoal via-qin-charcoal/80 to-qin-charcoal/20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-qin-charcoal/80 to-transparent" />
      <div
        data-testid="story-text-mask"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[46vh] bg-gradient-to-b from-transparent via-[#10111466] to-[#101114d9]"
      />

      <header className="relative z-10 px-6 py-4 pr-16 border-b border-qin-bronze-25 flex items-baseline gap-4">
        <span className="text-qin-bronze tracking-[0.3em] text-sm shrink-0">{scene.chapter}</span>
        <span className="text-qin-parchment-50 text-sm truncate min-w-0">{scene.place}</span>
      </header>

      {s7Shot && showS7Shot && (
        <S7ShotCard
          shot={s7Shot}
          text={current?.text ?? ''}
          onImageError={() => setFailedS7Shot(s7Shot.src)}
        />
      )}


      <main
        className={`relative z-10 flex-1 flex flex-col justify-end max-w-3xl w-full mx-auto px-6 pb-10 gap-3 transition-opacity duration-300 ${
          showS7Shot ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        {visible.slice(-4).map((l, i) => (
          <Line key={i} line={l} dim />
        ))}
        {respVisible.map((l, i) => (
          <Line key={`r${i}`} line={l} dim />
        ))}
        {current && <Line line={current} active />}
        {respCurrent && <Line line={respCurrent} active />}

        {atEndOfMain && choice && !chosen && (
          <div className="mt-6 border border-qin-bronze-35 bg-[#202226] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-qin-bronze mb-4 tracking-wider">{choice.prompt}</div>
            <div className="flex flex-col gap-3">
              {choice.options.map((o) => (
                <button
                  key={o.tag}
                  onClick={() => {
                    recordChoiceFlag(o.tag)
                    setChosen({ tag: o.tag, lines: o.response.length })
                    setRespIdx(0)
                  }}
                  className="qin-btn text-left px-5 py-4 border border-qin-parchment-10 hover:border-qin-bronze hover:bg-qin-cinnabar-15"
                >
                  <div className="text-qin-parchment">{o.label}</div>
                  <div className="text-sm text-qin-parchment-50 mt-1">{o.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {(current || respCurrent || (atEndOfMain && (!choice || chosen))) && (
          <div className="flex justify-end items-center gap-1 text-qin-parchment-40 text-sm mt-2 animate-pulse">
            继续 <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </main>

      {onSkipAvailable && <SkipButton onSkip={skip} />}
    </div>
  )
}

function Line({ line, dim, active }: { line: DialogueLine; dim?: boolean; active?: boolean }) {
  const { type, speaker, text } = line
  const [imgFailed, setImgFailed] = useState(false)
  const [useFallback, setUseFallback] = useState(false)

  // 字幕轨：整行居中，无说话人栏
  if (type === 'caption') {
    return (
      <div
        className={`w-full text-center tracking-[0.2em] text-qin-bronze leading-8 ${
          dim ? 'opacity-40' : ''
        } ${active ? 'animate-[fadein_.3s_ease]' : ''}`}
      >
        {text}
      </div>
    )
  }

  const color = SPEAKER_COLOR[speaker] ?? '#E9E5DA'
  const avatar = SPEAKER_AVATAR[speaker]
  // webp 失败时回退到 png portrait（仅主角有 png）
  const pngFallback = avatar?.replace('avatar_', 'portrait_').replace('.webp', '.png')
  const textClass =
    type === 'stage'
      ? 'italic text-[#8A8578]'
      : type === 'inner'
        ? 'italic text-qin-parchment-80'
        : 'text-qin-parchment-80'

  const renderAvatar = () => {
    if (!avatar) return null
    // 全部失败：显示彩色占位符
    if (imgFailed) {
      return (
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 text-lg font-bold"
          style={{ borderColor: color, color, backgroundColor: `${color}22` }}
        >
          {speaker[0]}
        </div>
      )
    }
    const src = useFallback && pngFallback ? pngFallback : avatar
    return (
      <img
        src={src}
        alt=""
        loading="eager"
        className="block h-12 w-12 shrink-0 rounded-md border-2 object-cover object-top"
        style={{ borderColor: color }}
        onError={() => {
          if (!useFallback && pngFallback) {
            setUseFallback(true)
          } else {
            setImgFailed(true)
          }
        }}
      />
    )
  }

  return (
    <div className={`flex gap-3 leading-8 ${dim ? 'opacity-40' : ''} ${active ? 'animate-[fadein_.3s_ease]' : ''}`}>
      {renderAvatar()}
      <span className="shrink-0 w-20 text-right font-sans text-sm font-bold tracking-[0.1em]" style={{ color }}>
        {speaker}
      </span>
      <span className={`font-serif-sc tracking-[0.05em] ${textClass}`}>{text}</span>
    </div>
  )
}
