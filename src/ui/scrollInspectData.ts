import type { ScrollInspectStack } from './ScrollInspect'

// S3 三叠简：封面先给查验方向，翻开后才呈现记录结果。
export const S3_SCROLL_STACKS: readonly ScrollInspectStack[] = [
  {
    id: 'qukou',
    label: '渠口查验记档·十年',
    cover: '渠工营逐日查验，十年记录俱在。',
    detail: '渠口——十年，无一错漏。',
  },
  {
    id: 'rujing',
    label: '隐密署入境记档',
    cover: '核对韩使入秦、离秦的关津簿。',
    detail: '入境——韩使，有入，无出。',
    finding: {
      title: '入境——韩使，有入，无出。',
      detail: '',
    },
  },
  {
    id: 'guanyi',
    label: '秦韩馆驿传讯记档',
    cover: '查验馆驿往来与递送日期。',
    detail: '馆驿——每隔五日，向韩境传讯一次。',
    finding: {
      title: '馆驿——每隔五日，向韩境传讯一次。',
      detail: '',
    },
  },
]

export const C1_SCROLL_STACKS: readonly ScrollInspectStack[] = [
  {
    id: 'mengjia',
    label: '孟甲·行囊暗层',
    cover: '孟甲记得：要紧物证从不只放一层。',
    detail: '行囊底布比别处厚，压线下藏着一道旧封口。',
    finding: {
      title: '行囊另有暗层。',
      detail: '尺寸正好容下一卷密令。',
    },
  },
  {
    id: 'qingling',
    label: '青翎·行囊',
    cover: '青翎把人拖出重围时，行囊一直随身。',
    detail: '束带未断，外层虽被翻动，底部封线仍完整。',
    finding: {
      title: '暗层未被伏兵发现。',
      detail: '坠坡之后，没有旁人碰过这道封线。',
    },
  },
  {
    id: 'xiaoman',
    label: '小满·透骨钉',
    cover: '小满留下了从北芒胸口取出的透骨钉。',
    detail: '钉尾没有秦军匠作戳记，淬火纹也不是官坊制式。',
    finding: {
      title: '透骨钉出自私坊。',
      detail: '伏杀者不像韩军，更像受人豢养的私兵。',
    },
  },
]
