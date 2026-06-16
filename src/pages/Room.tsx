import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { won } from '../lib/format'
import { clock, hostessTimer } from '../lib/timer'

export default function Room() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    now,
    spaces,
    menu,
    hostesses,
    hostessesIn,
    bottleCount,
    drinkTotal,
    tcTotal,
    roomFee,
    spaceTotal,
    hostessTC,
    setCustomer,
    addOrder,
    changeQty,
    clearSpace,
    assignRoom,
    extendTime,
  } = useStore()

  const space = spaces.find((s) => s.id === id)
  if (!space) return <p className="muted">공간을 찾을 수 없습니다.</p>

  const girls = hostessesIn(space.id)
  const available = hostesses.filter((h) => h.working && h.roomId === null)

  function handleClose() {
    if (confirm(`${space!.label} 마감하고 비울까요? (기록이 모두 지워집니다)`)) {
      clearSpace(space!.id)
      navigate('/')
    }
  }

  return (
    <div>
      <div className="page-head no-print">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          ← 현황판
        </button>
        <h1>{space.label}</h1>
        <div className="spacer" />
        <button className="btn btn-danger" onClick={handleClose}>
          마감
        </button>
      </div>

      <label className="field">
        <span>누구 손님</span>
        <input
          type="text"
          value={space.customer}
          placeholder="예: 김사장"
          onChange={(e) => setCustomer(space.id, e.target.value)}
        />
      </label>

      <h2 className="section-title">메뉴 (누르면 주문 추가)</h2>
      <div className="menu-grid">
        {menu.map((m) => (
          <button
            key={m.id}
            className="menu-btn"
            onClick={() => addOrder(space.id, m)}
          >
            <b>{m.name}</b>
            <span>{won(m.price)}원</span>
          </button>
        ))}
      </div>

      <h2 className="section-title">주문 내역</h2>
      {space.orders.length === 0 ? (
        <p className="muted">위 메뉴를 눌러 주문을 추가하세요.</p>
      ) : (
        <div className="orders">
          {space.orders.map((o) => (
            <div className="order" key={o.id}>
              <span className="order__name">{o.name}</span>
              <div className="qty">
                <button onClick={() => changeQty(space.id, o.id, -1)}>−</button>
                <span className="qty__n">{o.qty}</span>
                <button onClick={() => changeQty(space.id, o.id, 1)}>＋</button>
              </div>
              <span className="order__amt">{won(o.price * o.qty)}원</span>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">
        아가씨 ({girls.length}) · TC {won(tcTotal(space))}원
      </h2>
      {girls.length === 0 ? (
        <p className="muted">아직 없음</p>
      ) : (
        <div className="aga-list">
          {girls.map((g) => {
            const t = hostessTimer(g, now)
            const cls = t ? (t.overtime ? 'over' : t.warn ? 'warn' : '') : ''
            const disp = t
              ? t.overtime
                ? `초과 ${clock(-t.remaining)}`
                : clock(t.remaining)
              : '—'
            return (
              <div className={`aga-row ${cls}`} key={g.id}>
                <span className="light light--red" />
                <span className="aga-name">{g.name}</span>
                {t?.half && <span className="badge-half">반타임</span>}
                <span className="aga-time">{g.times}타임</span>
                <span className={`clock ${cls}`}>{disp}</span>
                <span className="aga-tc">{won(hostessTC(g))}원</span>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => extendTime(g.id)}
                >
                  연장
                </button>
                <button
                  className="icon-btn"
                  onClick={() => assignRoom(g.id, null)}
                  aria-label="빼기"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
      {space.tcLog.length > 0 && (
        <p className="muted ended-note">
          끝난 아가씨:{' '}
          {space.tcLog.map((r) => `${r.name}(${r.label} ${won(r.amount)}원)`).join(', ')}
        </p>
      )}
      {available.length > 0 && (
        <div className="chips chips--add">
          <span className="muted add-label">대기 중 추가:</span>
          {available.map((h) => (
            <button
              className="chip chip--add"
              key={h.id}
              onClick={() => assignRoom(h.id, space.id)}
            >
              + {h.name}
            </button>
          ))}
        </div>
      )}
      {hostesses.length === 0 && (
        <p className="muted">‘아가씨’ 탭에서 출근 등록을 먼저 하세요.</p>
      )}

      <div className="room-foot">
        <div className="room-sums">
          <div>
            <span className="muted">주대 (술 {bottleCount(space)}병)</span>
            <b>{won(drinkTotal(space))}원</b>
          </div>
          <div>
            <span className="muted">TC (아가씨)</span>
            <b>{won(tcTotal(space))}원</b>
          </div>
          {roomFee(space) > 0 && (
            <div>
              <span className="muted">RT</span>
              <b>{won(roomFee(space))}원</b>
            </div>
          )}
          <div className="grand">
            <span>합계</span>
            <b>{won(spaceTotal(space))}원</b>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/bill/${space.id}`)}
        >
          계산서 출력
        </button>
      </div>
    </div>
  )
}
