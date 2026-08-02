export type PursuitRouteId = 'north' | 'market' | 'canal'

export interface PursuitRoute {
  id: PursuitRouteId
  label: string
  shortLabel: string
}

export interface PursuitWave {
  id: number
  route: PursuitRouteId
  clue: string
}

export const PURSUIT_ROUTES: readonly PursuitRoute[] = [
  { id: 'north', label: '北门驰道', shortLabel: '北道' },
  { id: 'market', label: '西市窄巷', shortLabel: '西市' },
  { id: 'canal', label: '渠桥水门', shortLabel: '水门' },
]

const ROUTE_CLUES: Record<PursuitRouteId, readonly string[]> = {
  north: [
    '城墙根传来密集马蹄，折断的旌旗一路朝北。',
    '石道上尘土笔直扬起，残骑正贴着北城墙突围。',
  ],
  market: [
    '市棚接连倒下，谷草和碎陶一路撒向西市。',
    '坊墙后有人撞开木门，脚步正钻进西市窄巷。',
  ],
  canal: [
    '水沟边全是新鲜湿泥脚印，渠桥下传来甲片碰响。',
    '残兵弃马涉水，水门方向浮起一串急促波纹。',
  ],
}

/** 五股残兵的逃路每局重排，且不会连续两股走同一路。 */
export function createPursuitWaves(random: () => number = Math.random, count = 5): PursuitWave[] {
  const waves: PursuitWave[] = []
  let previous: PursuitRouteId | null = null

  for (let index = 0; index < count; index++) {
    const candidates = PURSUIT_ROUTES.filter((route) => route.id !== previous)
    const route = candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))]
    const clues = ROUTE_CLUES[route.id]
    const clue = clues[Math.min(clues.length - 1, Math.floor(random() * clues.length))]
    waves.push({ id: index + 1, route: route.id, clue })
    previous = route.id
  }

  return waves
}

export function pursuitResultLabel(intercepted: number, total: number): string {
  if (intercepted >= total - 1) return '北逃通道被截断。回旆盟残军再难整队。'
  if (intercepted >= Math.ceil(total / 2)) return '主队被截，仍有零散残骑逃入夜色。'
  return '只截住后队。残军已有多人越过北道。'
}
