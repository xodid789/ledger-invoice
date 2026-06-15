import { useAuth } from './auth'
import { StoreProvider } from './store'
import App from './App'
import Login from './pages/Login'

export default function AuthGate() {
  const { session, loading } = useAuth()
  if (loading) return <p className="muted center-loading">불러오는 중...</p>
  if (!session) return <Login />
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  )
}
