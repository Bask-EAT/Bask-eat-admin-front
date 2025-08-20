// src/auth/RequireAuth.tsx
import { useEffect, useState } from 'react'

type S = 'loading' | 'ok' | 'unauth'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<S>('loading')

  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then(r => setS(r.ok ? 'ok' : 'unauth'))
      .catch(() => setS('unauth'))
  }, [])

  if (s === 'loading') return <div>Loading...</div>
  if (s === 'unauth') {
    // 절대경로로 확실히 로그인으로
    window.location.href = 'http://localhost:9001'
    return null
  }
  return <>{children}</>
}
