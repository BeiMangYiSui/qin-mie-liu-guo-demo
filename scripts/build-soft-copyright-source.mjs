// 软著申请辅助：按当前 src/ 真实代码自动生成 60 页源代码鉴别材料
// 使用： node scripts/build-soft-copyright-source.mjs
// 输出： docs/soft-copyright/source-soft-copyright-秦灭六国-V1.0.txt
//       docs/soft-copyright/source-soft-copyright-秦灭六国-V1.0.md
// 说明：仅做代码合并和页眉标注；每页前 50 行为主，不足 60 页时打印全部文件。
//       提交前请按官方要求补充页码、签字和身份证明。

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const srcRoot = path.join(projectRoot, 'src')
const outDir = path.join(projectRoot, 'docs', 'soft-copyright')

const SOFT_NAME = '秦灭六国'
const SOFT_VERSION = 'V1.0'

// 顺序：核心业务逻辑 → 数据 → UI 数据 → UI 实现
const SOURCE_FILES = [
  'game/story.ts',
  'game/battle.ts',
  'game/scenarios.ts',
  'game/tutorial.ts',
  'game/save.ts',
  'game/defenseBattle.ts',
  'game/battleRetry.ts',
  'game/audio.ts',
  'game/animationEngine.ts',
  'ui/flags.ts',
  'ui/caseFragmentData.ts',
  'ui/c7ChoiceData.ts',
  'ui/c8ReportData.ts',
  'ui/fireRescueData.ts',
  'ui/pursuitInterceptData.ts',
  'ui/scrollInspectData.ts',
  'ui/settleData.ts',
  'ui/shichengData.ts',
  'ui/UiMechanicsPreview.tsx',
  'ui/ChapterCard.tsx',
  'ui/CaseFragmentBoard.tsx',
  'ui/C7ChoicePanel.tsx',
  'ui/C8ReportPanel.tsx',
  'ui/SettlePanel.tsx',
  'ui/ShichengPage.tsx',
  'ui/WitnessStatementPanel.tsx',
  'ui/FireRescue.tsx',
  'ui/PursuitIntercept.tsx',
  'ui/DefenseBattlePanel.tsx',
  'ui/ScrollInspect.tsx',
  'sections/TitleScreen.tsx',
  'sections/StoryScene.tsx',
  'sections/BattleScene.tsx',
  'sections/TutorialBattleScene.tsx',
]

const PAGE_HEADER = (page) =>
  `${SOFT_NAME} ${SOFT_VERSION} | 源程序鉴别材料 | 第 ${page} 页`

const LINES_PER_PAGE = 50
const PAD_LINE = '//' + ' '.repeat(80) + '//'

function paginate(lines) {
  const pages = []
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + LINES_PER_PAGE))
  }
  return pages
}

function padPage(pageLines, pageNo) {
  const header = PAGE_HEADER(pageNo)
  const body = pageLines.join('\n')
  // 补足到至少 LINES_PER_PAGE 行；空白行避免出现尾页少行被怀疑
  const remaining = Math.max(0, LINES_PER_PAGE - pageLines.length)
  const filler = remaining > 0 ? Array(remaining).fill(PAD_LINE).join('\n') : ''
  return `${header}\n${'='.repeat(header.length)}\n${body}${filler ? '\n' + filler : ''}\n`
}

async function loadFile(rel) {
  const abs = path.join(srcRoot, rel)
  const text = await readFile(abs, 'utf8')
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .split('\n')
}

async function loadAll() {
  const blocks = []
  for (const rel of SOURCE_FILES) {
    const lines = await loadFile(rel)
    const fileHeader = `// === file: src/${rel} ===`
    blocks.push([fileHeader, ...lines, ''])
  }
  return blocks.flat()
}

async function exists(rel) {
  try {
    await readFile(path.join(srcRoot, rel), 'utf8')
    return true
  } catch {
    return false
  }
}

async function main() {
  // 过滤实际存在的文件
  const existing = []
  for (const rel of SOURCE_FILES) {
    if (await exists(rel)) existing.push(rel)
  }
  const missing = SOURCE_FILES.filter((rel) => !existing.includes(rel))

  await mkdir(outDir, { recursive: true })

  const allLines = await loadAll()
  const pages = paginate(allLines)

  const txt = pages
    .map((p, i) => padPage(p, i + 1))
    .join('\n--- PAGE BREAK ---\n\n')

  const meta = `软件名称：${SOFT_NAME}
软件版本：${SOFT_VERSION}
鉴别材料类型：源程序
汇编顺序：${existing.join(' → ')}
${missing.length ? `\n警告：以下源程序模块在 src/ 下未找到，请核对：\n${missing.join('\n')}\n` : ''}`

  const txtPath = path.join(outDir, `source-${SOFT_NAME}-${SOFT_VERSION}.txt`)
  const mdPath = path.join(outDir, `source-${SOFT_NAME}-${SOFT_VERSION}.md`)

  await writeFile(
    txtPath,
    `${meta}\n\n${txt}`,
    'utf8',
  )
  await writeFile(
    mdPath,
    `# 软著源程序鉴别材料\n\n${meta.split('\n').map((l) => '> ' + l).join('\n')}\n\n---\n\n${txt
      .split('\n--- PAGE BREAK ---\n\n')
      .map((p, i) => `## ${PAGE_HEADER(i + 1)}\n\n\`\`\`text\n${p}\n\`\`\``)
      .join('\n\n')}\n`,
    'utf8',
  )

  // 打印简要摘要，便于快速核对
  const totalLines = allLines.length
  const totalPages = pages.length
  const summary = {
    software: SOFT_NAME,
    version: SOFT_VERSION,
    sourceModules: existing,
    missing,
    totalLines,
    totalPages,
    linesPerPage: LINES_PER_PAGE,
    outputText: txtPath,
    outputMarkdown: mdPath,
  }
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
