import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { formatDate, todayStr, won } from '../lib/format'

export default function Bill() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    spaces,
    settings,
    hostessesIn,
    hostessTC,
    hostessTimeLabel,
    drinkTotal,
    tcTotal,
    roomFee,
    spaceTotal,
  } = useStore()
  const space = spaces.find((s) => s.id === id)
  if (!space) return <p className="muted">공간을 찾을 수 없습니다.</p>

  const girls = hostessesIn(space.id)
  const hasTc = space.tcLog.length > 0 || girls.length > 0

  // 같은 이름끼리 합산
  const tcRows = (() => {
    const map = new Map<string, { labels: string[]; amount: number }>()
    for (const r of space.tcLog)
      map.has(r.name)
        ? (map.get(r.name)!.labels.push(r.label), (map.get(r.name)!.amount += r.amount))
        : map.set(r.name, { labels: [r.label], amount: r.amount })
    for (const g of girls) {
      const lbl = hostessTimeLabel(g), amt = hostessTC(g)
      map.has(g.name)
        ? (map.get(g.name)!.labels.push(lbl), (map.get(g.name)!.amount += amt))
        : map.set(g.name, { labels: [lbl], amount: amt })
    }
    return [...map.entries()].map(([name, { labels, amount }]) => {
      const u = [...new Set(labels)]
      const label = u.length === 1 && labels.length > 1 ? `${u[0]} × ${labels.length}` : labels.join(' · ')
      return { name, label, amount }
    })
  })()

  return (
    <div>
      <div className="page-head no-print">
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/room/${space.id}`)}
        >
          ← 돌아가기
        </button>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => window.print()}>
          인쇄 / PDF 저장
        </button>
      </div>

      <div className="receipt">
        <h2 className="receipt__title">계 산 서</h2>
        {settings.venueName && (
          <p className="receipt__venue">{settings.venueName}</p>
        )}
        <div className="receipt__meta">
          <div>
            <span className="lbl">일자</span> {formatDate(todayStr())}
          </div>
          <div>
            <span className="lbl">테이블</span> {space.label}
          </div>
          <div>
            <span className="lbl">손님</span> {space.customer || '―'}
          </div>
        </div>

        <p className="receipt__sub">■ 주대 (술)</p>
        <table className="receipt__table">
          <thead>
            <tr>
              <th>메뉴</th>
              <th>수량</th>
              <th>단가</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            {space.orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="t-empty">
                  주문 없음
                </td>
              </tr>
            ) : (
              space.orders.map((o) => (
                <tr key={o.id}>
                  <td className="t-name">{o.name}</td>
                  <td className="t-num">{o.qty}</td>
                  <td className="t-num">{won(o.price)}</td>
                  <td className="t-num">{won(o.price * o.qty)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="t-lbl">
                주대 소계
              </td>
              <td className="t-num">{won(drinkTotal(space))}</td>
            </tr>
          </tfoot>
        </table>

        <p className="receipt__sub">■ TC (아가씨)</p>
        <table className="receipt__table">
          <thead>
            <tr>
              <th>이름</th>
              <th>타임</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            {!hasTc ? (
              <tr>
                <td colSpan={3} className="t-empty">
                  없음
                </td>
              </tr>
            ) : (
              <>
                {tcRows.map((r) => (
                  <tr key={r.name}>
                    <td className="t-name">{r.name}</td>
                    <td className="t-num">{r.label}</td>
                    <td className="t-num">{won(r.amount)}</td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="t-lbl">
                TC 소계
              </td>
              <td className="t-num">{won(tcTotal(space))}</td>
            </tr>
          </tfoot>
        </table>

        {roomFee(space) > 0 && (
          <p className="receipt__line">
            <span>■ 룸티</span>
            <b>{won(roomFee(space))}원</b>
          </p>
        )}

        <table className="receipt__table receipt__grand">
          <tbody>
            <tr className="t-grand">
              <td className="t-lbl">합계금액</td>
              <td className="t-num">{won(spaceTotal(space))}원</td>
            </tr>
          </tbody>
        </table>

        <p className="receipt__confirm">감사합니다.</p>
      </div>
    </div>
  )
}
