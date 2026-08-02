import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { MessageCircle, Send, Tv, Volume2, VolumeX } from 'lucide-react'
import TitleScreen from './sections/TitleScreen'
import StoryScene from './sections/StoryScene'
import TutorialBattleScene from './sections/TutorialBattleScene'
import BattleScene from './sections/BattleScene'
import {
  C7_FIRE,
  C8_SETTLE,
  DEFEAT_NARRATION,
  S1_AFTER_TESTIMONY_LINES,
  S1_BEFORE_TESTIMONY_LINES,
  S3_CHAAN,
  S6_AFTER_BREAKOUT_LINES,
  S6_AFTER_BREAKOUT_VARIANTS,
  S6_YUENU_ARRIVAL_LINES,
  SCENES,
  type StoryScene as Scene,
} from './game/story'
import { createBattle, type BattleState } from './game/battle'
import {
  escortBattleForTactic,
  farmBattleForOutcome,
  huipaiBattleForOutcome,
  PURSUIT_BATTLE,
  YUENU_BREAKOUT_BATTLE,
} from './game/scenarios'
import { EVAC_BATTLE_CONFIG } from './game/defenseBattle'
import { createTutorial, tutorialOutcome, type TutorialState } from './game/tutorial'
import { isMuted, playBgm, setMuted, unlockAudio, type BgmName } from './game/audio'
import GameMenu from './components/GameMenu'
import ChapterCard from './ui/ChapterCard'
import C7ChoicePanel from './ui/C7ChoicePanel'
import ScrollInspect from './ui/ScrollInspect'
import CaseFragmentBoard from './ui/CaseFragmentBoard'
import FireRescue from './ui/FireRescue'
import DefenseBattlePanel from './ui/DefenseBattlePanel'
import SettlePanel from './ui/SettlePanel'
import ShichengPage from './ui/ShichengPage'
import BattleRetryOverlay from './ui/BattleRetryOverlay'
import WitnessStatementPanel from './ui/WitnessStatementPanel'
import PursuitIntercept from './ui/PursuitIntercept'
import { S3_SCROLL_STACKS } from './ui/scrollInspectData'
import { SHICHENG_CARDS, type ShichengCard } from './ui/shichengData'
import type { C4Tactic, C7Choice } from './game/save'
import UiMechanicsPreview from './ui/UiMechanicsPreview'
import WechatQrModal from './components/WechatQrModal'
import { SOCIAL_LINKS, SOCIAL_READY } from './lib/social'
import {
  DEFAULT_STORY_FLAGS,
  findLatestSave,
  loadAutoSave,
  writeAutoSave,
  type SaveData,
  type SavedRegisterId,
  type Stage,
  type StoryFlags,
} from './game/save'

const STAGE_BGM: Record<Stage, BgmName | null> = {
  title: null,
  chapter_card: null,
  s1_anfa: 'court',
  s1_statement: 'court',
  s1_anfa_after: 'court',
  s2_shenxun: 'court',
  s3_chaqu: 'ambush',
  s3_chaan: 'ambush',
  s3_chaqu_after: 'ambush',
  s4_andun: 'farm',
  s5_zhuishi: 'ambush',
  s5_battle: 'ambush',
  s5_zhuishi_after: 'ambush',
  s6_fusha: 'ambush',
  s6_battle: 'ambush',
  s6_fusha_after: 'ambush',
  s6_yuenu_battle: 'ambush',
  s6_fusha_fall: 'ambush',
  s7_xiandai: null,
  s8_nongjia: 'farm',
  s9_tongxing: 'farm',
  s9_battle: 'ambush',
  s9_tongxing_after: 'farm',
  s10_guace: 'court',
  c1_pinan: 'ambush',
  c1_case: 'ambush',
  c1_pinan_after: 'ambush',
  c2_zhangtai: 'court',
  c3_guoshu: 'court',
  c4_husong: 'ambush',
  c4_battle: null, // 环境音为 city_siege 进行曲，不再叠 ambush BGM
  c4_husong_after: 'ambush',
  c5_shouxiang: 'court',
  c6_yiying: 'farm',
  c6_huipai_battle: 'ambush',
  c7_huoqi: 'ambush',
  c7_choice: 'ambush',
  c7_fire: 'ambush',
  c7_troops: null, // 追截组件独占 city_siege，避免和 ambush 重叠
  c7_evac: null, // 环境音为 city_siege 进行曲，不再叠 ambush BGM
  c7_huoqi_after: 'ambush',
  c8_zhangmo: 'court',
  c8_settle: 'court',
  shicheng: null,
  end: 'court',
}

// 哪些 stage 隐藏游戏菜单按钮（标题 / 转场 / 战斗 / 收尾）
const MENU_HIDDEN: ReadonlySet<Stage> = new Set([
  'title',
  'chapter_card',
  's1_statement',
  's5_battle',
  's6_battle',
  's6_yuenu_battle',
  's9_battle',
  'c4_battle',
  'c6_huipai_battle',
  'c7_fire',
  'c7_troops',
  'c7_evac',
  'end',
])

// 史乘卡解锁：C2 过完解锁前两张，C8 军报后（进结算）解锁后两张；进度按 stage 顺序推导
const SHICHENG_C2_IDS = ['c2_fatigue', 'c2_guests'] as const
const SHICHENG_C8_IDS = ['c8_surrender', 'c8_canal'] as const
const SHICHENG_ALL_IDS = SHICHENG_CARDS.map((card) => card.id)

function shichengUnlockedFor(stage: Stage): ShichengCard['id'][] {
  const order = Object.keys(STAGE_BGM) as Stage[]
  const index = order.indexOf(stage)
  const unlocked: ShichengCard['id'][] = []
  if (index > order.indexOf('c2_zhangtai')) unlocked.push(...SHICHENG_C2_IDS)
  if (index > order.indexOf('c8_zhangmo')) unlocked.push(...SHICHENG_C8_IDS)
  return unlocked
}

/** 挂载点通用外壳：背景图 + 压暗 + 居中容器 */
function MountShell({ bg, children }: { bg?: string; children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-qin-ink px-4 py-10">
      {bg && (
        <img
          src={bg}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-qin-ink/80" />
      <div className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-6">
        {children}
      </div>
    </div>
  )
}

/** 渲染场景后段（战斗/挂载之后）：lines 换成 continuation，沿用场景背景与章名 */
function continuationScene(scene: Scene): Scene {
  if (!scene.continuation) return scene
  return {
    ...scene,
    id: `${scene.id}#after`,
    lines: scene.continuation.lines,
    lineVariants: scene.continuation.lineVariants,
    choice: undefined,
    continuation: undefined,
  }
}

export default function App() {
  const previewMode = new URLSearchParams(window.location.search).get('ui-preview') === '1'
  const urlParams = new URLSearchParams(window.location.search)
  const initialStage = (urlParams.get('stage') as Stage | null) || 'title'
  const [stage, setStage] = useState<Stage>(initialStage)
  const [tutorial, setTutorial] = useState<TutorialState | null>(null)
  const [flags, setFlags] = useState<StoryFlags>({ ...DEFAULT_STORY_FLAGS })
  const [battle, setBattle] = useState<BattleState | null>(null)
  const [evacDefeated, setEvacDefeated] = useState(false)
  const [evacRetryKey, setEvacRetryKey] = useState(0)
  const [fireResult, setFireResult] = useState<SavedRegisterId[] | null>(null)
  const [mute, setMute] = useState(isMuted())
  const [showQr, setShowQr] = useState(false)
  const [showTgQr, setShowTgQr] = useState(false)
  const farmBattleConfig = useMemo(() => farmBattleForOutcome(flags), [flags])
  const c4BattleConfig = useMemo(
    () => escortBattleForTactic((flags.c4_tactic as C4Tactic | undefined) ?? 'ambush'),
    [flags.c4_tactic],
  )
  const huipaiBattleConfig = useMemo(() => huipaiBattleForOutcome(flags), [flags])

  useEffect(() => {
    playBgm(STAGE_BGM[stage])
  }, [stage])

  // 当从 URL 参数跳转到战斗 stage 时，自动构造 battle/tutorial state
  useEffect(() => {
    if (initialStage === 's5_battle' && !battle) {
      setBattle(createBattle(PURSUIT_BATTLE))
    } else if (initialStage === 's6_battle' && !tutorial) {
      setTutorial(createTutorial())
    } else if (initialStage === 's6_yuenu_battle' && !battle) {
      setBattle(createBattle(YUENU_BREAKOUT_BATTLE))
    } else if (initialStage === 's9_battle' && !battle) {
      setBattle(createBattle(farmBattleConfig))
    } else if (initialStage === 'c4_battle' && !battle) {
      setBattle(createBattle(c4BattleConfig))
    }
  }, [initialStage])

  const restart = () => {
    setStage('title')
    setTutorial(null)
    setFlags({ ...DEFAULT_STORY_FLAGS })
    setBattle(null)
  }

  // 从存档恢复：stage 与剧情 flags 拉回（战斗状态由兜底 effect 重新构造）
  const applySave = (data: SaveData) => {
    setStage(data.stage)
    setFlags({ ...data.flags })
    setTutorial(null)
    setBattle(null)
  }

  const patchFlags = (patch: Partial<StoryFlags>) => setFlags((current) => ({ ...current, ...patch }))

  // 战前自动存档（战败重试点：回卷到战前场景，配战败旁白）
  const armBattleSave = (preBattleStage: Stage) => writeAutoSave({ flags, stage: preBattleStage })

  // 战败回卷：读战前自动存档回到战前场景；无档时兜底原地重开
  const rollbackToBattleSave = (fallback: () => void) => {
    const saved = loadAutoSave()
    if (saved) applySave(saved)
    else fallback()
  }

  const toggleMute = () => {
    setMuted(!mute)
    setMute(!mute)
  }

  const muteBtn = (
    <button
      onClick={(e) => {
        e.stopPropagation()
        toggleMute()
      }}
      className="fixed top-3 right-4 z-50 p-2 text-qin-parchment-50 hover:text-qin-bronze transition-colors"
      title={mute ? '取消静音' : '静音'}
    >
      {mute ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
    </button>
  )

  const story = (
    id: keyof typeof SCENES,
    next: Stage | (() => void),
    opts?: { after?: boolean; completeOnLastLine?: boolean },
  ) => {
    const base = SCENES[id]
    const scene = opts?.after ? continuationScene(base) : base
    const go = typeof next === 'function' ? next : () => setStage(next)
    return (
      <StoryScene
        key={scene.id}
        scene={scene}
        flags={flags}
        onFlagsChange={patchFlags}
        onDone={go}
        onSkipAvailable
        completeOnLastLine={opts?.completeOnLastLine}
      />
    )
  }

  const storySegment = (
    base: Scene,
    suffix: string,
    lines: Scene['lines'],
    next: Stage | (() => void),
    lineVariants?: Scene['lineVariants'],
  ) => {
    const scene: Scene = {
      ...base,
      id: `${base.id}#${suffix}`,
      lines,
      lineVariants,
      choice: undefined,
      continuation: undefined,
    }
    const go = typeof next === 'function' ? next : () => setStage(next)
    return (
      <StoryScene
        key={scene.id}
        scene={scene}
        flags={flags}
        onFlagsChange={patchFlags}
        onDone={go}
        onSkipAvailable
      />
    )
  }

  const render = () => {
    switch (stage) {
      case 'title': {
        const latest = findLatestSave()
        return (
          <TitleScreen
            onStart={() => { unlockAudio(); setStage('s1_anfa') }}
            onLoad={applySave}
            shichengUnlockedCardIds={latest ? shichengUnlockedFor(latest.stage) : []}
          />
        )
      }

      case 'shicheng':
        return <ShichengPage unlockedCardIds={SHICHENG_ALL_IDS} onClose={() => setStage('end')} />

      // —— 序章 ——
      case 's1_anfa':
        return storySegment(SCENES.s1_anfa, 'testimony-setup', S1_BEFORE_TESTIMONY_LINES, 's1_statement')
      case 's1_statement':
        return (
          <MountShell bg="https://stats.puck-muling.top/game/assets/bg_heibingtai.webp">
            <WitnessStatementPanel onComplete={() => setStage('s1_anfa_after')} />
          </MountShell>
        )
      case 's1_anfa_after':
        return storySegment(SCENES.s1_anfa, 'testimony-after', S1_AFTER_TESTIMONY_LINES, 's2_shenxun')
      case 's2_shenxun':
        return story('s2_shenxun', 's3_chaqu')
      case 's3_chaqu':
        return story('s3_chaqu', 's3_chaan')
      case 's3_chaan':
        return (
          <MountShell bg="https://stats.puck-muling.top/game/assets/bg_qukou.webp">
            <ScrollInspect
              sceneId="s3_chaan"
              stacks={S3_SCROLL_STACKS}
              fallbackText={S3_CHAAN.fallback}
              onContinue={() => setStage('s3_chaqu_after')}
            />
          </MountShell>
        )
      case 's3_chaqu_after':
        return story('s3_chaqu', 's4_andun', { after: true })
      case 's4_andun':
        return story('s4_andun', 's5_zhuishi')
      case 's5_zhuishi':
        return story('s5_zhuishi', () => {
          armBattleSave('s5_zhuishi')
          setBattle(createBattle(PURSUIT_BATTLE))
          setStage('s5_battle')
        })
      case 's5_battle':
        return battle ? (
          <BattleScene
            key="s5_battle"
            battle={battle}
            cfg={PURSUIT_BATTLE}
            title="S5 · 追击密使战"
            objective="目标：击溃护逃死士，夺取行囊"
            enemyLabel="护逃死士"
            defeatText={DEFEAT_NARRATION.s5}
            setBattle={setBattle}
            onFinish={() => setStage('s5_zhuishi_after')}
            onRetry={() => rollbackToBattleSave(() => setBattle(createBattle(PURSUIT_BATTLE)))}
          />
        ) : null
      case 's5_zhuishi_after':
        return story('s5_zhuishi', 's6_fusha', { after: true })
      case 's6_fusha':
        return story('s6_fusha', () => {
          armBattleSave('s6_fusha')
          setTutorial(createTutorial())
          setStage('s6_battle')
        })
      case 's6_battle':
        return tutorial ? (
          <TutorialBattleScene
            key="s6_battle"
            battle={tutorial}
            setBattle={setTutorial}
            onFinish={(result) => {
              const outcome = tutorialOutcome(result)
              patchFlags({
                s6_yutu_saved: outcome.yutuSaved,
                s6_mengjia_saved: outcome.mengjiaSaved,
                s6_cart_through: outcome.cartThrough,
              })
              setStage('s6_fusha_after')
            }}
            onRetry={() => rollbackToBattleSave(() => setTutorial(createTutorial()))}
          />
        ) : null
      case 's6_fusha_after':
        return storySegment(SCENES.s6_fusha, 'yuenu-arrival', S6_YUENU_ARRIVAL_LINES, () => {
          armBattleSave('s6_fusha_after')
          setBattle(createBattle(YUENU_BREAKOUT_BATTLE))
          setStage('s6_yuenu_battle')
        })
      case 's6_yuenu_battle':
        return battle ? (
          <BattleScene
            key="s6_yuenu_battle"
            battle={battle}
            cfg={YUENU_BREAKOUT_BATTLE}
            title="S6 · 越女破围"
            objective="目标：三回合内，以截剑与飞针撕开包围"
            enemyLabel="灭口伏兵"
            defeatText={DEFEAT_NARRATION.yuenu}
            setBattle={setBattle}
            onFinish={() => setStage('s6_fusha_fall')}
            onRetry={() => rollbackToBattleSave(() => setBattle(createBattle(YUENU_BREAKOUT_BATTLE)))}
          />
        ) : null
      case 's6_fusha_fall':
        return storySegment(
          SCENES.s6_fusha,
          'beimang-fall',
          S6_AFTER_BREAKOUT_LINES,
          's7_xiandai',
          S6_AFTER_BREAKOUT_VARIANTS,
        )
      case 's7_xiandai':
        return story('s7_xiandai', 's8_nongjia', { completeOnLastLine: true })
      case 's8_nongjia':
        return story('s8_nongjia', 's9_tongxing')
      case 's9_tongxing':
        return story('s9_tongxing', () => {
          armBattleSave('s9_tongxing')
          setBattle(createBattle(farmBattleConfig))
          setStage('s9_battle')
        })
      case 's9_battle':
        return battle ? (
          <BattleScene
            key="s9_battle"
            battle={battle}
            cfg={farmBattleConfig}
            title="S9 · 农家战"
            objective="目标：击退灭口追兵"
            enemyLabel="灭口死士"
            defeatText={DEFEAT_NARRATION.s9}
            setBattle={setBattle}
            onFinish={() => setStage('s9_tongxing_after')}
            onRetry={() => rollbackToBattleSave(() => setBattle(createBattle(farmBattleConfig)))}
          />
        ) : null
      case 's9_tongxing_after':
        return story('s9_tongxing', 's10_guace', { after: true })
      case 's10_guace':
        return (
          <StoryScene
            key={SCENES.s10_guace.id}
            scene={SCENES.s10_guace}
            flags={flags}
            choiceFlag={{ flag: 'plead_soldier', values: { plead: true, silent: false } }}
            onFlagsChange={patchFlags}
            onDone={() => setStage('chapter_card')}
            onSkipAvailable
          />
        )

      case 'chapter_card':
        return (
          <ChapterCard
            key="prologue-to-chapter-one"
            from={{ number: '序章', title: '郑地伏杀' }}
            to={{ number: '第一章', title: '新郑覆旗' }}
            direction="forward"
            onContinue={() => setStage('c1_pinan')}
          />
        )

      // —— 第一章 ——
      case 'c1_pinan':
        return story('c1_pinan', 'c1_case')
      case 'c1_case':
        return (
          <MountShell bg="https://stats.puck-muling.top/game/assets/bg_junzhang.webp">
            <CaseFragmentBoard onCombine={() => setStage('c1_pinan_after')} combineLabel="合卷定案" />
          </MountShell>
        )
      case 'c1_pinan_after':
        return story('c1_pinan', 'c2_zhangtai', { after: true })
      case 'c2_zhangtai':
        return story('c2_zhangtai', 'c3_guoshu')
      case 'c3_guoshu':
        return story('c3_guoshu', 'c4_husong')
      case 'c4_husong':
        return (
          <StoryScene
            key={SCENES.c4_husong.id}
            scene={SCENES.c4_husong}
            flags={flags}
            choiceFlag={{ flag: 'c4_tactic', values: { ambush: 'ambush', valley: 'valley', rear: 'rear' } }}
            onFlagsChange={patchFlags}
            onDone={() => {
              armBattleSave('c4_husong')
              setBattle(createBattle(c4BattleConfig))
              setStage('c4_battle')
            }}
            onSkipAvailable
          />
        )
      case 'c4_battle':
        return battle ? (
          <BattleScene
            key="c4_battle"
            battle={battle}
            cfg={c4BattleConfig}
            title="C4 · 护送截杀战"
            objective="目标：护住车，守到秦军前锋抵达"
            enemyLabel="死战派私兵"
            defeatText={DEFEAT_NARRATION.c4}
            setBattle={setBattle}
            onFinish={() => {
              const present = Object.values(battle.heroes).filter((hero) => hero.present)
              const hpRatio = present.reduce((sum, hero) => sum + hero.hp, 0) / present.reduce((sum, hero) => sum + hero.maxHp, 0)
              patchFlags({ c4_performance: hpRatio >= 0.66 ? 'high' : hpRatio >= 0.34 ? 'mid' : 'low' })
              setStage('c4_husong_after')
            }}
            onRetry={() => rollbackToBattleSave(() => setBattle(createBattle(c4BattleConfig)))}
          />
        ) : null
      case 'c4_husong_after':
        return story('c4_husong', 'c5_shouxiang', { after: true })
      case 'c5_shouxiang':
        return story('c5_shouxiang', 'c6_yiying')
      case 'c6_yiying':
        return story('c6_yiying', () => {
          armBattleSave('c6_yiying')
          setBattle(createBattle(huipaiBattleConfig))
          setStage('c6_huipai_battle')
        })
      case 'c6_huipai_battle':
        return battle ? (
          <BattleScene
            key="c6_huipai_battle"
            battle={battle}
            cfg={huipaiBattleConfig}
            title="C6 · 新郑终局战"
            objective="目标：击溃回旆盟断后阵线"
            enemyLabel="回旆盟"
            defeatText={DEFEAT_NARRATION.huipai}
            setBattle={setBattle}
            onFinish={() => setStage('c7_huoqi')}
            onRetry={() => rollbackToBattleSave(() => setBattle(createBattle(huipaiBattleConfig)))}
          />
        ) : null
      case 'c7_huoqi':
        return story('c7_huoqi', 'c7_choice')
      case 'c7_choice':
        return (
          <div className="min-h-screen bg-qin-charcoal flex items-center justify-center px-4 py-10">
            <C7ChoicePanel
              c4Tactic={(flags.c4_tactic as C4Tactic | undefined) ?? 'ambush'}
              currentChoice={(flags.c7_choice as C7Choice | undefined) ?? null}
              onChoose={(choice) => {
                patchFlags({ c7_choice: choice })
                if (choice === 'camp') armBattleSave('c7_choice') // 撤离战战前存档（战败回卷点）
                setStage(choice === 'register' ? 'c7_fire' : choice === 'troops' ? 'c7_troops' : 'c7_evac')
              }}
            />
          </div>
        )
      case 'c7_fire':
        return (
          <MountShell bg="https://stats.puck-muling.top/game/assets/bg_guanshu_huo.webp">
            <p className="text-center text-lg tracking-[0.2em] text-qin-parchment [text-shadow:0_2px_8px_#000]">
              {C7_FIRE.intro[0]}
            </p>
            <FireRescue
              onFlagsChange={({ c7_saved_registers }) => patchFlags({ c7_saved_registers })}
              onComplete={(saved) => setFireResult(saved)}
            />
            {fireResult && (
              // 火场结果浮层：按是否抢到户籍呈现 savedHuji／lostHuji 冻结句一行，确认后回剧情
              <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 px-6 text-qin-parchment">
                <div className="max-w-xl text-center">
                  <p className="text-[0.65rem] tracking-[0.5em] text-[#C4746A]/65">火场 · 撤离</p>
                  <p className="mt-6 text-xl leading-10 tracking-[0.12em] text-qin-parchment-80">
                    {fireResult.includes('huji') ? C7_FIRE.savedHuji : C7_FIRE.lostHuji}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFireResult(null)
                      setStage('c7_huoqi_after')
                    }}
                    className="mx-auto mt-10 border border-qin-bronze-50 px-8 py-3 tracking-[0.25em] text-qin-bronze-light transition-colors hover:bg-qin-bronze-10"
                  >
                    继续
                  </button>
                </div>
              </div>
            )}
          </MountShell>
        )
      case 'c7_evac':
        return (
          <MountShell>
            <DefenseBattlePanel
              key={evacRetryKey}
              config={EVAC_BATTLE_CONFIG}
              onFlagsChange={({ evac_survival }) => patchFlags({ evac_survival })}
              onFinish={() => setStage('c7_huoqi_after')}
              onDefeat={() => setEvacDefeated(true)}
            />
            {evacDefeated && (
              <BattleRetryOverlay
                battleId="c7_evac"
                onRetry={() => {
                  setEvacDefeated(false)
                  rollbackToBattleSave(() => setEvacRetryKey((key) => key + 1))
                }}
              />
            )}
          </MountShell>
        )
      case 'c7_troops':
        return (
          <MountShell bg="https://stats.puck-muling.top/game/assets/bg_xinzheng.webp">
            <PursuitIntercept
              onFlagsChange={({ c7_troops_intercepted }) => patchFlags({ c7_troops_intercepted })}
              onFinish={() => setStage('c7_huoqi_after')}
            />
          </MountShell>
        )
      case 'c7_huoqi_after':
        return story('c7_huoqi', 'c8_zhangmo', { after: true })
      case 'c8_zhangmo':
        return story('c8_zhangmo', 'c8_settle')
      case 'c8_settle':
        return (
          <MountShell bg="https://stats.puck-muling.top/game/assets/bg_junzhang.webp">
            <div className="text-sm tracking-[0.3em] text-qin-bronze [text-shadow:0_2px_8px_#000]">
              {C8_SETTLE.title}
            </div>
            <SettlePanel
              flags={flags}
              shichengUnlocked={shichengUnlockedFor('c8_settle').length}
              onContinue={() => setStage('end')}
              continueLabel="收军报"
            />
          </MountShell>
        )
      case 'end':
        return (
          <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-qin-charcoal text-qin-parchment px-6 text-center">
            <div className="text-qin-bronze tracking-[0.3em] text-sm">第一章《新郑覆旗》· 完</div>
            <div className="text-sm leading-7 text-qin-parchment-65">
              Demo 到此为止。你的抉择已写入存档 flags，
              <br />
              后续章节将据此回响。
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setStage('shicheng')}
                className="px-8 py-3 bg-[#202226] hover:bg-qin-cinnabar-15 transition-colors tracking-[0.3em] border border-qin-bronze-35"
              >
                史乘
              </button>
              <button
                onClick={restart}
                className="px-8 py-3 bg-qin-cinnabar hover:bg-qin-cinnabar-hover transition-colors tracking-[0.3em] border border-qin-bronze-50"
              >
                回到标题
              </button>
            </div>
            {SOCIAL_READY && (
              <div className="mt-6 flex flex-col items-center gap-3">
                <p className="text-xs tracking-[0.2em] text-qin-parchment-25">喜欢这个 Demo？关注开发者，获取后续更新</p>
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => setShowQr(true)}
                    className="flex items-center gap-1.5 text-sm tracking-[0.15em] text-qin-bronze transition-colors hover:text-qin-bronze-light"
                  >
                    <MessageCircle className="size-4" />
                    微信
                  </button>
                  <button
                    onClick={() => setShowTgQr(true)}
                    className="flex items-center gap-1.5 text-sm tracking-[0.15em] text-qin-bronze transition-colors hover:text-qin-bronze-light"
                  >
                    <Send className="size-4" />
                    Telegram
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
                  <a
                    href={SOCIAL_LINKS.gcores}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm tracking-[0.15em] text-qin-parchment-50 transition-colors hover:text-qin-bronze"
                  >
                    机核
                  </a>
                </div>
              </div>
            )}
            {showQr && <WechatQrModal onClose={() => setShowQr(false)} />}
            {showTgQr && <WechatQrModal onClose={() => setShowTgQr(false)} type="telegram" />}
          </div>
        )
    }
  }

  // 兜底：存档加载到战斗阶段时，对应 state 可能未构造
  useEffect(() => {
    if (stage === 's5_battle' && !battle) setBattle(createBattle(PURSUIT_BATTLE))
    if (stage === 's9_battle' && !battle) setBattle(createBattle(farmBattleConfig))
    if (stage === 'c4_battle' && !battle) setBattle(createBattle(c4BattleConfig))
    if (stage === 'c6_huipai_battle' && !battle) setBattle(createBattle(huipaiBattleConfig))
    if (stage === 's6_battle' && !tutorial) setTutorial(createTutorial())
    if (stage === 's6_yuenu_battle' && !battle) setBattle(createBattle(YUENU_BREAKOUT_BATTLE))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  if (previewMode) return <UiMechanicsPreview />

  return (
    <>
      {muteBtn}
      <GameMenu
        stage={stage}
        draftData={{ flags }}
        onLoad={applySave}
        onRestart={restart}
        hide={MENU_HIDDEN.has(stage)}
        shichengUnlockedCardIds={shichengUnlockedFor(stage)}
      />
      {render()}
    </>
  )
}
