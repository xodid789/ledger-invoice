import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { formatDate, todayStr, won } from '../lib/format'

export default function Closing() {
  const navigate = useNavigate()
  const {
    spaces,
    settings,
    isOccupied,
    drinkTotal,
    tcTotal,
    roomFee,
    spaceTotal,
    openVenue,
    closeVenue,
  } = useStore()

  const activeSpaces = spaces.filter((s) => spaceTotal(s) > 0 || isOccupied(s))

  const grandDrink = activeSpaces.reduce((sum, s) => sum + drinkTotal(s), 0)
  const grandTc = activeSpaces.reduce((sum, s) => sum + tcTotal(s), 0)
  const grandRoom = activeSpaces.reduce((sum, s) => sum + roomFee(s), 0)
  const grandTotal = grandDrink + grandTc + grandRoom

  const openTime = settings.venueOpenedAt
    ? (() => {
        const d = new Date(settings.venueOpenedAt)
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      })()
    : null

  const handleClose = () => {
    if (confirm('마감 확정하면 모든 방이 초기화됩니다. 계속할까요?')) {
      closeVenue()
      navigate('/')
    }
  }

  return (
    <div>
      <div className="page-head no-print">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          ← 현황판
        </button>
        <div className="spacer" />
        {!settings.venueOpenedAt ? (
          <button className="btn btn-primary" onClick={openVenue}>
            오픈 기록
          </button>
        ) : (
          <span className="closing-open-badge">🟢 오픈 {openTime}</span>
        )}
        <button className="btn btn-primary no-print" onClick={() => window.print()}>
          인쇄 / PDF
        </button>
        <button className="btn btn-danger" onClick={handleClose}>
          마감 확정
        </button>
      </div>

      <div className="receipt">
        <h2 className="receipt__title">마 감 장</h2>
        {settings.venueName && <p className="receipt__venue">{settings.venueName}</p>}
        <div className="receipt__meta">
          <div>
            <span className="lbl">일자</span> {formatDate(todayStr())}
          </div>
          {openTime && (
            <div>
              <span className="lbl">오픈</span> {openTime}
            </div>
          )}
        </div>

        <p className="receipt__sub">■ 방별 내역</p>
        <table className="receipt__table">
          <thead>
            <tr>
              <th>방</th>
              <th>손님</th>
              <th>주대</th>
              <th>TC</th>
              <th>RT</th>
              <th>합계</th>
            </tr>
          </thead>
          <tbody>
            {activeSpaces.length === 0 ? (
              <tr>
                <td colSpan={6} className="t-empty">
                  영업 내역 없음
                </td>
              </tr>
            ) : (
              activeSpaces.map((s) => (
                <tr key={s.id}>
                  <td className="t-name">{s.label}</td>
                  <td className="t-name">{s.customer || '―'}</td>
                  <td className="t-num">{won(drinkTotal(s))}</td>
                  <td className="t-num">{won(tcTotal(s))}</td>
                  <td className="t-num">{won(roomFee(s))}</td>
                  <td className="t-num">
                    <b>{won(spaceTotal(s))}</b>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="t-lbl">
                소계
              </td>
              <td className="t-num">{won(grandDrink)}</td>
              <td className="t-num">{won(grandTc)}</td>
              <td className="t-num">{won(grandRoom)}</td>
              <td className="t-num">
                <b>{won(grandTotal)}</b>
              </td>
            </tr>
          </tfoot>
        </table>

        <table className="receipt__table receipt__grand">
          <tbody>
            <tr className="t-grand">
              <td className="t-lbl">총 매출</td>
              <td className="t-num">{won(grandTotal)}원</td>
            </tr>
          </tbody>
        </table>

        <p className="receipt__confirm">수고하셨습니다.</p>
      </div>
    </div>
  )
}
