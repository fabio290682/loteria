import { useEffect, useState } from 'react'
import AuthBox from '../components/AuthBox'
import Dashboard from '../components/Dashboard'
import { api } from '../services/api'

export default function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(localStorage.getItem('token')))
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (authenticated) api.me().then(setUser).catch(() => {
      localStorage.removeItem('token')
      setAuthenticated(false)
    })
  }, [authenticated])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setAuthenticated(false)
    setUser(null)
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <h1>LotoMetrics SaaS V3</h1>
          <p>Planos com limites, bolões, cache de resultados, webhooks e painel admin.</p>
          {user && <small>Logado como {user.name} · plano {user.plan}{user.is_admin ? ' · admin' : ''}</small>}
        </div>
        {authenticated && <button onClick={handleLogout}>Sair</button>}
      </header>
      {!authenticated ? <AuthBox onAuth={() => setAuthenticated(true)} /> : <Dashboard user={user} />}
    </main>
  )
}
