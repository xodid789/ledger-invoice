import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { won } from '../lib/format'

export default function MenuSettings() {
  const navigate = useNavigate()
  const { menu, settings, updateMenu, addMenu, removeMenu, saveSettings } =
    useStore()
  const [newName, setNewName] = useState('')
  const [newAbbr, setNewAbbr] = useState('')
  const [newPrice, setNewPrice] = useState('')

  function add() {
    const p = Number(newPrice)
    if (newName.trim() && p > 0) {
      addMenu(newName.trim(), newAbbr.trim() || newName.trim().slice(0, 3), p)
      setNewName('')
      setNewAbbr('')
      setNewPrice('')
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>설정</h1>
      </div>

      <h2 className="section-title">업장명 (계산서 상단)</h2>
      <label className="field">
        <input
          type="text"
          value={settings.venueName}
          placeholder="예: ○○클럽"
          onChange={(e) => saveSettings({ ...settings, venueName: e.target.value })}
        />
      </label>

      <h2 className="section-title">아가씨 시간당 요금 (TC)</h2>
      <div className="field--row-2">
        <input
          type="number"
          inputMode="numeric"
          value={settings.hourlyRate}
          onChange={(e) =>
            saveSettings({ ...settings, hourlyRate: Number(e.target.value) })
          }
        />
        <span className="won-label">원 / 시간 (1타임)</span>
      </div>

      <h2 className="section-title">룸티 (사용 시 자동 부과)</h2>
      <div className="field--row-2">
        <input
          type="number"
          inputMode="numeric"
          value={settings.roomCharge}
          onChange={(e) =>
            saveSettings({ ...settings, roomCharge: Number(e.target.value) })
          }
        />
        <span className="won-label">원 — 방 (4·5층)</span>
      </div>
      <div className="field--row-2">
        <input
          type="number"
          inputMode="numeric"
          value={settings.hallBarCharge}
          onChange={(e) =>
            saveSettings({ ...settings, hallBarCharge: Number(e.target.value) })
          }
        />
        <span className="won-label">원 — 홀·바</span>
      </div>

      <h2 className="section-title">메뉴 · 가격 (약칭은 현황판 표시용)</h2>
      <div className="menu-edit">
        {menu.map((m) => (
          <div className="menu-edit__row" key={m.id}>
            <input
              type="text"
              value={m.name}
              onChange={(e) => updateMenu(m.id, { name: e.target.value })}
            />
            <input
              className="abbr-input"
              type="text"
              value={m.abbr}
              placeholder="약칭"
              onChange={(e) => updateMenu(m.id, { abbr: e.target.value })}
            />
            <input
              type="number"
              inputMode="numeric"
              value={m.price}
              onChange={(e) => updateMenu(m.id, { price: Number(e.target.value) })}
            />
            <span className="won-label">원</span>
            <button
              className="icon-btn"
              onClick={() => removeMenu(m.id)}
              aria-label="삭제"
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      <div className="add-row">
        <input
          type="text"
          value={newName}
          placeholder="새 메뉴명"
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          className="abbr-input"
          type="text"
          value={newAbbr}
          placeholder="약칭"
          onChange={(e) => setNewAbbr(e.target.value)}
        />
        <input
          type="number"
          inputMode="numeric"
          value={newPrice}
          placeholder="가격"
          onChange={(e) => setNewPrice(e.target.value)}
        />
        <button className="btn btn-primary" onClick={add}>
          + 추가
        </button>
      </div>

      <p className="muted price-preview">
        현재 메뉴:{' '}
        {menu.map((m) => `${m.abbr}(${m.name}) ${won(m.price)}원`).join(' · ')}
      </p>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          현황판으로
        </button>
      </div>
    </div>
  )
}
