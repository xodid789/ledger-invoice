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
          {alert ? (
            <span className="badge-ext">⏰ 연장</span>
          ) : (
            occupied && <span className="tile__live">영업중</span>
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
          {girls.length > 0 ? `👩 ${girls.map((g) => g.name).join(', ')}` : ' '}
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
