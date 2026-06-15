// Web Audio로 짧은 알람음을 생성한다(오디오 파일 불필요).
// 브라우저 자동재생 정책상 첫 사용자 터치 후에 소리가 난다 → primeAudio()로 해제.

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** 첫 사용자 제스처에서 호출해 오디오 컨텍스트를 깨운다 */
export function primeAudio(): void {
  try {
    getCtx()
  } catch {
    /* 무시 */
  }
}

/** 삐- 알람음 (count번 반복) */
export function beep(count = 2): void {
  try {
    const c = getCtx()
    let t = c.currentTime
    for (let i = 0; i < count; i++) {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'square'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(t)
      osc.stop(t + 0.3)
      t += 0.38
    }
  } catch {
    /* 무시 */
  }
}
