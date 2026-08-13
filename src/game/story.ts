// 《秦灭六国》Demo — 剧情数据（v3.5 冻结文案灌入版）
//
// 文案基线：demo/demo-对白旁白通览-v3.md（v3.5，已冻结）。台词逐字灌入，仅把引号统一为中文弯引号。
// 文本轨（每条 line 的 type 字段）：
//   narration 旁白 / inner 内心（带角色）/ dialogue 对白 / stage 演出（动作提示）/ caption 字幕（纯画面文字）
// 括号施工注（注：…／教学战：…／细节：…／选择点：…等）不进游戏文本，收在场景 notes 字段。
// 场景 id 与剧情 flag 遵循 docs/秦灭六国-三路任务分配.md §0 接口约定。

import type { FlagLineVariant } from '../ui/flags'
import { C8_REPORT_VARIANTS, resolveC8ReportVariant } from '../ui/c8ReportData'
import { FIRE_TEXT } from '../ui/fireRescueData'
import { SETTLE_TEXT } from '../ui/settleData'

// 任务 E §1 数据去重：史乘卡唯一数据源为 ui/shichengData，这里仅转出口径
export { SHICHENG_CARDS } from '../ui/shichengData'
export type { ShichengCard } from '../ui/shichengData'

export type LineType = 'narration' | 'inner' | 'dialogue' | 'stage' | 'caption'

export interface DialogueLine {
  type: LineType
  speaker: string
  text: string
}

export interface ChoiceOption {
  label: string
  desc: string
  tag: string
  response: DialogueLine[]
}

export interface SceneChoice {
  prompt: string
  options: ChoiceOption[]
  /** 选项回应播完后、场景结束前，各分支共用的收尾行（如 S10 阿芒内心＋序章完） */
  after?: DialogueLine[]
}

/** 战斗或挂载组件之后继续播放的场景后段（S3 查案后、S6/S9/C4 战后、C7 抉择回响） */
export interface SceneContinuation {
  trigger: 'mount' | 'battle' | 'choice'
  lines: DialogueLine[]
  lineVariants?: readonly FlagLineVariant<DialogueLine>[]
}

export interface StoryScene {
  id: string
  chapter: string
  place: string
  /** 场景背景图（/assets/ 下文件名）；缺图时挂最接近的并在交付报告标注 */
  bg?: string
  /** 施工注（不进游戏文本） */
  notes?: string[]
  lines: DialogueLine[]
  /** 按 flag 整表替换 lines（C8 军报变体）；StoryScene 组件可用 prop 覆盖 */
  lineVariants?: readonly FlagLineVariant<DialogueLine>[]
  choice?: SceneChoice
  continuation?: SceneContinuation
}

const N = (text: string): DialogueLine => ({ type: 'narration', speaker: '旁白', text })
/** 军报宣读行：与配音 manifest 的「军报」说话人对齐（Radio_Host 宣读腔） */
const NJ = (text: string): DialogueLine => ({ type: 'narration', speaker: '军报', text })
const D = (speaker: string, text: string): DialogueLine => ({ type: 'dialogue', speaker, text })
const I = (speaker: string, text: string): DialogueLine => ({ type: 'inner', speaker, text })
const ST = (speaker: string, text: string): DialogueLine => ({ type: 'stage', speaker, text })
const C = (text: string): DialogueLine => ({ type: 'caption', speaker: '旁白', text })

export const PRO = '序章 · 郑地伏杀'
export const CH1 = '第一章 · 新郑覆旗'

// ———————————————————————————— 序章 ————————————————————————————

export const S1_BEFORE_TESTIMONY_LINES: DialogueLine[] = [
    N('前 230 年。'),
    N('郑国下狱。逐客令下。'),
    N('驿道上，被逐的车队连绵出城，从清晨排到黄昏。'),
    N('郑国渠修了十年，行将竣工。'),
    N('三日前，隐密署都尉北芒探知——'),
    N('郑国深夜，密见韩使。'),
    N('见了什么，没人知道。'),
    N('谈了什么，没人听见。'),
    N('按律，告到总都尉公孙钺。'),
    D('公孙钺', '“你看见的？”'),
    D('北芒', '“我看见的。”'),
    D('公孙钺', '“那就写上。”（顿）“写你看见的。”'),
]

export const S1_AFTER_TESTIMONY_LINES: DialogueLine[] = [
    N('传闻先一步到了章台——'),
    N('韩国派水工，行疲秦之计。'),
    N('秦王大怒，欲杀郑国。'),
    N('宗室鼓噪：六国之人，皆为间来。'),
    N('秦王令——凡六国客卿，不问官职，限期离秦。'),
    N('李斯在逐。越女亦在逐。'),
    N('告发的人是他。'),
    N('他只报了“见了”。'),
    N('郑国连一句“没见”，都没有说。'),
]

const s1_anfa: StoryScene = {
  id: 's1_anfa',
  chapter: PRO,
  place: '前 230 年 · 咸阳 · 隐密署',
  bg: './assets/bg_heibingtai.webp',
  notes: ['“亲见”与“传闻”之间插入落笔取证互动，让玩家在序章两分钟内第一次参与。'],
  lines: [...S1_BEFORE_TESTIMONY_LINES, ...S1_AFTER_TESTIMONY_LINES],
}

const s2_shenxun: StoryScene = {
  id: 's2_shenxun',
  chapter: PRO,
  place: '咸阳 · 诏狱',
  bg: './assets/bg_zhaoyu.webp',
  lines: [
    N('诏狱。'),
    D('公孙钺', '“人，是你报的。”'),
    ST('公孙钺', '推过狱牌。'),
    D('公孙钺', '“你去问。”'),
    N('郑国坐在狱墙下，瘦得只剩一把骨头，一双眼睛却亮得吓人。'),
    D('北芒', '“韩使深夜见你。谈了什么？”'),
    D('郑国', '“……”'),
    D('北芒', '“你不辩，就是认。”'),
    D('郑国', '“渠上——”（哑声）“今日，进度如何？”'),
    D('狱卒', '“问了三天。他就这一句。”'),
    D('狱卒', '“每日在墙上画一道水线。画完，再擦掉。”'),
    I('北芒', '通敌者不辩，是认罪。'),
    I('北芒', '可他问的，却是渠。'),
  ],
}

const s3_chaqu: StoryScene = {
  id: 's3_chaqu',
  chapter: PRO,
  place: '郑国渠 · 渠口',
  bg: './assets/bg_qukou.webp',
  notes: ['两条★齐后，接 S3 冻结稿内心戏与“我要出境”对白，不动。（查案组件 ScrollInspect 挂载点 s3_chaan）'],
  lines: [
    N('渠口。十年的查验记档，堆了半间屋。'),
    N('北芒带人，翻了一夜。'),
  ],
  continuation: {
    trigger: 'mount',
    lines: [
      I('北芒', '无一错漏。'),
      I('北芒', '渠净，与蓄意坏渠对不上。'),
      I('北芒', '求死，与畏罪对不上。'),
      I('北芒', '他不辩——是有比死更不能说的。'),
      I('北芒', '更像是，有人在封他的口。'),
      N('入境记档：韩使，有入，无出。'),
      N('馆驿记档：每隔五日，向韩境传讯一次。'),
      N('人还在秦。还在等。'),
      D('北芒', '“我要出境。”'),
      D('公孙钺', '“作甚？”'),
      D('北芒', '“追一个等消息的人。”（顿）“韩国密使！”'),
      D('公孙钺', '“好。”'),
    ],
  },
}

const s4_andun: StoryScene = {
  id: 's4_andun',
  chapter: PRO,
  place: '咸阳 · 客舍',
  bg: './assets/bg_keshe.webp',
  lines: [
    D('小吏', '“念在多年辛劳，赐一马十金。两日之内，离秦。”'),
    N('越女交还铜符。一句话没有。'),
    N('同一道令下，楚人李斯也在收拾——行李已束，笔却不停。'),
    D('北芒', '“东出函谷，跟商队走。沿途三处接应，暗号是旧例。”'),
    D('越女', '“你呢？”'),
    D('北芒', '“我去追查韩使。”'),
    D('越女', '“你一个人？”'),
    D('北芒', '“大队人马出不了营。再说——这案子不干净，少一个人沾，少一分祸。”'),
    N('道别说得像公务。'),
    D('商队老执事', '“那女客啊——”（挠头）“过了山口，人就没影了。”'),
  ],
}

const s5_zhuishi: StoryScene = {
  id: 's5_zhuishi',
  chapter: PRO,
  place: '秦韩交界 · 馆驿',
  bg: './assets/bg_zhengdi_dao.webp',
  notes: ['骑影一节为“玩家看见，北芒没看见”。'],
  lines: [
    N('秦韩交界，馆驿。'),
    N('密使滞留的第九日。'),
    N('北芒没带大队。孟甲，十来个老卒。'),
    N('截住了。'),
  ],
  continuation: {
    trigger: 'battle',
    lines: [
      N('密使弃囊遁走——'),
      N('囊中有符信、盘缠，和一卷书。'),
      D('孟甲', '“追不追？”'),
      D('北芒', '（展开那卷书）“不追。”（顿）“人，没有这卷书值钱。”'),
      N('密令副本——署作韩王之命：'),
      N('「坏渠，绝水，而后自裁。事成，郑氏乃活。」'),
      N('原件已被郑国烧毁。这一卷，应是密使回韩缴令的凭证。'),
      N('渠，是他一生心血。坏渠，比死更难。'),
      N('队后远处，一道骑影。一行新蹄印。'),
      D('北芒', '“收队。连夜西返。”'),
    ],
  },
}

export const S6_YUENU_ARRIVAL_LINES: DialogueLine[] = [
  N('绝境回合。'),
  N('山坡上杀下一人。'),
  N('她根本没上商队的车。'),
  D('越女', '“走。”'),
]

export const S6_AFTER_BREAKOUT_LINES: DialogueLine[] = [
  N('包围被她一人一剑撕开。'),
  N('孟甲踉跄着跟上。'),
  N('弩弦骤响。北芒推开了孟甲。'),
  N('钉穿胸口。北芒坠下山坡。'),
  N('有些仗，活下来，就是赢。'),
]

export const S6_AFTER_BREAKOUT_VARIANTS: NonNullable<StoryScene['lineVariants']> = [
  {
    when: { flag: 's6_mengjia_saved', equals: false },
    lines: [
      N('包围被她一人一剑撕开。'),
      N('越女折回辎重旁，将孟甲拖出。左臂被追来的刀锋划开。'),
      N('弩弦骤响。北芒推开了孟甲。'),
      N('钉穿胸口。北芒坠下山坡。'),
      N('有些仗，活下来，就是赢。'),
    ],
  },
]

const s6_fusha: StoryScene = {
  id: 's6_fusha',
  chapter: PRO,
  place: '郑地山道 · 雨夜',
  bg: './assets/bg_zhengdi_yuye.webp',
  notes: [
    '北芒教学战：护住副本、救出孟甲、守住谷口退路；越女登场后接一场单人破围战。',
    '固定——孟甲活、副本在、北芒坠坡；可变——谷口失守程度、旧部伤亡、越女负伤、敌方是否带走线索。',
    '细节：灭口队里，剑路甚不寻常。',
  ],
  lines: [
    N('雨夜。郑地山道。'),
    N('密使没跑出十里，就被灭了口。'),
    N('灭口队问出了他们要的答案——'),
    N('书，在秦人手里。'),
    N('火把从三面围上来。这不是劫道，是要灭口'),
    N('乱军中，孟甲被滚木击中。'),
    D('孟甲', '“校尉！人太多了——”'),
    D('北芒', '“守谷口！书在我身上——冲我来。”'),
  ],
  continuation: {
    trigger: 'battle',
    lines: [...S6_YUENU_ARRIVAL_LINES, ...S6_AFTER_BREAKOUT_LINES],
    lineVariants: S6_AFTER_BREAKOUT_VARIANTS.map((variant) => ({
      ...variant,
      lines: [...S6_YUENU_ARRIVAL_LINES, ...variant.lines],
    })),
  },
}

const s7_xiandai: StoryScene = {
  id: 's7_xiandai',
  chapter: PRO,
  place: '两千年后 · 洛阳 · 古墓博物馆',
  bg: './assets/bg_luoyang_xiandai.webp',
  notes: ['那夜山坡上，北芒尉已经死了。醒来的，是另一个人。不解释机制。'],
  lines: [
    N('两千年后。洛阳，北邙山。'),
    N('古墓博物馆。'),
    N('胸口，同样的位置——'),
    N('一阵剧痛。'),
    C('三个镜头——'),
    C('一枚鸟羽纹的铜符。'),
    C('一场失控的高热。'),
    C('梦里有人喊：北芒尉。'),
  ],
}

const s8_nongjia: StoryScene = {
  id: 's8_nongjia',
  chapter: PRO,
  place: '郑地山脚 · 农家',
  bg: './assets/bg_nongjia.webp',
  notes: ['自本场起，叙述与名册称“阿芒”。'],
  lines: [
    N('透骨钉穿胸，撑不到大营。'),
    N('伏击者身份不明，大营也未必安全——'),
    N('孟甲与越女，只能把他送进山脚农家。'),
    N('农家里还借住着一个韩地医者，名叫小满。'),
    N('她本要入秦——为诏狱里那个修渠的人。'),
    N('函谷戒严，无有路引。她入不了秦。'),
    ST('小满', '剪开衣襟——甲制，是秦军的。'),
    D('农家老翁', '（按住她的手腕）“这是秦人。”'),
    D('小满', '“眼下，他只是伤者。”'),
    N('透骨钉取出，收入药囊。'),
    D('阿芒', '（醒来，看见她）“……青翎。”'),
    D('青翎', '（按住剑）“你叫我什么？”'),
    D('孟甲', '（上前）“校尉。回营的暗号？”'),
    D('阿芒', '“……”'),
    D('孟甲', '“咱们最后分开的渡口？”'),
    D('阿芒', '“……”'),
    D('青翎', '“你给我备的三处接应，”（盯着他）“我一处都没去。”'),
    D('阿芒', '“……”（接不住。）'),
  ],
}

const s9_tongxing: StoryScene = {
  id: 's9_tongxing',
  chapter: PRO,
  place: '郑地山脚 · 农家',
  bg: './assets/bg_nongjia.webp',
  notes: [
    '战斗：阿芒未愈，只能勉强持剑。',
    '她认定的是失忆。她不知道，那夜山坡上，北芒尉已经死了。',
    '青翎台词之间原有一处独立成行（顿）停顿标记，游戏文本不显示。',
  ],
  lines: [N('追兵搜到了农家。')],
  continuation: {
    trigger: 'battle',
    lines: [
      N('一个照面，他横剑，封住了她的右后方。'),
      N('像做过千百次。'),
      D('青翎', '（收剑。走近，盯着他，看了很久）“那手剑，天下只有一个人会使。”'),
      D('青翎', '“那个名字——”（压低）“知道的人，不超过一只手。”'),
      D('青翎', '“剑没忘。人忘了。”'),
      D('青翎', '“北芒——你都忘了吗？”'),
      N('孟甲领着三人回营复命。'),
      I('阿芒', '不识路，不认人，答不上暗号。在这年头，我活不过三天。'),
      D('小满', '“郑水工还在诏狱。总得有人去看他。”（顿）“那年他在鸿沟治水，我在营里帮忙治疫。我认得他。”'),
      D('青翎', '“这条命是我拖回来的。”（顿）“我跟着你——看它落在哪。”'),
    ],
  },
}

const s10_guace: StoryScene = {
  id: 's10_guace',
  chapter: PRO,
  place: '秦军前锋营 · 都尉帐',
  bg: './assets/bg_junzhang.webp',
  notes: ['选择点：求情——减一等；不开口——照数领罚。（写 flag plead_soldier）'],
  lines: [
    D('公孙钺', '“头伤，忘事？”'),
    D('阿芒', '“……嗯。”'),
    D('公孙钺', '（没抬头）“她没走？”'),
    D('阿芒', '“没走。”'),
    D('公孙钺', '（提笔）“越女，记随军剑客。小满，记随军医者。暂挂玄羽偏册。”'),
    D('公孙钺', '“名册我担着。诏令问下来，先问我。”'),
    ST('旁白', '他再没问第二句。'),
    N('同营，一名秦卒——伏击夜与队伍失散，慌了，不敢走大路，绕山迷了向，误了归期。'),
    D('军吏', '“失期。按律，笞八十。”'),
  ],
  choice: {
    prompt: '求情——减一等；不开口——照数领罚。',
    options: [
      { tag: 'plead', label: '求情', desc: '减一等。', response: [] },
      { tag: 'silent', label: '不开口', desc: '照数领罚。', response: [] },
    ],
    after: [
      I('阿芒', '法不问缘由。'),
      I('阿芒', '秦法的重量，第一次落到我手里。'),
      N('序章《郑地伏杀》·完。'),
    ],
  },
}

// ———————————————————————————— 第一章 ————————————————————————————

const c1_pinan: StoryScene = {
  id: 'c1_pinan',
  chapter: CH1,
  place: '秦军前锋营 · 都尉帐',
  bg: './assets/bg_junzhang.webp',
  lines: [
    N('那一夜的最后一段——他没有。'),
    N('书夺到手之后，发生了什么？书，又在哪？'),
    D('孟甲', '“校尉的行囊，有个暗层。”（顿）“要紧的东西，你一向分两层放。”'),
    D('青翎', '（把行囊放到他面前）“你的东西。”（顿）“我没动。”'),
    D('小满', '（取出透骨钉，递过去）“……”'),
    D('青翎', '（接过，看钉尾）“钉尾，没有军匠的号。”（顿）“这不是官造——是私坊的活儿。”'),
  ],
  continuation: {
    trigger: 'mount',
    lines: [
      N('三证合勘。孟甲指点，暗层开启。'),
      N('副本在。'),
      N('外层明卷即使被夺，伏兵也没有发现这道封线。'),
      N('不是通敌，是要挟。'),
      N('钉，私坊所铸；剑，不是韩军路数。'),
      N('动手的不像韩军，更像私兵。'),
    ],
  },
}

const c2_zhangtai: StoryScene = {
  id: 'c2_zhangtai',
  chapter: CH1,
  place: '咸阳 · 章台',
  bg: './assets/bg_zhangtai.webp',
  lines: [
    N('章台。两证一疏。'),
    D('姚贾', '（验那副符信）“符信是真的。”（顿）“人，是韩国密使。”'),
    N('同日，李斯亦上了一疏——'),
    N('“泰山不让土壤，故能成其大；河海不择细流，故能就其深。”'),
    N('实证给了转圜的台阶，雄文给了除令的理由。'),
    D('秦王', '“郑国复职的诏，先压下。”（顿）“郑氏一族入秦之前，今日之事，不出此殿。”'),
    I('阿芒', '史书上说，郑国为韩，行疲秦之计。'),
    I('阿芒', '可眼前的每一页证据，都在说另一件事——'),
    I('阿芒', '史书只记了结果。'),
    I('阿芒', '却没有记下这场要挟。'),
  ],
}

const c3_guoshu: StoryScene = {
  id: 'c3_guoshu',
  chapter: CH1,
  place: '新郑 · 韩宫',
  bg: './assets/bg_hangong.webp',
  lines: [
    N('秦王决意灭韩。'),
    N('大军东出之际，姚贾携国书先行。'),
    D('姚贾', '（对韩王）“释放郑氏一族，安然归秦。”（顿）“若少一人——誓灭韩国，鸡犬不留。”'),
    D('韩王', '（验看录副与封泥拓印，手抖）“这印……”（霍然起身）“这不是寡人的印！”'),
    D('韩王', '“封泥背印——”（咬牙）“是宗室府的旧记。”'),
    D('韩王', '“查。”（哑声）“……放人。”'),
    N('同日，秦王另下一令——玄羽小队，潜入韩境，接应护送。'),
    N('军情简报一角：魏地游士司马朔，在新郑活动。'),
    N('国书即战书。'),
    N('郑氏一族，被拘在宗室别庄，见过押他们的府兵——能指认宗室府的关键人证。'),
    N('王令出了宫门，却管不住宗室府的兵。'),
    N('王令出宫那夜。'),
    N('死战派的私兵，已先一步出城。'),
  ],
}

/** C4 战术后段：守谷口老卒回响（随 S10 求情 flag 双版本） */
const C4_AFTER_PLEAD: DialogueLine[] = [
  D('守谷口老卒', '“那次，你替我说情。”'),
  D('守谷口老卒', '“这次，我替你守口。”'),
  N('郑氏入秦之日，秦王明发——'),
  N('除逐客令。郑国出狱，复职返渠。李斯复官。越女入正册。'),
  N('郑国出狱那天，族人正好入秦。'),
  N('他什么都没问。'),
  N('往北看了一眼，便上了渠。'),
  N('同一处山道。'),
  N('上次，人没守住。'),
  N('这次，守住了。'),
]

const C4_AFTER_SILENT: DialogueLine[] = [
  D('守谷口老卒', '“那次，你没开口。”'),
  D('守谷口老卒', '“今日我守这里。不为还债，为军令。”'),
  ...C4_AFTER_PLEAD.slice(2),
]

const c4_husong: StoryScene = {
  id: 'c4_husong',
  chapter: CH1,
  place: '郑地山道',
  bg: './assets/bg_zhengdi_dao.webp',
  notes: [
    '三选一战术，伤损锁进 C7：上山→C7 护疫营不可选；入谷→C7 截残军不可选；断后→C7 保户籍不可选。',
    '郑氏零伤亡恒定。最坏结局：人人几乎残血。',
  ],
  lines: [
    N('郑地山道。'),
    N('这条道上，有过一个“北芒”。'),
    N('死战派的私兵从山上压下来——'),
    N('灭人证的口，泄困兽之愤。'),
    N('护住车。守到秦军前锋抵达。'),
  ],
  choice: {
    prompt: '三选一战术。',
    options: [
      { tag: 'ambush', label: '上山', desc: '孟甲：“我带老卒占两侧高地。”——守得稳，伤亡重。', response: [] },
      { tag: 'valley', label: '入谷', desc: '青翎：“我引他们进谷。”——杀伤最大，她负伤。', response: [] },
      { tag: 'rear', label: '断后', desc: '阿芒：“我断后。”——族人最安全，他伤最重。', response: [] },
    ],
  },
  continuation: {
    trigger: 'battle',
    lines: C4_AFTER_PLEAD,
    lineVariants: [{ when: { flag: 'plead_soldier', equals: false }, lines: C4_AFTER_SILENT }],
  },
}

const c5_shouxiang: StoryScene = {
  id: 'c5_shouxiang',
  chapter: CH1,
  place: '新郑 · 城门',
  bg: './assets/bg_xinzheng.webp',
  lines: [
    N('大军压境。韩廷裂成三块——'),
    N('要殉国的，要体面的，要北逃的。'),
    N('北逃的，结成了回旆盟——不肯认亡国、图谋复国的一伙。替他们安排退路的，是魏人司马朔。'),
    N('韩王安，素车出降。'),
    N('六国第一个亡国之君。'),
    N('没人知道亡国该怎么办——'),
    N('降书、城门、武库、粮仓、户籍。'),
    N('秦军多跨一步，是抢。少跨一步，是乱。'),
    N('进城。韩人闭门。征粮起摩擦。'),
    N('积尸未敛，污水漫街，伤者涌入。'),
    N('疫，先于安靖而至。'),
  ],
}

const c6_yiying: StoryScene = {
  id: 'c6_yiying',
  chapter: CH1,
  place: '新郑东城 · 疫营',
  bg: './assets/bg_yiying.webp',
  lines: [
    D('韩地伤兵', '（她正替他裹伤）“你是韩人。”（盯着她）“为什么帮秦军？”'),
    D('小满', '“我不是替秦军救人。”（顿）“我救的，是人。”'),
    D('阿芒', '“军令下来了。疫营即刻撤往城外。”'),
    D('小满', '“军令要城。”（顿）“这里要命。”'),
    D('韩老伯', '（逢人便问）“闺女，见着我家蕙儿没有？”'),
    D('小满', '“叫什么？”'),
    D('韩老伯', '“韩蕙。蕙草的蕙。十六了，左眉一颗小痣。”'),
    D('韩老媪', '“城破那天，南市走散的……”'),
    D('小满', '（记在简上）“我替你们留意。”'),
    N('城西骤然响起三声急鼓。不是秦军的号令。'),
    D('孟甲', '（掀帘而入）“回旆盟反扑。官署、武库、北门，三路同时有人。”'),
    D('青翎', '（扣住袖中飞针）“韩王已经降了。他们不是守国，是拿满城的人给自己断后。”'),
    D('阿芒', '“孟甲留下守住疫营。小满带药，青翎看弩手。”（拔剑）“我们三个，打散他们。”'),
  ],
}

/** C7 抉择回响（三处），随 c7_choice 播一段 */
const C7_ECHO: Record<'register' | 'troops' | 'camp', DialogueLine[]> = {
  register: [N('保户籍——若户籍得存，可循册查到韩蕙被编入南市安置营。父女重逢。')],
  troops: [N('截残军——赵地的回旆盟，弱一分。')],
  camp: [N('护疫营——获救的韩医随队北上。魏地，多一队援手的医者。')],
}

const c7_huoqi: StoryScene = {
  id: 'c7_huoqi',
  chapter: CH1,
  place: '新郑 · 官署',
  bg: './assets/bg_guanshu_huo.webp',
  notes: [
    '三选一：保户籍／截残军／护疫营撤离。不可全得。其中一项，已被上一战的伤损锁死。',
    '抉择面板用 C7ChoicePanel（锁定逻辑 C7_LOCKED_CHOICE_BY_TACTIC）；保户籍接挂载点 c7_fire，护疫营接挂载点 c7_evac。',
  ],
  lines: [
    N('回旆盟败了。'),
    N('执旐者倒在街口，司马朔却带着残众钻入坊巷。'),
    N('败兵没有向北门集结。他们分成三股，一路逃，一路杀，一路把火种抛进身后的屋舍。'),
    N('城里起火。'),
    N('官署、疫营、北门，几乎同时传来急报。'),
    N('回旆盟烧的不只是简册——'),
    N('是这座城留下姓名的方式。'),
    D('青翎', '（俯身，验看官署前被杀秦卒的剑伤，起身）“这手剑，不是韩军路数。”（顿）“郑地山道上，我见过。”（顿）“同一伙人——回旆盟。”'),
  ],
  continuation: {
    trigger: 'choice',
    lines: C7_ECHO.register,
    lineVariants: [
      { when: { flag: 'c7_choice', equals: 'troops' }, lines: C7_ECHO.troops },
      { when: { flag: 'c7_choice', equals: 'camp' }, lines: C7_ECHO.camp },
    ],
  },
}

/** C8 军报变体：先按 c7_choice 选段；register 段内按 c7_saved_registers 是否含户籍、camp 段内按 evac_survival 分两版 */
const C8_BODY = {
  head: [
    N('韩旗降下。'),
    N('仅过十日，新郑市门，照常打开。'),
    N('玄羽小队，军功入册——'),
    N('斩死战派，全救人质。'),
  ],
  tail: [
    N('同旬，关中传来消息——'),
    N('郑国渠，全线通水。'),
    D('小满', '“下一座城？”'),
    D('阿芒', '“邯郸。”'),
    D('青翎', '（望北）“比这里冷。”'),
    N('一个国亡了。'),
    N('一条渠成了。'),
  ],
  registerSaved: NJ(resolveC8ReportVariant('register', ['huji']).result),
  registerLost: NJ(resolveC8ReportVariant('register', []).result),
  troops: NJ(C8_REPORT_VARIANTS.troops.result),
  campHigh: NJ(resolveC8ReportVariant('camp', [], 'high').result),
  campLow: NJ(resolveC8ReportVariant('camp', [], 'low').result),
}

const c8_zhangmo: StoryScene = {
  id: 'c8_zhangmo',
  chapter: CH1,
  place: '新郑 · 市门',
  bg: './assets/bg_xinzheng.webp',
  notes: ['军报按 C7 选择与战果变体；章末结算由 c8_settle 接入 SettlePanel。'],
  lines: [...C8_BODY.head, C8_BODY.registerLost, ...C8_BODY.tail],
  lineVariants: [
    {
      when: [
        { flag: 'c7_choice', equals: 'register' },
        { flag: 'c7_saved_registers', contains: 'huji' },
      ],
      lines: [...C8_BODY.head, C8_BODY.registerSaved, ...C8_BODY.tail],
    },
    { when: { flag: 'c7_choice', equals: 'troops' }, lines: [...C8_BODY.head, C8_BODY.troops, ...C8_BODY.tail] },
    {
      when: [
        { flag: 'c7_choice', equals: 'camp' },
        { flag: 'evac_survival', equals: 'high' },
      ],
      lines: [...C8_BODY.head, C8_BODY.campHigh, ...C8_BODY.tail],
    },
    { when: { flag: 'c7_choice', equals: 'camp' }, lines: [...C8_BODY.head, C8_BODY.campLow, ...C8_BODY.tail] },
  ],
}

export const SCENES: Record<string, StoryScene> = {
  s1_anfa,
  s2_shenxun,
  s3_chaqu,
  s4_andun,
  s5_zhuishi,
  s6_fusha,
  s7_xiandai,
  s8_nongjia,
  s9_tongxing,
  s10_guace,
  c1_pinan,
  c2_zhangtai,
  c3_guoshu,
  c4_husong,
  c5_shouxiang,
  c6_yiying,
  c7_huoqi,
  c8_zhangmo,
}

// ———————————————————————————— 扩展场景挂载点（界面组件与剧情数据分层接入） ————————————————————————————

/** §0 组件接口：story.ts 负责场景挂载与数据，界面组件负责交互呈现 */
export interface MountPoint {
  id: 's3_chaan' | 'c1_case' | 'c7_fire' | 'c7_troops' | 'c7_evac' | 'c8_settle' | 'shicheng'
  component: 'ScrollInspect' | 'CaseFragmentBoard' | 'FireRescue' | 'PursuitIntercept' | 'SettlePanel' | 'ShichengPage' | 'EvacBattle'
  host: string
}

export const MOUNT_POINTS: readonly MountPoint[] = [
  { id: 's3_chaan', component: 'ScrollInspect', host: 's3_chaqu' },
  { id: 'c1_case', component: 'CaseFragmentBoard', host: 'c1_pinan' },
  { id: 'c7_fire', component: 'FireRescue', host: 'c7_huoqi' },
  { id: 'c7_troops', component: 'PursuitIntercept', host: 'c7_huoqi' },
  { id: 'c7_evac', component: 'EvacBattle', host: 'c7_huoqi' },
  { id: 'c8_settle', component: 'SettlePanel', host: 'c8_zhangmo' },
  { id: 'shicheng', component: 'ShichengPage', host: 'title' },
]

// —— s3_chaan 查案（ScrollInspect 数据，附录「S3 查案」逐字） ——

export interface ChaanFinding {
  ledger: string
  text: string
  star: boolean
}

export const S3_CHAAN = {
  ledgers: ['渠口查验记档·十年', '隐密署入境记档', '秦韩馆驿传讯记档'],
  findings: [
    { ledger: '渠口', text: '渠口——十年，无一错漏。', star: false },
    { ledger: '入境', text: '入境——韩使，有入，无出。', star: true },
    { ledger: '馆驿', text: '馆驿——每隔五日，向韩境传讯一次。', star: true },
  ] as ChaanFinding[],
  fallback: '没有了。简上只有这些。',
}

// —— shicheng 史乘·对照卡（卡面数据已去重至 ui/shichengData；解锁逻辑属 ShichengPage 组件） ——

export const SHICHENG_FOOTER = '本故事借史为骨，时序有改编。'
export const SHICHENG_LOCKED = '此页，尚未经历。'

// —— c7_fire 保户籍·火场（FireRescue 数据，附录「C7 两分支」逐字） ——

/** 简册堆 id（写入 flag c7_saved_registers 的取值约定；FireRescue 组件沿用） */
export const C7_REGISTER_PILES = ['huji', 'liangce', 'ditu', 'xingyu', 'junji'] as const

export const C7_FIRE = {
  pileLabels: { huji: '户籍', liangce: '粮册', ditu: '地图', xingyu: '刑狱', junji: '军籍' } as Record<string, string>,
  intro: ['官署里，火已经上了梁。', FIRE_TEXT.instruction],
  notes: ['界面：五堆——户籍／粮册／地图／刑狱／军籍；火势条蔓延；抢出三册强制撤。'],
  forcedEvac: FIRE_TEXT.withdraw,
  savedHuji: '户籍主档还在。这座城的人，名字还在。',
  lostHuji: '册灰落在水缸里，黑了一层。有些名字，没人记得了。',
}

// —— c7_evac 护疫营·撤离战（数据接入附录「C7 两分支」；战斗配置复用 C4 框架） ——

export const C7_EVAC = {
  intro: ['乱兵冲着医篷来了——伤兵抢药，溃兵抢命。'],
  notes: ['战斗：护住医篷，撑到撤离。', '撤离战配置复用 C4 护送战框架；存活率写入 flag evac_survival。'],
  xiaomanLine: D('小满', '“军令要城。”（顿）“这里要命。”'),
  survivalHigh: '医篷保住了。躺着的，多半还能起来。',
  survivalLow: '医篷塌了半边。抬出去的，比抬进来的少。',
}

// —— 战败旁白（战前自动存档，战败回卷＋一句；附录逐字） ——

export const DEFEAT_NARRATION = {
  s5: '密使脱缰——再截一次。',
  s6: '山道被围死了——再守一次。',
  yuenu: '剑路被合围压住——越女退回坡上，再破一次阵。',
  s9: '追兵堵死了门——再挡一回。',
  c4: '谷口破了——从头再守一次。',
  huipai: '回旆盟冲破街口——新郑陷入乱火。重整阵线，再战一次。',
} as const

// —— c8_settle 章末结算（SettlePanel 数据接入附录「章末结算」；评级逻辑基于 flag） ——

export interface SettleRating {
  id: 'top' | 'mid' | 'even'
  label: string
  line: string
}

export const C8_SETTLE = {
  title: SETTLE_TEXT.title,
  columns: ['战绩', '抉择', '支线', '史乘'],
  plead: { pleaded: '失期秦卒：求过情（减一等）。', silent: '未开口（笞八十，照领）。' },
  c7: SETTLE_TEXT.c7Outcome,
  hanhui: SETTLE_TEXT.hanhui,
  soldier: '失期秦卒：谷口，守住了。',
  ratings: [
    { id: 'top', label: '头功', line: SETTLE_TEXT.ratingLine.head },
    { id: 'mid', label: '次功', line: SETTLE_TEXT.ratingLine.second },
    { id: 'even', label: '功过相抵', line: SETTLE_TEXT.ratingLine.balanced },
  ] as SettleRating[],
}
