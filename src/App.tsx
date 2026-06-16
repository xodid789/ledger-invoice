import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import AlarmManager from './AlarmManager'
import Board from './pages/Board'
import Room from './pages/Room'
import Bill from './pages/Bill'
import Hostess from './pages/Hostess'
import MenuSettings from './pages/MenuSettings'
import Closing from './pages/Closing'
import { useAuth } from './auth'

const navClass = ({ isActive }: { isActive: boolean }) =>
  'nav-link' + (isActive ? ' active' : '')

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function Clock() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const d = new Date(now)
  const date = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  return <div className="nav-clock"><span>{date}</span><span>{time}</span></div>
}

export default function App() {
  const { signOut } = useAuth()
  return (
    <>
      <AlarmManager />
      <header className="app-header no-print">
        <div className="app-header__inner">
          <NavLink to="/" className="brand">
            🍷 룸 보드
          </NavLink>
          <Clock />
          <nav>
            <NavLink to="/" end className={navClass}>
              현황판
            </NavLink>
            <NavLink to="/hostess" className={navClass}>
              아가씨
            </NavLink>
            <NavLink to="/settings" className={navClass}>
              설정
            </NavLink>
            <NavLink to="/closing" className={navClass}>
              마감장
            </NavLink>
            <button className="nav-link nav-logout" onClick={signOut}>
              로그아웃
            </button>
          </nav>
        </div>
      </header>
      <main className="container container--wide">
        <Routes>
          <Route path="/" element={<Board />} />
          <Route path="/room/:id" element={<Room />} />
          <Route path="/bill/:id" element={<Bill />} />
          <Route path="/hostess" element={<Hostess />} />
          <Route path="/settings" element={<MenuSettings />} />
          <Route path="/closing" element={<Closing />} />
        </Routes>
      </main>
    </>
  )
}
