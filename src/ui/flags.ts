import type { StoryFlags, StoryFlagValue } from '../game/save'

export interface FlagCondition {
  flag: string
  equals?: StoryFlagValue
  exists?: boolean
  /** 数组或字符串 flag 包含指定子项（如 c7_saved_registers 含 'huji'） */
  contains?: string
}

export interface FlagLineVariant<T> {
  when: FlagCondition | readonly FlagCondition[]
  match?: 'all' | 'any'
  lines: readonly T[]
}

export interface ChoiceFlagBinding {
  flag: string
  values: Readonly<Record<string, StoryFlagValue>>
}

export function matchesFlagCondition(flags: StoryFlags, condition: FlagCondition): boolean {
  const value = flags[condition.flag]
  if (condition.exists !== undefined) {
    const exists = value !== undefined
    if (exists !== condition.exists) return false
  }
  if ('equals' in condition && value !== condition.equals) return false
  if (condition.contains !== undefined) {
    if (Array.isArray(value)) return value.includes(condition.contains)
    if (typeof value === 'string') return value.split(',').includes(condition.contains)
    return false
  }
  return true
}

export function matchesFlagVariant<T>(flags: StoryFlags, variant: FlagLineVariant<T>): boolean {
  const conditions = Array.isArray(variant.when) ? variant.when : [variant.when]
  if (conditions.length === 0) return true
  return variant.match === 'any'
    ? conditions.some((condition) => matchesFlagCondition(flags, condition))
    : conditions.every((condition) => matchesFlagCondition(flags, condition))
}

/**
 * 按声明顺序返回第一个满足 flag 条件的 lines；没有命中时保留原 lines。
 * 调用者可用多个条件组合任意后续场景分支，不需要在渲染组件里写角色专用判断。
 */
export function selectLinesByFlags<T>(
  fallback: readonly T[],
  variants: readonly FlagLineVariant<T>[] | undefined,
  flags: StoryFlags,
): readonly T[] {
  return variants?.find((variant) => matchesFlagVariant(flags, variant))?.lines ?? fallback
}

export function flagPatchForChoice(binding: ChoiceFlagBinding | undefined, tag: string): Partial<StoryFlags> {
  if (!binding || !(tag in binding.values)) return {}
  return { [binding.flag]: binding.values[tag] }
}
