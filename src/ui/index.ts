export { default as ChapterCard } from './ChapterCard'
export type { ChapterCardProps, ChapterDescriptor, ChapterDirection } from './ChapterCard'

export { default as C8ReportPanel } from './C8ReportPanel'
export type { C8ReportPanelProps } from './C8ReportPanel'
export { C8_FIXED_REPORTS, C8_REPORT_VARIANTS, resolveC8ReportVariant } from './c8ReportData'
export type { C7Choice, MilitaryReportSection } from './c8ReportData'

export { default as C7ChoicePanel } from './C7ChoicePanel'
export type { C7ChoicePanelProps } from './C7ChoicePanel'
export {
  C4_TACTIC_LABELS,
  C7_CHOICE_OPTIONS,
  C7_LOCKED_CHOICE_BY_TACTIC,
  C7_LOCK_REASON_BY_TACTIC,
} from './c7ChoiceData'
export type { C4Tactic, C7ChoiceOption } from './c7ChoiceData'
export { C4_TACTIC_REPORTS } from './c4TacticData'
export type { C4TacticReport } from './c4TacticData'

export { default as ScrollInspect } from './ScrollInspect'
export type {
  ScrollInspectFinding,
  ScrollInspectProps,
  ScrollInspectStack,
} from './ScrollInspect'
export { S3_SCROLL_STACKS, C1_SCROLL_STACKS } from './scrollInspectData'

export { default as CaseFragmentBoard } from './CaseFragmentBoard'
export type { CaseFragmentBoardProps } from './CaseFragmentBoard'
export { CASE_FRAGMENTS } from './caseFragmentData'
export type { CaseFragment } from './caseFragmentData'

export { default as ShichengPage } from './ShichengPage'
export type { ShichengPageProps } from './ShichengPage'
export { SHICHENG_CARDS } from './shichengData'
export type { ShichengCard } from './shichengData'

export { default as SettlePanel } from './SettlePanel'
export type { SettlePanelProps } from './SettlePanel'
export {
  SETTLE_RATING_LABELS,
  branchOutcomeSucceeded,
  calculateSettleRating,
} from './settleData'
export type { SettleRating } from './settleData'

export { default as FireRescue } from './FireRescue'
export type { FireRescueProps } from './FireRescue'
export { REGISTER_PILES, takeRegister } from './fireRescueData'
export type { RegisterPile } from './fireRescueData'

export { default as DefenseBattlePanel } from './DefenseBattlePanel'
export type { DefenseBattlePanelProps } from './DefenseBattlePanel'

export { default as BattleRetryOverlay } from './BattleRetryOverlay'
export type { BattleRetryOverlayProps } from './BattleRetryOverlay'

export { default as UiMechanicsPreview } from './UiMechanicsPreview'
export { default as TaskCPreview } from './TaskCPreview'

export { C4_ESCORT_BATTLE_CONFIG, EVAC_BATTLE_CONFIG } from '../game/defenseBattle'
