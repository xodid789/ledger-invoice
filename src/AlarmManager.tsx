import { useEffect, useRef } from 'react'
import { useStore } from './store'
import { hostessTimer } from './lib/timer'
import { beep, primeAudio } from './lib/alarm'

// 화면 어디에 있든 연장 경고(50분 경과)가 생기면 소리 알람을 울린다.
// 새 경고가 뜨면 즉시, 그 후 경고가 남아있는 동안 20초마다 반복.
export default function AlarmManager() {
  const { hostesses, now } = useStore()
  const prevKey = useRef('')
  const lastBeep = useRef(0)

  useEffect(() => {
    const onFirst = () => primeAudio()
    window.addEventListener('pointerdown', onFirst, { once: true })
    return () => window.removeEventListener('pointerdown', onFirst)
  }, [])

  useEffect(() => {
    const alertIds = hostesses
      .filter((h) => hostessTimer(h, now)?.warn)
      .map((h) => h.id)
      .sort()
    const key = alertIds.join(',')
    if (alertIds.length > 0) {
      const isNew = key !== prevKey.current
      if (isNew || now - lastBeep.current >= 20000) {
        beep(isNew ? 3 : 2)
        lastBeep.current = now
      }
    }
    prevKey.current = key
  }, [hostesses, now])

  return null
}
