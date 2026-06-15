import { useState } from 'react'
import { useStore } from '../store'
import { clock, hostessTimer } from '../lib/timer'

export default function Hostess() {
  const {
    now,
    hostesses,
    spaces,
    addHostess,
    removeHostess,
    toggleWorking,
    assignRoom,
  } = useStore()
  const [name, setName] = useState('')

  function add() {
    if (name.trim()) {
      addHostess(name)
      setName('')
    }
  }

  function roomLabel(roomId: string | null) {
    if (!roomId) return ''
    return spaces.find((s) => s.id === roomId)?.label ?? ''
  }

  // 출근자 먼저, 그다음 이름순
  const sorted = [...hostesses].sort(
    (a, b) =>
      Number(b.working) - Number(a.working) || a.name.localeCompare(b.name, 'ko'),
  )

  const onCount = hostesses.filter((h) => h.working).length
  const inRoomCount = hostesses.filter((h) => h.roomId !== null).length

  return (
    <div>
      <div className="page-head">
        <h1>아가씨 현황</h1>
      </div>
      {hostesses.length > 0 && (
        <p className="muted summary">
          출근 {onCount}명 · 🔴 사용중 {inRoomCount}명 · 🟢 대기{' '}
          {onCount - inRoomCount}명
        </p>
      )}

      <div className="add-row">
        <input
          type="text"
          value={name}
          placeholder="이름 입력 후 추가"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
          }}
        />
        <button className="btn btn-primary" onClick={add}>
          + 추가
        </button>
      </div>

      {hostesses.length === 0 ? (
        <div className="empty">
          <p>등록된 아가씨가 없습니다.</p>
          <p className="muted">위에서 이름을 추가하세요.</p>
        </div>
      ) : (
        <ul className="hostess-list">
          {sorted.map((h) => {
            const t = hostessTimer(h, now)
            const inRoom = h.roomId !== null
            const light = !h.working ? 'off' : inRoom ? 'red' : 'green'
            const warnCls = t && t.warn ? ' warn' : ''
            let status = !h.working ? '퇴근' : inRoom ? '사용중' : '대기'
            if (inRoom) {
              status = `${roomLabel(h.roomId)} · ${h.times}타임`
              if (t) {
                status += t.overtime
                  ? ` · 초과 ${clock(-t.remaining)}`
                  : ` · ${clock(t.remaining)}`
              }
            }
            return (
              <li className={`hostess${warnCls}`} key={h.id}>
                <span className={`light light--${light}`} />
                <span className="hostess__name">{h.name}</span>
                <span className={`hostess__status status--${light}`}>
                  {status}
                </span>
                {h.working && (
                  <select
                    className="room-select"
                    value={h.roomId ?? ''}
                    onChange={(e) => assignRoom(h.id, e.target.value || null)}
                  >
                    <option value="">대기</option>
                    {spaces.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  className={`btn btn-sm ${h.working ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => toggleWorking(h.id)}
                >
                  {h.working ? '퇴근' : '출근'}
                </button>
                <button
                  className="icon-btn"
                  onClick={() => {
                    if (confirm(`${h.name} 삭제할까요?`)) removeHostess(h.id)
                  }}
                  aria-label="삭제"
                >
                  🗑
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
