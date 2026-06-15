import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth'

export default function Login() {
  const { signIn } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const err = await signIn(password)
    if (err) setError('비밀번호가 올바르지 않습니다')
    setBusy(false)
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <h1 className="brand">🍷 룸 보드</h1>
        <label className="field">
          <span>비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  )
}
