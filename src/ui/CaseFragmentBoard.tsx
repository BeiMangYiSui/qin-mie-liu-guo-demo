import ScrollInspect from './ScrollInspect'
import { C1_SCROLL_STACKS } from './scrollInspectData'
import { CASE_FRAGMENTS, type CaseFragment } from './caseFragmentData'

export interface CaseFragmentBoardProps {
  onCombine: () => void
  onReveal?: (fragment: CaseFragment, index: number) => void
  combineLabel?: string
}

export default function CaseFragmentBoard({
  onCombine,
  onReveal,
  combineLabel = '并案',
}: CaseFragmentBoardProps) {
  return (
    <ScrollInspect
      sceneId="c1_pinan"
      stacks={C1_SCROLL_STACKS}
      requiredFindings={3}
      eyebrow="C1 · 三证合勘"
      title="拼案"
      instruction="翻开三项证物，异常齐备后方可合并案卷"
      continueLabel={combineLabel}
      fallbackText="三项证物尚不能互相印证，再核对一遍。"
      onReveal={(_, index) => {
        const fragment = CASE_FRAGMENTS[index]
        if (fragment) onReveal?.(fragment, index)
      }}
      onContinue={onCombine}
    />
  )
}
