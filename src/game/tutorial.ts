// 《秦灭六国》Demo — 序章教学战引擎：郑地伏杀
// 设计宣言（v6.5）：三项目标（护住副本 / 救出孟甲 / 守住谷口退路）数值上不可全成。
// 锁死逻辑：总 AP 8；救孟甲 3AP + 守谷口 3AP + 三次打断夺明卷 3AP = 9 > 8。

export interface TEnemy {
  uid: number
  name: string
  kind: 'xia' | 'qiang' // 死士 / 夺简死士
  hp: number
  maxHp: number
  intent: { type: 'attack' | 'steal'; dmg: number; label: string }
}

export interface TutorialState {
  round: number // 1~4
  ap: number
  hp: number
  maxHp: number
  enemies: TEnemy[]
  mengjia: number // 0~3，到 3 救出
  cart: number // 0~3，到 3 阵脚稳住
  yutu: 'safe' | 'lost' // 行囊外层明卷；真正副本是否藏在暗层，要到 C1 拼案才确认
  log: string[]
  phase: 'player' | 'done' | 'lost'
  uidSeq: number
  lastHit: { uid: number; damage: number } | null
}

export type TAction = 'tuji' | 'daduan' | 'mengjia' | 'cart'

export const T_ACTIONS: Record<TAction, { name: string; desc: string; target: 'enemy' | 'none' }> = {
  tuji: { name: '突击', desc: '直剑突进，伤 6–8。', target: 'enemy' },
  daduan: { name: '打断', desc: '伤 2，取消目标本回合意图。对付夺卷者的唯一办法。', target: 'enemy' },
  mengjia: { name: '救出孟甲', desc: '撬开压住他的辎重（需 3 次）。', target: 'none' },
  cart: { name: '守住谷口退路', desc: '护住身后谷口，守住全队退路（需 3 次）。', target: 'none' },
}

export const MAX_ROUNDS = 4
export const AP_PER_ROUND = 2
export const RESCUE_COST = 3
export const CART_COST = 3

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

function log(s: TutorialState, t: string) {
  s.log.push(t)
}

function xia(s: TutorialState): TEnemy {
  return { uid: s.uidSeq++, name: '宗室死士', kind: 'xia', hp: 8, maxHp: 8, intent: { type: 'attack', dmg: 0, label: '' } }
}

function qiang(s: TutorialState): TEnemy {
  // 夺简者身手极高：实战中杀不死，只能打断
  return { uid: s.uidSeq++, name: '夺简死士', kind: 'qiang', hp: 22, maxHp: 22, intent: { type: 'steal', dmg: 0, label: '' } }
}

function rollIntents(s: TutorialState) {
  for (const e of s.enemies) {
    if (e.kind === 'qiang' && s.yutu === 'safe') {
      e.intent = { type: 'steal', dmg: 0, label: '意图：夺走行囊明卷（不可击杀，需打断）' }
    } else {
      const dmg = rand(3, 5)
      e.intent = { type: 'attack', dmg, label: `意图：攻击北芒（${dmg}）` }
    }
  }
}

export function createTutorial(): TutorialState {
  const s: TutorialState = {
    round: 1,
    ap: AP_PER_ROUND,
    hp: 28,
    maxHp: 28,
    enemies: [],
    mengjia: 0,
    cart: 0,
    yutu: 'safe',
    log: [],
    phase: 'player',
    uidSeq: 1,
    lastHit: null,
  }
  s.enemies.push(xia(s), xia(s))
  rollIntents(s)
  log(s, '雨夜。接应暗号被人改过，伏兵封住谷口。')
  log(s, '密令明卷，就在这行囊里——行囊在，证据在。')
  log(s, '三件事压在肩上：明卷、孟甲、谷口退路。四回合——你顾不了全部。')
  return s
}

export function applyTutorialAction(prev: TutorialState, action: TAction, targetUid?: number): TutorialState {
  const s = structuredClone(prev)
  if (s.phase !== 'player' || s.ap <= 0) return s
  s.lastHit = null
  const enemy = targetUid != null ? s.enemies.find((e) => e.uid === targetUid) : undefined

  switch (action) {
    case 'tuji': {
      if (!enemy) return prev
      const dmg = rand(6, 8)
      enemy.hp -= dmg
      s.lastHit = { uid: enemy.uid, damage: dmg }
      log(s, `北芒突击${enemy.name}，伤 ${dmg}。`)
      if (enemy.hp <= 0) {
        s.enemies = s.enemies.filter((e) => e.uid !== enemy.uid)
        log(s, `${enemy.name}倒下。`)
      }
      break
    }
    case 'daduan': {
      if (!enemy) return prev
      enemy.hp -= 2
      s.lastHit = { uid: enemy.uid, damage: 2 }
      enemy.intent = { type: 'attack', dmg: 0, label: '意图：被打断，踉跄' }
      log(s, `北芒打断${enemy.name}，其本回合行动被取消。`)
      if (enemy.hp <= 0) {
        s.enemies = s.enemies.filter((e) => e.uid !== enemy.uid)
        log(s, `${enemy.name}倒下。`)
      }
      break
    }
    case 'mengjia': {
      if (s.mengjia >= RESCUE_COST) return prev
      s.mengjia += 1
      log(s, s.mengjia >= RESCUE_COST ? '北芒撬开辎重，把孟甲拖了出来！' : `北芒搬开压在孟甲身上的辎重（${s.mengjia}/${RESCUE_COST}）。`)
      break
    }
    case 'cart': {
      if (s.cart >= CART_COST) return prev
      s.cart += 1
      log(s, s.cart >= CART_COST ? '谷口守住了——全队退路，在握！' : `北芒喝令结阵，谷口又稳一分（${s.cart}/${CART_COST}）。`)
      break
    }
  }

  s.ap -= 1
  return s
}

export function endTutorialTurn(prev: TutorialState): TutorialState {
  const s = structuredClone(prev)
  s.lastHit = null
  // 敌方行动
  for (const e of [...s.enemies]) {
    if (e.intent.type === 'steal') {
      s.yutu = 'lost'
      s.enemies = s.enemies.filter((x) => x.uid !== e.uid)
      log(s, '夺简死士劈开行囊，夺走明卷——暗层是否暴露，无人看清。')
      continue
    }
    if (e.intent.type === 'attack' && e.intent.dmg > 0) {
      s.hp -= e.intent.dmg
      log(s, `${e.name}击中北芒，伤 ${e.intent.dmg}。`)
      if (s.hp <= 0) {
        s.hp = 0
        s.phase = 'lost'
        log(s, '北芒倒下。伏兵越过谷口，任务失败。')
        return s
      }
    }
  }

  if (s.round >= MAX_ROUNDS) {
    s.phase = 'done'
    log(s, '伏兵主力已至。绝境——')
    log(s, '坡顶一道剑光破雨而下。那个本该东出函谷的人，杀了下来。')
    log(s, '她没有上商队的车。越女到了。')
    return s
  }

  s.round += 1
  s.ap = AP_PER_ROUND
  // 增援与夺简者
  if (s.round === 2 && s.yutu === 'safe') {
    s.enemies.push(qiang(s))
    log(s, '一道人影扑向行囊——副本就在囊中！')
  }
  if (s.round === 3) {
    if (s.enemies.filter((e) => e.kind === 'xia').length < 2) s.enemies.push(xia(s))
    if (s.yutu === 'safe' && !s.enemies.some((e) => e.kind === 'qiang')) s.enemies.push(qiang(s))
  }
  if (s.round === 4 && s.enemies.filter((e) => e.kind === 'xia').length < 2) {
    s.enemies.push(xia(s))
  }
  rollIntents(s)
  log(s, `—— 第 ${s.round} 回合 ——`)
  return s
}

export interface TutorialOutcome {
  yutuSaved: boolean
  mengjiaSaved: boolean
  cartThrough: boolean
}

export function tutorialOutcome(s: TutorialState): TutorialOutcome {
  return {
    yutuSaved: s.yutu === 'safe',
    mengjiaSaved: s.mengjia >= RESCUE_COST,
    cartThrough: s.cart >= CART_COST,
  }
}
