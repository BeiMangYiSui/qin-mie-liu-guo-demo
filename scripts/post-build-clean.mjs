// 构建后清理：移除不参与发布的开发/归档目录
import fs from 'node:fs'
import path from 'node:path'

const dist = path.join(process.cwd(), 'dist')
const toRemove = [
  'assets/review',
  'assets/unused',
]

for (const rel of toRemove) {
  const target = path.join(dist, rel)
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true })
    console.log(`Removed ${rel}`)
  }
}

// GitHub Pages: 创建 .nojekyll 防止 Jekyll 忽略 _ 开头目录
fs.writeFileSync(path.join(dist, '.nojekyll'), '')
console.log('Created .nojekyll')

console.log('Post-build clean done.')
