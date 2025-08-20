// src/main.tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* /admin 기준으로 라우팅 */}
    <BrowserRouter basename="/admin">
      <RequireAuth>
        <App />
      </RequireAuth>
    </BrowserRouter>
  </React.StrictMode>
)
