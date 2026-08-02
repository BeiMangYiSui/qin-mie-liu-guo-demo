// 逻辑自检 v2：v3.5 十八场结构 / §0 flags / 存档 / 分支渲染 / defend 战斗
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import * as esbuild from 'esbuild'

const projectRoot = process.cwd()
const publicRoot = path.join(projectRoot, 'public')

const bundle = await esbuild.build({
  stdin: {
    contents: `
      export * as story from './src/game/story.ts'
      export * as battle from './src/game/battle.ts'
      export * as scenarios from './src/game/scenarios.ts'
      export * as tutorial from './src/game/tutorial.ts'
      export * as save from './src/game/save.ts'
      export * as flags from './src/ui/flags.ts'
      export * as c7data from './src/ui/c7ChoiceData.ts'
    `,
    resolveDir: projectRoot,
    sourcefile: 'verify-entry.ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})

const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
const { story, battle, scenarios, tutorial, save, flags, c7data } = await import(moduleUrl)
const manifest = JSON.parse(fs.readFileSync(path.join(publicRoot, 'voice/manifest.json'), 'utf8'))

// —— §0 场景 id 与顺序 ——
const SCENE_IDS = [
  's1_anfa', 's2_shenxun', 's3_chaqu', 's4_andun', 's5_zhuishi',
  's6_fusha', 's7_xiandai', 's8_nongjia', 's9_tongxing', 's10_guace',
  'c1_pinan', 'c2_zhangtai', 'c3_guoshu', 'c4_husong', 'c5_shouxiang',
  'c6_yiying', 'c7_huoqi', 'c8_zhangmo',
]
assert.deepEqual(Object.keys(story.SCENES), SCENE_IDS, '十八场 id 与剧情顺序必须与 §0 一致')
assert.deepEqual(
  story.MOUNT_POINTS.map((m) => m.id),
  ['s3_chaan', 'c1_case', 'c7_fire', 'c7_troops', 'c7_evac', 'c8_settle', 'shicheng'],
  '七个挂载点必须齐备',
)

const TRACKS = new Set(['narration', 'inner', 'dialogue', 'stage', 'caption'])
for (const scene of Object.values(story.SCENES)) {
  for (const line of [...scene.lines, ...(scene.continuation?.lines ?? []), ...(scene.choice?.after ?? [])]) {
    assert.ok(TRACKS.has(line.type), `非法文本轨：${scene.id} / ${line.text}`)
  }
}

// —— flags 与存档 ——
assert.equal(save.CURRENT_SAVE_VERSION, 2, '当前存档版本必须为 2')
assert.equal(save.checkSaveCompatibility({}), 'legacy')
assert.equal(save.checkSaveCompatibility({ saveVersion: 2 }), 'compatible')
assert.equal(save.checkSaveCompatibility({ saveVersion: 3 }), 'future')
assert.deepEqual(
  save.normalizeStoryFlags({
    plead_soldier: true,
    s6_yutu_saved: false,
    s6_mengjia_saved: true,
    s6_cart_through: false,
    c4_tactic: 'ambush',
    c4_performance: 'high',
    c7_choice: 'invalid',
    c7_saved_registers: ['huji', 'liangce'],
    c7_troops_intercepted: 9,
    evac_survival: 'high',
    nested: { unsafe: true },
  }),
  {
    plead_soldier: true,
    s6_yutu_saved: false,
    s6_mengjia_saved: true,
    s6_cart_through: false,
    c4_tactic: 'ambush',
    c4_performance: 'high',
    c7_saved_registers: ['huji', 'liangce'],
    evac_survival: 'high',
  },
  'flags 应保留有效标量与字符串数组、过滤非法已知值与嵌套数据',
)

const localStorageData = new Map()
globalThis.localStorage = {
  getItem: (key) => localStorageData.get(key) ?? null,
  setItem: (key, value) => localStorageData.set(key, String(value)),
  removeItem: (key) => localStorageData.delete(key),
  clear: () => localStorageData.clear(),
  key: (index) => [...localStorageData.keys()][index] ?? null,
  get length() {
    return localStorageData.size
  },
}

const writtenSave = save.writeSave(0, {
  stage: 's10_guace',
  flags: { plead_soldier: true, c7_saved_registers: ['huji'], c7_troops_intercepted: 4 },
})
assert.equal(writtenSave.saveVersion, 2, '新存档必须自动写入 v2')
assert.deepEqual(
  save.loadSave(0)?.flags,
  { plead_soldier: true, c7_saved_registers: ['huji'], c7_troops_intercepted: 4 },
  'flags（含字符串数组）必须随存档往返持久化',
)
assert.equal(save.canSaveAt('s5_battle'), false, '战斗中不允许存档')
assert.equal(save.canSaveAt('s6_yuenu_battle'), false, '越女破围战中不允许存档')
assert.equal(save.canSaveAt('c4_battle'), false, '战斗中不允许存档')
assert.equal(save.canSaveAt('c6_huipai_battle'), false, '回旆盟终局战中不允许存档')
assert.equal(save.canSaveAt('c1_case'), false, '拼案挂载中不允许存档')
assert.equal(save.canSaveAt('c7_choice'), false, '抉择面板不允许存档')
assert.equal(save.canSaveAt('s10_guace'), true, '叙事场景允许存档')

save.writeAutoSave({ stage: 'c4_husong', flags: { c4_tactic: 'rear' } })
assert.deepEqual(
  save.loadAutoSave()?.flags,
  { c4_tactic: 'rear' },
  '战前自动存档必须可回卷读取',
)
assert.equal(save.inspectSave(0).status, 'ready', '自动存档不得污染手动槽位')

localStorage.setItem('qmlg:save:1', JSON.stringify({ slot: 1, stage: 's10_guace', savedAt: Date.now() }))
assert.equal(save.inspectSave(1).status, 'incompatible', '无版本号旧档必须显示为不兼容而非空槽')
assert.equal(save.deleteIncompatibleSaves(), 1, '重置应只删除不兼容档')
assert.equal(save.inspectSave(0).status, 'ready', '重置旧档不得删除当前版本存档')
delete globalThis.localStorage

// —— 分支走查（逻辑层）——
// S10 两分支 → C4 守谷口老卒回响
const c4 = story.SCENES.c4_husong
assert.ok(c4.continuation, 'C4 必须有战后 continuation')
const pleadLines = flags.selectLinesByFlags(c4.continuation.lines, c4.continuation.lineVariants, { plead_soldier: true })
const silentLines = flags.selectLinesByFlags(c4.continuation.lines, c4.continuation.lineVariants, { plead_soldier: false })
assert.ok(pleadLines.some((l) => l.text.includes('那次，你替我说情')), '求情后老卒台词应为还情版')
assert.ok(silentLines.some((l) => l.text.includes('那次，你没开口')), '未求情老卒台词应为军令版')
assert.ok(!pleadLines.some((l) => l.text.includes('你没开口')), '两版老卒台词不得串线')

// C4 三战术 → C7 锁定项（§0：ambush→camp／valley→troops／rear→register）
assert.deepEqual(c7data.C7_LOCKED_CHOICE_BY_TACTIC, { ambush: 'camp', valley: 'troops', rear: 'register' }, 'C7 锁定映射必须与 §0 一致')
assert.deepEqual(
  flags.flagPatchForChoice({ flag: 'c4_tactic', values: { ambush: 'ambush', valley: 'valley', rear: 'rear' } }, 'valley'),
  { c4_tactic: 'valley' },
  'C4 choice tag 应写入 c4_tactic',
)
assert.deepEqual(
  flags.flagPatchForChoice({ flag: 'plead_soldier', values: { plead: true, silent: false } }, 'silent'),
  { plead_soldier: false },
  'S10 choice tag 应写入 plead_soldier',
)

// C7 三选一 → C8 军报变体
const c8 = story.SCENES.c8_zhangmo
const reportOf = (f) => flags.selectLinesByFlags(c8.lines, c8.lineVariants, f).map((l) => l.text)
assert.ok(reportOf({ c7_choice: 'register', c7_saved_registers: ['huji'] }).includes('户籍主档在，人名可循。'), 'register+户籍 军报')
assert.ok(reportOf({ c7_choice: 'register', c7_saved_registers: [] }).includes('户籍主档焚毁，其余三册得存。'), 'register 未抢到 军报')
assert.ok(reportOf({ c7_choice: 'troops' }).includes('残军溃散，北道者寡。'), 'troops 军报')
assert.ok(reportOf({ c7_choice: 'camp', evac_survival: 'high' }).includes('疫营伤者，多数得活。'), 'camp 高存活 军报')
assert.ok(reportOf({ c7_choice: 'camp', evac_survival: 'low' }).includes('疫营伤者，得活者半。'), 'camp 低存活 军报')

// C7 回响三段
const c7 = story.SCENES.c7_huoqi
assert.ok(story.SCENES.c6_yiying.lines.some((line) => line.text.includes('回旆盟反扑')), 'C6 末段必须引出回旆盟终局战')
assert.ok(c7.lines.some((line) => line.text.includes('回旆盟败了')), 'C7 必须承接回旆盟战败')
assert.ok(c7.lines.some((line) => line.text.includes('火种')), '回旆盟败退时必须交代分路纵火')
const echoOf = (f) => flags.selectLinesByFlags(c7.continuation.lines, c7.continuation.lineVariants, f).map((l) => l.text)
assert.ok(echoOf({ c7_choice: 'register' })[0].startsWith('保户籍——'), 'register 回响')
assert.ok(echoOf({ c7_choice: 'troops' })[0].startsWith('截残军——'), 'troops 回响')
assert.ok(echoOf({ c7_choice: 'camp' })[0].startsWith('护疫营——'), 'camp 回响')

// —— 战斗 ——
const pursuit = battle.createBattle(scenarios.PURSUIT_BATTLE)
assert.equal(pursuit.heroes.beimang.present, true, 'S5 追击战北芒必须在场')
assert.equal(pursuit.heroes.mengjia.present, true, 'S5 追击战孟甲必须在场')
assert.equal(pursuit.heroes.xiaoman.present, false, 'S5 追击战小满不得参战')
assert.equal(pursuit.heroes.yuenu.present, false, 'S5 追击战青翎不得参战')
assert.equal(pursuit.enemies.length, 3, 'S5 追击战敌方配置必须生效')
const pursuitAssassin = pursuit.enemies.find((enemy) => enemy.specKey === 'qishou')
assert.equal(pursuitAssassin.intent.type, 'hidden', '骑影杀手首回合应公开暗器意图')
assert.ok(pursuitAssassin.intent.dmg >= 11, '暗器必须形成可致命的高威胁')

assert.equal(story.S6_YUENU_ARRIVAL_LINES.at(-1).speaker, '越女', '越女破围战必须紧接“越女：走”之后')
assert.equal(story.S6_YUENU_ARRIVAL_LINES.at(-1).text, '“走。”', '越女破围战前对白不得改写')
assert.ok(story.S6_AFTER_BREAKOUT_LINES.some((line) => line.text.includes('弩弦骤响')), '北芒中钉旁白必须放在越女破围战之后')
assert.equal(story.S1_BEFORE_TESTIMONY_LINES.length, 12, '序章必须在约两分钟内进入第一次玩家取证互动')
assert.equal(
  story.S1_BEFORE_TESTIMONY_LINES.at(-1).text,
  '“那就写上。”（顿）“写你看见的。”',
  '第一次互动必须落在“亲见”与“传闻”的叙事分界上',
)
const yuenuBreakout = battle.createBattle(scenarios.YUENU_BREAKOUT_BATTLE)
assert.deepEqual(
  Object.values(yuenuBreakout.heroes).filter((hero) => hero.present).map((hero) => hero.id),
  ['yuenu'],
  '破围战只能有越女一人出战',
)
assert.equal(yuenuBreakout.heroes.yuenu.name, '越女', '破围战不得提前揭示青翎姓名')
assert.equal(yuenuBreakout.enemies.length, 3, '越女必须独自面对完整包围阵线')
assert.ok(yuenuBreakout.enemies.some((enemy) => enemy.intent.type === 'hidden'), '单人破围首回合必须出现需要飞针应对的暗器')
assert.equal(scenarios.YUENU_BREAKOUT_BATTLE.roundLimit, 3, '越女破围必须锁定为三回合短战')
let cleanBreakout = yuenuBreakout
const hiddenEnemy = cleanBreakout.enemies.find((enemy) => enemy.intent.type === 'hidden')
cleanBreakout = battle.applyHeroAction(cleanBreakout, 'yuenu', 'feizhen', hiddenEnemy.uid)
cleanBreakout = battle.resolveEnemyPhase(cleanBreakout, scenarios.YUENU_BREAKOUT_BATTLE).state
cleanBreakout.heroes.yuenu.hp = 99
for (let round = 0; round < 2 && cleanBreakout.phase !== 'won'; round++) {
  const target = cleanBreakout.enemies[0]
  cleanBreakout = battle.applyHeroAction(cleanBreakout, 'yuenu', 'jiejian', target.uid)
  if (cleanBreakout.phase === 'enemy') {
    cleanBreakout = battle.resolveEnemyPhase(cleanBreakout, scenarios.YUENU_BREAKOUT_BATTLE).state
    cleanBreakout.heroes.yuenu.hp = 99
  }
}
assert.equal(cleanBreakout.phase, 'won', '按公开意图出招时，越女必须在三回合内破围')

let delayedBreakout = battle.createBattle(scenarios.YUENU_BREAKOUT_BATTLE)
delayedBreakout.heroes.yuenu.hp = 99
for (let round = 0; round < 3 && delayedBreakout.phase === 'player'; round++) {
  const melee = delayedBreakout.enemies.find((enemy) => enemy.specKey === 'weishi')
  delayedBreakout = battle.applyHeroAction(delayedBreakout, 'yuenu', 'feizhen', melee.uid)
  if (delayedBreakout.phase === 'enemy') {
    delayedBreakout = battle.resolveEnemyPhase(delayedBreakout, scenarios.YUENU_BREAKOUT_BATTLE).state
    delayedBreakout.heroes.yuenu.hp = 99
  }
}
assert.equal(delayedBreakout.phase, 'lost', '三回合仍未破围必须立即失败，不能拖成长战')

const huipaiFinal = battle.createBattle(scenarios.HUIPAI_FINAL_BATTLE)
assert.equal(huipaiFinal.enemies.length, 4, '灭郑终局必须有完整的回旆盟敌阵')
assert.ok(huipaiFinal.enemies.reduce((sum, enemy) => sum + enemy.hp, 0) >= 60, '回旆盟终局战不能是弱敌清场')
assert.ok(huipaiFinal.enemies.some((enemy) => enemy.intent.type === 'hidden'), '回旆盟终局首回合必须出现暗器威胁')
assert.deepEqual(
  Object.values(huipaiFinal.heroes).filter((hero) => hero.present).map((hero) => hero.id).sort(),
  ['beimang', 'xiaoman', 'yuenu'],
  '终局恶战必须固定由北芒、小满、青翎三人参战',
)
const woundedHuipaiFinal = scenarios.huipaiBattleForOutcome({ c4_performance: 'low' })
assert.equal(woundedHuipaiFinal.heroHp.beimang.hp, 18, '护送战低评价伤势必须带入回旆盟终局战')

const state0 = battle.createBattle(scenarios.FARM_BATTLE)
const needleState = structuredClone(state0)
const needleTarget = needleState.enemies.find((enemy) => enemy.specKey === 'toutmu')
needleTarget.intent = { type: 'hidden', target: 'beimang', dmg: 12, label: '测试暗器' }
const needleCountered = battle.applyHeroAction(needleState, 'yuenu', 'feizhen', needleTarget.uid)
const counteredTarget = needleCountered.enemies.find((enemy) => enemy.uid === needleTarget.uid)
assert.equal(counteredTarget.hp, needleTarget.hp - 6, '青翎飞针封穴应对暗器时造成 6 点伤害')
assert.equal(counteredTarget.intent.dmg, 0, '青翎飞针封穴必须取消暗器意图')

const wrongCounterState = structuredClone(needleState)
const wrongCountered = battle.applyHeroAction(wrongCounterState, 'yuenu', 'jiejian', needleTarget.uid)
const wrongCounterTarget = wrongCountered.enemies.find((enemy) => enemy.uid === needleTarget.uid)
assert.equal(wrongCounterTarget.intent.type, 'hidden', '截剑不能错误削弱暗器')
assert.equal(wrongCounterTarget.intent.dmg, 12, '未按计谋出招时暗器伤害必须保留')

const failedTactic = battle.createBattle(scenarios.FARM_BATTLE)
failedTactic.heroes.beimang.hp = 10
failedTactic.heroes.xiaoman.hp = 10
failedTactic.heroes.yuenu.hp = 10
failedTactic.enemies[0].intent = { type: 'hidden', target: 'beimang', dmg: 12, label: '暗器锁定北芒' }
failedTactic.enemies[1].intent = { type: 'hidden', target: 'xiaoman', dmg: 12, label: '暗器锁定小满' }
failedTactic.enemies[2].intent = { type: 'hidden', target: 'yuenu', dmg: 12, label: '暗器锁定青翎' }
failedTactic.acted = ['beimang', 'xiaoman', 'yuenu']
failedTactic.phase = 'enemy'
const failedResult = battle.resolveEnemyPhase(failedTactic, scenarios.FARM_BATTLE)
assert.equal(failedResult.state.phase, 'lost', '无视公开暗器计谋必须可能导致团灭失败')

const firstEnemy = state0.enemies[0].uid
const state1 = battle.applyHeroAction(state0, 'beimang', 'daduan', firstEnemy)
const state2 = battle.applyHeroAction(state1, 'xiaoman', 'zhiliao', undefined, 'beimang')
const hpBeforeLastHero = Object.fromEntries(Object.entries(state2.heroes).map(([id, hero]) => [id, hero.hp]))
const state3 = battle.applyHeroAction(state2, 'yuenu', 'huwei', undefined, 'beimang')
assert.equal(state3.phase, 'enemy', '最后一名我方角色行动后应进入独立敌方阶段')
assert.deepEqual(
  Object.fromEntries(Object.entries(state3.heroes).map(([id, hero]) => [id, hero.hp])),
  hpBeforeLastHero,
  '敌方伤害不应混入我方最后一招',
)
const enemyResult = battle.resolveEnemyPhase(state3, scenarios.FARM_BATTLE)
assert.ok(enemyResult.steps.length > 0, '敌方阶段应提供逐个演出的行动步骤')
assert.equal(
  battle.applyHeroAction(state0, 'yuenu', 'huwei', undefined, 'yuenu'),
  state0,
  '青翎不能把自己选为护卫目标',
)

const pursuitGuard = battle.createBattle(scenarios.PURSUIT_BATTLE)
assert.equal(
  battle.applyHeroAction(pursuitGuard, 'mengjia', 'huwei', undefined, 'mengjia'),
  pursuitGuard,
  '孟甲不能把自己选为护卫目标',
)

const dualGuardConfig = {
  ...scenarios.FARM_BATTLE,
  heroPresent: { mengjia: true },
}
let guardedByYuenu = battle.createBattle(dualGuardConfig)
guardedByYuenu = battle.applyHeroAction(guardedByYuenu, 'yuenu', 'huwei', undefined, 'beimang')
const mengjiaHpBeforeGuard = guardedByYuenu.heroes.mengjia.hp
const yuenuHpBeforeGuard = guardedByYuenu.heroes.yuenu.hp
guardedByYuenu.enemies.forEach((enemy, index) => {
  enemy.intent = index === 0
    ? { type: 'attack', target: 'beimang', dmg: 8, label: '测试攻击' }
    : { type: 'attack', target: 'beimang', dmg: 0, label: '测试待命' }
})
guardedByYuenu.acted = ['beimang', 'mengjia', 'xiaoman', 'yuenu']
guardedByYuenu.phase = 'enemy'
const guardedByYuenuResult = battle.resolveEnemyPhase(guardedByYuenu, dualGuardConfig).state
assert.equal(guardedByYuenuResult.heroes.mengjia.hp, mengjiaHpBeforeGuard, '青翎护卫时不得错误让孟甲承伤')
assert.equal(guardedByYuenuResult.heroes.yuenu.hp, yuenuHpBeforeGuard - 4, '护卫伤害必须由实际施放者承受')

const lethalTutorial = tutorial.createTutorial()
lethalTutorial.hp = 1
lethalTutorial.enemies[0].intent = { type: 'attack', dmg: 2, label: '测试致命攻击' }
lethalTutorial.enemies[1].intent = { type: 'attack', dmg: 0, label: '测试待命' }
const failedTutorial = tutorial.endTutorialTurn(lethalTutorial)
assert.equal(failedTutorial.phase, 'lost', 'S6 教学战受到致命伤害必须失败')
assert.equal(failedTutorial.hp, 0, '教学战失败时生命不得伪装保留 1 点')

const costlyFarm = battle.createBattle(scenarios.farmBattleForOutcome({
  s6_cart_through: false,
  s6_mengjia_saved: false,
}))
assert.equal(costlyFarm.heroes.beimang.hp, 10, '谷口失守应加重农家战开局伤势')
assert.equal(costlyFarm.heroes.yuenu.hp, 20, '孟甲未由玩家救出时，青翎折返救人应带伤进入农家战')

const ambushEscort = scenarios.escortBattleForTactic('ambush')
const valleyEscort = scenarios.escortBattleForTactic('valley')
const rearEscort = scenarios.escortBattleForTactic('rear')
assert.notDeepEqual(ambushEscort.initialEnemies, scenarios.ESCORT_BATTLE.initialEnemies, '上山设伏应改变 C4 开局敌阵')
assert.equal(valleyEscort.heroHp.yuenu.hp, 20, '入谷诱敌应兑现青翎负伤')
assert.equal(rearEscort.heroHp.beimang.hp, 19, '自领断后应兑现北芒负伤')

// C4 护送战（defend）：守满回合即胜；团灭则败（战败重试点）
assert.equal(scenarios.ESCORT_BATTLE.mode, 'defend')
assert.equal(scenarios.ESCORT_BATTLE.defendRounds, 5)
let escort = battle.createBattle(scenarios.ESCORT_BATTLE)
for (let r = 0; r < 5 && escort.phase !== 'won' && escort.phase !== 'lost'; r++) {
  for (const hero of ['beimang', 'xiaoman', 'yuenu']) {
    if (battle.canAct(escort, hero)) {
      const target = escort.enemies[0]?.uid
      escort = target != null
        ? battle.applyHeroAction(escort, hero, hero === 'xiaoman' ? 'zhidu' : hero === 'yuenu' ? 'jiejian' : 'tuji', target)
        : escort
    }
  }
  if (escort.phase === 'enemy') escort = battle.resolveEnemyPhase(escort, scenarios.ESCORT_BATTLE).state
}
assert.ok(escort.phase === 'won' || escort.phase === 'lost', 'C4 护送战必须在有限回合内分出胜负')
if (escort.phase === 'won') {
  assert.ok(escort.round > scenarios.ESCORT_BATTLE.defendRounds, 'defend 胜利必须发生在守满回合之后')
}
// 团灭判负
let wipe = battle.createBattle(scenarios.ESCORT_BATTLE)
wipe.heroes.beimang.hp = 0
wipe.heroes.xiaoman.hp = 0
wipe.heroes.yuenu.hp = 1
wipe = battle.applyHeroAction(wipe, 'yuenu', 'jiejian', wipe.enemies[0].uid)
if (wipe.phase === 'enemy') wipe = battle.resolveEnemyPhase(wipe, scenarios.ESCORT_BATTLE).state
assert.equal(wipe.phase, 'lost', '全员倒下必须判负（战败重试点入口）')

const crossbowState = battle.createBattle(scenarios.HUIPAI_FINAL_BATTLE)
crossbowState.phase = 'enemy'
const crossbowResult = battle.resolveEnemyPhase(crossbowState, scenarios.HUIPAI_FINAL_BATTLE)
const crossbowStep = crossbowResult.steps.find((step) => crossbowState.enemies.find((enemy) => enemy.uid === step.uid)?.specKey === 'nushou')
assert.equal(crossbowStep?.style, 'crossbow', '回旆盟弩手必须走弩矢轨迹，不能退化为近身挥砍')

const mountedState = battle.createBattle(scenarios.PURSUIT_BATTLE)
const rider = mountedState.enemies.find((enemy) => enemy.specKey === 'qishou')
assert.ok(rider, '追击战必须存在骑影杀手')
rider.intent = { type: 'attack', target: 'beimang', dmg: 6, label: '测试：骑影冲杀' }
mountedState.phase = 'enemy'
const mountedResult = battle.resolveEnemyPhase(mountedState, scenarios.PURSUIT_BATTLE)
assert.equal(mountedResult.steps.find((step) => step.uid === rider.uid)?.style, 'mounted', '骑影杀手近战必须走骑影冲杀轨迹')

// —— 素材引用 ——
function walkFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath]
  })
}

for (const entry of manifest) {
  assert.ok(fs.existsSync(path.join(publicRoot, entry.file)), `配音清单文件不存在：${entry.file}`)
}

const sourceFiles = walkFiles(path.join(projectRoot, 'src')).filter((file) => /\.(ts|tsx|css)$/.test(file))
const referencedPublicFiles = new Set()
for (const sourceFile of sourceFiles) {
  const source = fs.readFileSync(sourceFile, 'utf8')
  for (const match of source.matchAll(/['"(](\/?assets\/[^'")\s]+|sfx\/[^'")\s]+\.mp3|bgm\/[^'")\s]+\.mp3)/g)) {
    referencedPublicFiles.add(match[1].replace(/^\//, ''))
  }
}
for (const relativePath of referencedPublicFiles) {
  assert.ok(fs.existsSync(path.join(publicRoot, relativePath)), `代码引用的素材不存在：${relativePath}`)
}

const battleSceneSource = fs.readFileSync(path.join(projectRoot, 'src/sections/BattleScene.tsx'), 'utf8')
const tutorialBattleSceneSource = fs.readFileSync(path.join(projectRoot, 'src/sections/TutorialBattleScene.tsx'), 'utf8')
const configuredEffects = new Set(
  [...battleSceneSource.matchAll(/effect:\s*'([^']+)'/g)].map((match) => match[1]),
)
for (const effect of ['thrust', 'sword', 'break', 'poison', 'needle', 'heal', 'guard', 'smoke', 'winch']) {
  assert.ok(configuredEffects.has(effect), `技能特效映射缺少：${effect}`)
}
assert.ok(configuredEffects.size >= 9, '武器与技能不能退化为同一种通用命中特效')
assert.ok(battleSceneSource.includes('hero_mengjia_idle_v2.webp'), '孟甲战斗形象必须使用与半身像统一的新版素材')
assert.ok(!/\.scrollIntoView\s*\(/.test(battleSceneSource), '战斗日志不得用 scrollIntoView 带动整页下跳')
assert.ok(
  battleSceneSource.includes('log.scrollTop = log.scrollHeight'),
  '战斗日志自动跟随必须限制在日志容器内部',
)
assert.ok(!/\.scrollIntoView\s*\(/.test(tutorialBattleSceneSource), '教学战日志不得用 scrollIntoView 带动整页下跳')
assert.ok(
  tutorialBattleSceneSource.includes('log.scrollTop = log.scrollHeight'),
  '教学战日志自动跟随必须限制在日志容器内部',
)
assert.ok(
  tutorialBattleSceneSource.includes('playStrikeAnimation') &&
    tutorialBattleSceneSource.includes('playHitReaction') &&
    tutorialBattleSceneSource.includes('actingEnemy'),
  '教学战必须使用真实冲刺、受击三段式和逐敌演出，不能退回定时批量结算',
)
assert.ok(
  battleSceneSource.includes("unlockSfxFile('environment')"),
  '通用战斗必须在第一次玩家操作时重试环境音乐',
)
assert.ok(
  battleSceneSource.includes('cfg.environmentSfx') &&
    battleSceneSource.includes('enemy_crossbow_idle_v1.webp') &&
    battleSceneSource.includes('enemy_rider_idle_v1.webp'),
  '战斗必须按场景选择环境音，并为弩手与骑影使用对应立绘',
)
const battlefieldSource = fs.readFileSync(path.join(projectRoot, 'src/components/CinematicBattlefield.tsx'), 'utf8')
assert.ok(
  battlefieldSource.includes("weather === 'rain'") && !battlefieldSource.includes('<div className="cinematic-battlefield__rain" />\n      {speedLines'),
  '雨幕必须由场景天气控制，不能在所有战斗中常驻',
)
const defensePanelSource = fs.readFileSync(path.join(projectRoot, 'src/ui/DefenseBattlePanel.tsx'), 'utf8')
assert.ok(
  defensePanelSource.includes("playSfxFile('sfx/city_siege.mp3'") && defensePanelSource.includes("config.id === 'c7_evac'"),
  'C7 撤离战必须在入场或首次出招时恢复城战环境音乐',
)
const appSource = fs.readFileSync(path.join(projectRoot, 'src/App.tsx'), 'utf8')
assert.ok(appSource.includes("choice === 'troops' ? 'c7_troops'"), '截残军选择必须进入独立追截玩法')
assert.ok(appSource.includes("case 's1_statement'"), '序章必须在长对白前接入亲见取证互动')
const menuHiddenDeclaration = appSource.match(/const MENU_HIDDEN[\s\S]*?\]\)/)?.[0] ?? ''
for (const stage of ['c7_fire', 'c7_troops', 'c7_evac']) {
  assert.ok(menuHiddenDeclaration.includes(`'${stage}'`), `${stage} 玩法中不得打开不暂停计时的游戏菜单`)
}
const fireRescueSource = fs.readFileSync(path.join(projectRoot, 'src/ui/FireRescue.tsx'), 'utf8')
const pursuitInterceptSource = fs.readFileSync(path.join(projectRoot, 'src/ui/PursuitIntercept.tsx'), 'utf8')
assert.ok(fireRescueSource.includes('grid-cols-2'), '手机火场必须至少双列展示简册，避免限时中长距离滚动')
assert.ok(pursuitInterceptSource.includes('grid-cols-3'), '手机追截必须同屏展示三条逃路')

console.log('verify-demo: 全部通过（十八场结构 / flags / 存档 / 分支渲染 / defend 战斗 / 特效 / 素材）')
