// 存档 / 读档 弹窗（标题页 + 游戏中菜单共用）

import { useEffect, useId, useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import {
  canSaveAt,
  deleteSave,
  deleteIncompatibleSaves,
  formatSavedAt,
  listSaveSlots,
  loadSave,
  slotKey,
  STAGE_LABELS,
  writeSave,
  type SaveData,
  type SaveDraftData,
  type SaveSlotState,
  type Stage,
} from '../game/save'

interface Props {
  mode: 'save' | 'load'
  // save 模式需要
  currentStage?: Stage
  draftData?: SaveDraftData
  // 通用
  onClose: () => void
  onLoad?: (data: SaveData) => void
  onReset?: () => void
  // 通知外层刷新（写入/删除后）
  onChange?: () => void
}

export default function SaveLoadModal({ mode, currentStage, draftData, onClose, onLoad, onReset, onChange }: Props) {
  const [saves, setSaves] = useState<SaveSlotState[]>(listSaveSlots())
  const [confirmOverwrite, setConfirmOverwrite] = useState<number | null>(null)
  const titleId = useId()
  const incompatibleSaves = saves.filter((save) => save.status === 'incompatible')
  const hasLegacySave = incompatibleSaves.some((save) => save.reason === 'legacy')

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const refresh = () => {
    setSaves(listSaveSlots())
    onChange?.()
  }

  const handleSave = (slot: number) => {
    if (!currentStage || !draftData) return
    if (!canSaveAt(currentStage)) {
      window.alert(`当前场景（${STAGE_LABELS[currentStage]}）不支持存档。请先完成当前阶段。`)
      return
    }
    if (saves[slot]?.status !== 'empty') {
      if (confirmOverwrite !== slot) {
        setConfirmOverwrite(slot)
        return
      }
    }
    writeSave(slot, { stage: currentStage, ...draftData })
    setConfirmOverwrite(null)
    refresh()
  }

  const handleLoad = (slot: number) => {
    const data = loadSave(slot)
    if (data && onLoad) onLoad(data)
    onClose()
  }

  const handleDelete = (slot: number) => {
    if (!window.confirm(`确认删除「${slotKey(slot)}」？此操作不可恢复。`)) return
    deleteSave(slot)
    refresh()
  }

  const handleReset = () => {
    if (!window.confirm('旧存档将被删除，并从头开始。确认重置？')) return
    deleteIncompatibleSaves()
    refresh()
    if (onReset) onReset()
    else onClose()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[#101114cc] px-3 py-4 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto border border-qin-bronze-50 bg-qin-charcoal p-5 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id={titleId} className="text-2xl tracking-[0.3em] text-qin-bronze">{mode === 'save' ? '保存进度' : '读取进度'}</h2>
          <button onClick={onClose} className="text-qin-parchment-65 hover:text-qin-bronze transition-colors p-1" title="关闭">
            <X className="w-5 h-5" />
          </button>
        </div>

        {incompatibleSaves.length > 0 && (
          <div
            role="alert"
            className="mb-5 border border-[#C4746A88] bg-[#C4746A14] p-4 text-sm leading-6 text-qin-parchment-80"
          >
            <div className="font-bold tracking-wider text-[#C4746A]">
              {hasLegacySave ? '剧情已更新，旧存档不兼容' : '存档版本不兼容'}
            </div>
            <div className="mt-1 text-qin-parchment-65">请重置旧进度后重新开始，当前版本不会载入这些存档。</div>
            <button
              onClick={handleReset}
              className="mt-3 border border-[#C4746A88] px-4 py-2 tracking-widest text-qin-parchment transition-colors hover:bg-[#C4746A22]"
            >
              重置重开
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {saves.map((s, slot) => {
            const isOverwriteConfirm = confirmOverwrite === slot
            const blocked = mode === 'save' && currentStage && !canSaveAt(currentStage)
            const data = s.status === 'ready' ? s.data : null
            return (
              <div
                key={slot}
                className={`relative border p-4 transition-colors ${
                  s.status === 'ready'
                    ? 'border-qin-bronze-50 bg-[#202226]'
                    : s.status === 'incompatible'
                      ? 'border-[#C4746A55] bg-[#241d1e]'
                      : 'border-qin-parchment-25 bg-qin-charcoal'
                }`}
              >
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-qin-bronze text-sm tracking-widest">{slotKey(slot)}</div>
                  {mode === 'save' && s.status !== 'empty' && (
                    <button
                      onClick={() => handleDelete(slot)}
                      className="text-qin-parchment-25 hover:text-[#C4746A] transition-colors p-1"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {data ? (
                  <>
                    <div className="text-qin-parchment-80 text-base mb-1">{STAGE_LABELS[data.stage] ?? data.stage}</div>
                    <div className="text-xs text-qin-parchment-50 mb-3">{formatSavedAt(data.savedAt)}</div>
                  </>
                ) : s.status === 'incompatible' ? (
                  <>
                    <div className="mb-1 text-base text-[#C4746A]">旧版存档</div>
                    <div className="mb-3 text-xs text-qin-parchment-50">
                      {s.savedAt ? formatSavedAt(s.savedAt) : '版本信息缺失'}
                    </div>
                  </>
                ) : (
                  <div className="text-qin-parchment-25 text-sm mb-3 py-2">— 空 —</div>
                )}

                {mode === 'save' ? (
                  blocked ? (
                    <button
                      disabled
                      className="w-full px-3 py-2 text-sm tracking-widest bg-[#202226] text-qin-parchment-25 cursor-not-allowed"
                    >
                      不可保存
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSave(slot)}
                      className={`w-full px-3 py-2 text-sm tracking-widest transition-colors ${
                        isOverwriteConfirm
                          ? 'bg-[#C4746A] hover:bg-[#d4887a] text-qin-charcoal'
                          : s.status !== 'empty'
                            ? 'bg-[#202226] hover:bg-qin-cinnabar border border-qin-bronze-50'
                            : 'bg-qin-cinnabar hover:bg-qin-cinnabar-hover'
                      }`}
                    >
                      {isOverwriteConfirm ? '再次点击确认覆盖' : s.status !== 'empty' ? '覆盖存档' : '保存到此槽'}
                    </button>
                  )
                ) : (
                  <button
                    disabled={!data}
                    onClick={() => handleLoad(slot)}
                    className={`w-full px-3 py-2 text-sm tracking-widest transition-colors ${
                      data
                        ? 'bg-qin-cinnabar hover:bg-qin-cinnabar-hover'
                        : 'bg-[#202226] text-qin-parchment-25 cursor-not-allowed'
                    }`}
                  >
                    {data ? '载入' : s.status === 'incompatible' ? '版本不兼容' : '空槽'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="text-xs text-qin-parchment-25 mt-6 text-center leading-6">
          {mode === 'save'
            ? '剧情场景可保存；战斗与过场不支持。覆盖存档需要二次确认。'
            : '选择任一非空存档载入，或按 Esc / 关闭窗口返回。'}
        </div>
      </div>
    </div>
  )
}
