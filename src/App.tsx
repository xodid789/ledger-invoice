import { NavLink, Route, Routes } from 'react-router-dom'
import AlarmManager from './AlarmManager'
import Board from './pages/Board'
import Room from './pages/Room'
import Bill from './pages/Bill'
import Hostess from './pages/Hostess'
import MenuSettings from './pages/MenuSettings'
import { useAuth } from './auth'

const navClass = ({ isActive }: { isActive: boolean }) =>
  'nav-link' + (isActive ? ' active' : '')

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
        </Routes>
      </main>
    </>
  )
}
