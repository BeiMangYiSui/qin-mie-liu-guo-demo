// 游戏中右上角菜单按钮 + 弹层（含保存 / 读取 / 史乘 / 重玩）

import { useState } from 'react'
import { BookOpenText, FolderOpen, Menu, RotateCcw, Save, X } from 'lucide-react'
import SaveLoadModal from './SaveLoadModal'
import type { SaveData, SaveDraftData, Stage } from '../game/save'
import ShichengPage from '../ui/ShichengPage'
import type { ShichengCard } from '../ui/shichengData'

interface Props {
  stage: Stage
  draftData: SaveDraftData
  onLoad: (data: SaveData) => void
  onRestart: () => void
  shichengUnlockedCardIds?: readonly ShichengCard['id'][]
  hide?: boolean
}

type Mode = 'closed' | 'panel' | 'save' | 'load' | 'shicheng'

export default function GameMenu({
  stage,
  draftData,
  onLoad,
  onRestart,
  shichengUnlockedCardIds = [],
  hide,
}: Props) {
  const [mode, setMode] = useState<Mode>('closed')

  if (hide) return null

  return (
    <>
      <button
        onClick={(event) => {
          event.stopPropagation()
          setMode('panel')
        }}
        className="fixed right-14 top-3 z-50 p-2 text-qin-parchment-65 transition-colors hover:text-qin-bronze"
        title="菜单"
      >
        <Menu className="size-5" />
      </button>

      {mode === 'panel' && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#10111488] p-6 backdrop-blur-sm"
          onClick={() => setMode('closed')}
        >
          <div
            className="w-full max-w-md border border-qin-bronze-50 bg-qin-charcoal p-8 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl tracking-[0.3em] text-qin-bronze">菜单</h2>
              <button
                onClick={() => setMode('closed')}
                className="p-1 text-qin-parchment-65 transition-colors hover:text-qin-bronze"
                title="关闭"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setMode('save')}
                className="qin-btn w-full border border-qin-bronze-50 px-6 py-4 hover:bg-qin-cinnabar-15"
              >
                <Save className="size-5 text-qin-bronze" />
                <span className="tracking-widest">保存进度</span>
              </button>
              <button
                onClick={() => setMode('load')}
                className="qin-btn w-full border border-qin-bronze-50 px-6 py-4 hover:bg-qin-cinnabar-15"
              >
                <FolderOpen className="size-5 text-qin-bronze" />
                <span className="tracking-widest">读取进度</span>
              </button>
              <button
                onClick={() => setMode('shicheng')}
                className="qin-btn w-full border border-qin-bronze-50 px-6 py-4 hover:bg-qin-cinnabar-15"
              >
                <BookOpenText className="size-5 text-qin-bronze" />
                <span className="tracking-widest">史乘</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm('重新开始？当前未保存进度将丢失。')) {
                    onRestart()
                    setMode('closed')
                  }
                }}
                className="qin-btn w-full border border-[#C4746A55] px-6 py-4 text-qin-parchment-80 hover:bg-[#C4746A22]"
              >
                <RotateCcw className="size-5 text-[#C4746A]" />
                <span className="tracking-widest">重玩</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'save' && (
        <SaveLoadModal
          mode="save"
          currentStage={stage}
          draftData={draftData}
          onClose={() => setMode('closed')}
        />
      )}

      {mode === 'load' && (
        <SaveLoadModal
          mode="load"
          onClose={() => setMode('closed')}
          onLoad={(data) => {
            onLoad(data)
            setMode('closed')
          }}
          onReset={() => {
            onRestart()
            setMode('closed')
          }}
        />
      )}

      {mode === 'shicheng' && (
        <ShichengPage
          unlockedCardIds={shichengUnlockedCardIds}
          onClose={() => setMode('closed')}
        />
      )}
    </>
  )
}
