import type { Hostess } from '../types'

export const TIME_MS = 60 * 60 * 1000 // 1타임 = 1시간
export const HALF_MS = 30 * 60 * 1000 // 30분 미만에 끝내면 반타임
export const WARN_MS = 10 * 60 * 1000 // 종료 10분 전부터 연장 경고

export interface TimerInfo {
  elapsed: number
  remaining: number // 음수면 초과
  warn: boolean // 10분 이내 또는 초과 → 깜빡/알람
  overtime: boolean
  half: boolean // 현재 타임이 아직 30분 미만 → 지금 끝내면 반타임
}

export function hostessTimer(h: Hostess, now: number): TimerInfo | null {
  if (!h.roomId || h.enteredAt == null) return null
  const elapsed = now - h.enteredAt
  const remaining = TIME_MS - elapsed
  return {
    elapsed,
    remaining,
    warn: remaining <= WARN_MS,
    overtime: remaining < 0,
    half: elapsed < HALF_MS,
  }
}

/** ms -> "M:SS" (부호 없이 절대값) */
export function clock(ms: number): string {
  const total = Math.floor(Math.abs(ms) / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
