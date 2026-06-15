/** 1234567 -> "1,234,567" (단위 '원'은 표시하는 쪽에서 붙임) */
export function won(n: number): string {
  return (Math.round(n) || 0).toLocaleString('ko-KR')
}

export function todayStr(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** "2026-06-14" -> "2026년 6월 14일" */
export function formatDate(s: string): string {
  const [y, m, d] = s.split('-')
  if (!y || !m || !d) return s
  return `${y}년 ${Number(m)}월 ${Number(d)}일`
}
