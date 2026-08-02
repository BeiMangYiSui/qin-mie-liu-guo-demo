// 文案核对：story.ts 十八场 + 附录挂载数据 vs demo-对白旁白通览-v3.md（v3.5 冻结稿）
// 方向 A：冻结稿每个内容行（去施工注）必须能在对应场景文本中找到（逐字，规范化后子串）。
// 方向 B：story.ts 每个展示字符串必须能在冻结稿该节全文找到（不得多出冻结稿没有的文字）。
// 抽查五场（S1/S6/S9/C3/C8）双向严格；其余场次方向 A 严格、方向 B 严格。
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import * as esbuild from 'esbuild'

const projectRoot = process.cwd()
const md = fs.readFileSync(path.join(projectRoot, 'demo-对白旁白通览-v3.md'), 'utf8')

const bundle = await esbuild.build({
  stdin: {
    contents: `export * as story from './src/game/story.ts'`,
    resolveDir: projectRoot,
    sourcefile: 'verify-entry.ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})
const { story } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)

// 规范化：仅保留汉字/字母/数字（引号、括号、标点差异全部抹平）
const norm = (s) => s.normalize('NFKC').replace(/[^\p{Script=Han}\p{L}\p{N}]/gu, '')

const SPEAKERS = [
  '公孙钺', '北芒', '郑国', '狱卒', '小吏', '越女', '青翎', '阿芒', '小满', '孟甲',
  '农家老翁', '商队老执事', '军吏', '姚贾', '秦王', '韩王', '韩王安', '守谷口老卒',
  '韩地伤兵', '韩老伯', '韩老媪', '李斯', '秦卒',
]
const speakerRe = new RegExp(`^(${SPEAKERS.join('|')})(?=（|：)`)

// 说话人前缀深加工：`名：`→去名与冒号；`名（动作）：`→去名留括注；`（内心）：`→去内心标记
const stripSpeaker = (line) => line.replace(speakerRe, '').replace(/^：/, '').replace(/^（内心）：/, '')

const SECTION_BY_SCENE = {
  s1_anfa: 'S1', s2_shenxun: 'S2', s3_chaqu: 'S3', s4_andun: 'S4', s5_zhuishi: 'S5',
  s6_fusha: 'S6', s7_xiandai: 'S7', s8_nongjia: 'S8', s9_tongxing: 'S9', s10_guace: 'S10',
  c1_pinan: 'C1', c2_zhangtai: 'C2', c3_guoshu: 'C3', c4_husong: 'C4', c5_shouxiang: 'C5',
  c6_yiying: 'C6', c7_huoqi: 'C7', c8_zhangmo: 'C8',
}

// 按 `## Sx`/`## Cx` 节切分冻结稿
const sections = {}
{
  const parts = md.split(/^## /m).slice(1)
  for (const part of parts) {
    const key = part.slice(0, part.indexOf(' '))
    sections[key] = part
  }
}

// 冻结稿施工注：整行括号注不进游戏文本（A 方向剔除；B 方向仍计入节全文）
const CONSTRUCTION_LINE = /^（[^）]*）\s*$/

// 场景级豁免：冻结稿该行与游戏文本存在结构性差异（合行/拆分/汇总行），逐条人工核对后豁免；
// 豁免行的组成部分仍须逐条命中（MD_LINE_PARTS）。
const MD_LINE_EXEMPTIONS = {
  s2_shenxun: ['"人，是你报的。"'], // 已去说话人前缀的行
  c4_husong: ['守谷口的老卒', '求情过——', '未求情——', '- 「上山」', '- 「入谷」', '- 「断后」'],
  c8_zhangmo: ['保户籍——抢到户籍', '截残军——', '护疫营——存活率高'],
}

// 豁免行的组成部分核验（规范化后须为游戏文本子串）
const MD_LINE_PARTS = {
  s2_shenxun: ['人，是你报的。', '你去问。'],
  c4_husong: [
    '我带老卒占两侧高地。', '守得稳，伤亡重',
    '我引他们进谷。', '杀伤最大，她负伤',
    '我断后。', '族人最安全，他伤最重',
    '那次，你替我说情。', '这次，我替你守口。',
    '那次，你没开口。', '今日我守这里。不为还债，为军令。',
  ],
}

// 游戏文本豁免：任务书授权的舞台提示改写（§2「推过狱牌类动作 → stage」），不进 B 方向比对
const STORY_TEXT_EXEMPTIONS = {
  s2_shenxun: ['推过狱牌。'],
}

function mdContentLines(sectionText) {
  return sectionText
    .split('\n')
    .slice(1) // 去节标题行（如「S1 案发」）
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !l.startsWith('#'))
    .filter((l) => !l.startsWith('【')) // 轨道标签行
    .filter((l) => !CONSTRUCTION_LINE.test(l)) // 整行施工注
    .map(stripSpeaker)
}

function storyDisplayStrings(scene) {
  const out = []
  const pushLines = (lines) => {
    for (const l of lines ?? []) out.push(l.text)
  }
  pushLines(scene.lines)
  for (const variant of scene.lineVariants ?? []) pushLines(variant.lines)
  pushLines(scene.continuation?.lines)
  for (const variant of scene.continuation?.lineVariants ?? []) pushLines(variant.lines)
  if (scene.choice) {
    out.push(scene.choice.prompt)
    for (const option of scene.choice.options) {
      out.push(option.label, option.desc)
      pushLines(option.response)
    }
    pushLines(scene.choice.after)
  }
  return out
}

const STRICT = ['s1_anfa', 's6_fusha', 's9_tongxing', 'c3_guoshu', 'c8_zhangmo']
const problems = []

for (const [sceneId, sectionKey] of Object.entries(SECTION_BY_SCENE)) {
  const scene = story.SCENES[sceneId]
  const sectionText = sections[sectionKey]
  assert.ok(scene, `缺场景 ${sceneId}`)
  assert.ok(sectionText, `冻结稿缺节 ${sectionKey}`)

  const storyJoined = norm(storyDisplayStrings(scene).join('\n'))
  const mdJoined = norm(sectionText)
  const exemptions = MD_LINE_EXEMPTIONS[sceneId] ?? []
  const storyExemptions = STORY_TEXT_EXEMPTIONS[sceneId] ?? []

  // 方向 A：冻结稿内容行 ⊆ 游戏文本
  for (const line of mdContentLines(sectionText)) {
    if (exemptions.some((ex) => line.startsWith(ex))) continue
    const n = norm(line)
    if (n.length === 0) continue
    if (!storyJoined.includes(n)) problems.push(`A ${sceneId} 冻结稿行未进游戏：${line}`)
  }

  // 豁免行的组成部分仍须命中
  for (const part of MD_LINE_PARTS[sceneId] ?? []) {
    if (!storyJoined.includes(norm(part))) problems.push(`A ${sceneId} 豁免行组成部分缺失：${part}`)
  }

  // 方向 B：游戏文本 ⊆ 冻结稿节全文
  for (const text of storyDisplayStrings(scene)) {
    if (storyExemptions.includes(text)) continue
    const n = norm(text)
    if (n.length === 0) continue
    if (!mdJoined.includes(n)) problems.push(`B ${sceneId} 游戏文本超出冻结稿：${text}`)
  }
}

// C8 军报五种变体逐条核验（values 为冻结稿原文）
const C8_REPORTS = [
  '户籍主档在，人名可循。',
  '户籍主档焚毁，其余三册得存。',
  '残军溃散，北道者寡。',
  '疫营伤者，多数得活。',
  '疫营伤者，得活者半。',
]
const c8 = story.SCENES.c8_zhangmo
const c8AllVariantText = [c8.lines, ...(c8.lineVariants ?? []).map((v) => v.lines)]
  .flat()
  .map((l) => norm(l.text))
for (const report of C8_REPORTS) {
  if (!c8AllVariantText.includes(norm(report))) problems.push(`C8 军报变体缺失：${report}`)
  if (!norm(sections.C8).includes(norm(report))) problems.push(`C8 军报变体与冻结稿不符：${report}`)
}

// 附录挂载数据逐条核验（story.ts 灌入文本 vs 冻结稿附录全文）
const appendix = md.slice(md.indexOf('## 增补台词'))
const appendixNorm = norm(appendix)
const appendixStrings = [
  // S3 查案
  ...story.S3_CHAAN.ledgers,
  ...story.S3_CHAAN.findings.map((f) => f.text),
  story.S3_CHAAN.fallback,
  // 史乘
  story.SHICHENG_FOOTER,
  story.SHICHENG_LOCKED,
  ...story.SHICHENG_CARDS.flatMap((c) => [c.history, c.experienced]),
  // 章末结算
  story.C8_SETTLE.plead.pleaded,
  story.C8_SETTLE.plead.silent,
  story.C8_SETTLE.c7.register,
  story.C8_SETTLE.c7.troops,
  story.C8_SETTLE.c7.camp,
  story.C8_SETTLE.hanhui.reunited,
  story.C8_SETTLE.hanhui.lost,
  story.C8_SETTLE.soldier,
  ...story.C8_SETTLE.ratings.map((r) => r.line),
  // C7 两分支
  ...story.C7_FIRE.intro,
  story.C7_FIRE.forcedEvac,
  story.C7_FIRE.savedHuji,
  story.C7_FIRE.lostHuji,
  ...story.C7_EVAC.intro,
  story.C7_EVAC.xiaomanLine.text,
  story.C7_EVAC.survivalHigh,
  story.C7_EVAC.survivalLow,
  // 战败旁白
  story.DEFEAT_NARRATION.s6,
  story.DEFEAT_NARRATION.s9,
  story.DEFEAT_NARRATION.c4,
]
for (const text of appendixStrings) {
  // 附录原文的栏目标签（【史书大意】【你经历的】（页脚常驻）等）为施工标注，不纳入比对
  const n = norm(text)
  if (!appendixNorm.includes(n)) problems.push(`附录挂载数据与冻结稿不符：${text}`)
}

if (problems.length > 0) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`check-story-text: 十八场逐字核对通过（抽查严格双向：${STRICT.join('、')}）；附录挂载数据 ${appendixStrings.length} 条全中`)
