export interface CaseFragment {
  id: 'mengjia' | 'qingling' | 'xiaoman'
  owner: string
  source: string
  placeholder: string
}

export const CASE_FRAGMENTS: readonly CaseFragment[] = [
  {
    id: 'mengjia',
    owner: '孟甲',
    source: '行囊暗层',
    placeholder: '行囊底布下藏着一道旧封口。',
  },
  {
    id: 'qingling',
    owner: '青翎',
    source: '行囊',
    placeholder: '束带未断，暗层没有被伏兵发现。',
  },
  {
    id: 'xiaoman',
    owner: '小满',
    source: '透骨钉',
    placeholder: '钉尾无军匠戳记，出自私坊。',
  },
] as const
