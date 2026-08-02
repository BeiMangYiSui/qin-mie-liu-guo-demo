import { BookOpenText, LockKeyhole, X } from 'lucide-react'
import { SHICHENG_CARDS, type ShichengCard } from './shichengData'

export interface ShichengPageProps {
  unlockedCardIds: readonly ShichengCard['id'][]
  cards?: readonly ShichengCard[]
  onClose?: () => void
  title?: string
}

export default function ShichengPage({
  unlockedCardIds,
  cards = SHICHENG_CARDS,
  onClose,
  title = '史乘',
}: ShichengPageProps) {
  const unlocked = new Set(unlockedCardIds)

  return (
    <section
      className="fixed inset-0 z-[60] overflow-y-auto bg-[#0d0e11]/98 px-4 py-6 text-qin-parchment sm:px-8"
      aria-labelledby="shicheng-title"
    >
      <div className="mx-auto max-w-6xl">
        <header className="sticky top-0 z-10 border-b border-qin-bronze-35 bg-[#0d0e11]/95 pb-5 pt-2 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.65rem] tracking-[0.45em] text-qin-bronze-65">HISTORY / MEMORY</p>
              <h2 id="shicheng-title" className="mt-3 flex items-center gap-3 text-3xl tracking-[0.3em]">
                <BookOpenText className="size-7 text-qin-bronze" aria-hidden="true" />
                {title}
              </h2>
              <p className="mt-3 text-sm tracking-[0.12em] text-qin-parchment-40">
                已解锁 {unlocked.size} / {cards.length}
              </p>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-qin-parchment-50 transition-colors hover:text-qin-bronze-light"
                aria-label="关闭史乘"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </header>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {cards.map((card, index) => {
            const isUnlocked = unlocked.has(card.id)
            return (
              <article
                key={card.id}
                className={`relative min-h-72 overflow-hidden border p-6 sm:p-7 ${
                  isUnlocked
                    ? 'border-qin-bronze-35 bg-[#17181b]'
                    : 'border-qin-parchment-10 bg-[#121316]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs tracking-[0.25em] text-qin-bronze-65">
                    {card.chapter} · 卡 {index + 1}
                  </span>
                  {!isUnlocked && <LockKeyhole className="size-4 text-qin-parchment-25" aria-hidden="true" />}
                </div>
                <h3 className={`mt-4 text-2xl tracking-[0.2em] ${isUnlocked ? '' : 'text-qin-parchment-25'}`}>
                  {isUnlocked ? card.title : '未解锁'}
                </h3>

                {isUnlocked ? (
                  <div className="mt-7 grid gap-5">
                    <div className="border-l-2 border-qin-bronze-65 pl-4">
                      <h4 className="text-xs tracking-[0.25em] text-qin-bronze-light">史书大意</h4>
                      <p className="mt-2 text-sm leading-7 text-qin-parchment-65">{card.history}</p>
                    </div>
                    <div className="border-l-2 border-[#C4746A]/55 pl-4">
                      <h4 className="text-xs tracking-[0.25em] text-[#C98B7E]">你经历的</h4>
                      <p className="mt-2 text-sm leading-7 text-qin-parchment-65">{card.experienced}</p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-x-6 bottom-6 top-24 overflow-hidden border border-qin-parchment-10 bg-black/15">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(181,138,61,0.08),transparent_45%)]" />
                    <div className="absolute bottom-0 left-1/2 h-36 w-28 -translate-x-1/2 rounded-t-full bg-qin-parchment/[0.035] blur-[1px]" />
                    <p className="absolute inset-x-4 bottom-5 text-center text-xs tracking-[0.2em] text-qin-parchment-25">
                      随剧情解锁
                    </p>
                  </div>
                )}
              </article>
            )
          })}
        </div>

        <footer className="mt-10 border-t border-qin-bronze-25 py-6 text-center text-sm tracking-[0.14em] text-qin-parchment-40">
          本故事借史为骨，时序有改编。
        </footer>
      </div>
    </section>
  )
}
