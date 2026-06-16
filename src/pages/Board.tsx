import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { won } from '../lib/format'
import { hostessTimer } from '../lib/timer'
import type { Space } from '../types'

export default function Board() {
  const {
    spaces,
    menu,
    now,
    hostesses,
    hostessesIn,
    spaceTotal,
    isOccupied,
    loading,
  } = useStore()
  const groups = spaces.reduce<string[]>(
    (acc, s) => (acc.includes(s.group) ? acc : [...acc, s.group]),
    [],
  )

  const roomLabel = (roomId: string | null) =>
    roomId ? (spaces.find((s) => s.id === roomId)?.label ?? '') : ''
  const inRoom = hostesses.filter((h) => h.roomId)
  const waiting = hostesses.filter((h) => h.working && !h.roomId)

  const abbrOf = (menuId: string, fallback: string) =>
    menu.find((m) => m.id === menuId)?.abbr || fallback

  const renderTile = (space: Space) => {
    const occupied = isOccupied(space)
    const girls = hostessesIn(space.id)
    const alert = girls.some((g) => hostessTimer(g, now)?.warn)
    const startTs =
      space.openedAt ??
      girls.reduce<number | null>(
        (min, g) => (g.enteredAt !== null ? (min === null || g.enteredAt < min ? g.enteredAt : min) : min),
        null,
      )
    const startTime = startTs
      ? new Date(startTs).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
      : null
    const drinks = space.orders
      .map((o) => `${abbrOf(o.menuId, o.name)} ${o.qty}`)
      .join(' · ')
    return (
      <Link
        key={space.id}
        to={`/room/${space.id}`}
        className={`tile ${occupied ? 'tile--on' : 'tile--off'} ${alert ? 'tile--alert' : ''}`}
      >
        <div className="tile__top">
          <span className="tile__label">{space.label}</span>
          {occupied && (
            <div className="tile__top-right">
              {alert ? <span className="badge-ext">⏰ 연장</span> : <span className="tile__live">영업중</span>}
              {startTime && <span className="tile__since">{startTime}~</span>}
            </div>
          )}
        </div>
        <div className="tile__customer">
          {space.customer ? (
            `${space.customer} 손님`
          ) : (
            <span className="tile__empty">비어있음</span>
          )}
        </div>
        <div className="tile__drinks">{drinks ? `🍾 ${drinks}` : ' '}</div>
        <div className="tile__girls">
          {girls.length > 0 ? (
            girls.map((g) => {
              const timer = hostessTimer(g, now)
              const entryTime = g.enteredAt
                ? new Date(g.enteredAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })
                : null
              const mins = timer ? Math.floor(timer.elapsed / 60000) : null
              return (
                <div key={g.id} className="tile__girl-row">
                  <span>👩 {g.name}</span>
                  {entryTime && mins !== null && (
                    <span className="tile__girl-timer">{entryTime} · {mins}분</span>
                  )}
                </div>
              )
            })
          ) : (
            <span> </span>
          )}
        </div>
        <div className="tile__foot">
          <span className="muted">{girls.length}명</span>
          <span className="tile__amount">{won(spaceTotal(space))}원</span>
        </div>
      </Link>
    )
  }

  if (loading) return <p className="muted">불러오는 중...</p>

  return (
    <div>
      <section className="roster no-print">
        <div className="roster__col">
          <div className="roster__head">
            🔴 방중 <span className="muted">({inRoom.length})</span>
          </div>
          <div className="roster__chips">
            {inRoom.length > 0 ? (
              inRoom.map((h) => (
                <span className="rchip rchip--red" key={h.id}>
                  {h.name}
                  <em>{roomLabel(h.roomId)}</em>
                </span>
              ))
            ) : (
              <span className="muted">없음</span>
            )}
          </div>
        </div>
        <div className="roster__col">
          <div className="roster__head">
            🟢 대기 <span className="muted">({waiting.length})</span>
          </div>
          <div className="roster__chips">
            {waiting.length > 0 ? (
              waiting.map((h) => (
                <span className="rchip rchip--green" key={h.id}>
                  {h.name}
                </span>
              ))
            ) : (
              <span className="muted">없음</span>
            )}
          </div>
        </div>
      </section>

      {groups.map((g) => {
        const items = spaces.filter((s) => s.group === g)
        return (
          <section className="board-group" key={g}>
            <h2 className="group-title">
              {g} <span className="muted">({items.length})</span>
            </h2>
            <div className="grid">{items.map(renderTile)}</div>
          </section>
        )
      })}
    </div>
  )
}
