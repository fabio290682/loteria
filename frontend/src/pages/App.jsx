import { useEffect, useState } from 'react'
import AuthBox from '../components/AuthBox'
import Dashboard from '../components/Dashboard'
import { api } from '../services/api'

function BrandMark() {
  return (
    <div className="brand-lockup">
      <div className="brand-icon" aria-hidden="true">
        <svg viewBox="0 0 44 44" fill="none">
          <path d="M8 12 Q8 6 16 6 L30 6 Q38 6 38 14 Q38 20 30 20 L18 20" stroke="#F59E0B" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M8 32 Q8 38 16 38 L30 38 Q38 38 38 30 Q38 24 30 24 L18 24" stroke="#60A5FA" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="8" cy="22" r="3" fill="#F59E0B" />
        </svg>
      </div>
      <div>
        <div className="brand-name">3brasil Tech</div>
        <div className="brand-subtitle">LOTOMETRICS</div>
      </div>
    </div>
  )
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(localStorage.getItem('token')))
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!authenticated) return

    api.me().then(setUser).catch(() => {
      localStorage.removeItem('token')
      setAuthenticated(false)
      setUser(null)
    })
  }, [authenticated])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setAuthenticated(false)
    setUser(null)
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-content">
          <BrandMark />
          <div className="hero-copy">
            <p className="eyebrow">Analise estatistica para loterias</p>
            <h1>LotoMetrics SaaS V3</h1>
            <p className="hero-text">
              Gere jogos, acompanhe resultados, teste planos e explore o fluxo do produto em uma interface
              mais clara para demo, operacao e venda.
            </p>
            <div className="hero-tags">
              <span>Gerador inteligente</span>
              <span>Resultados e cache</span>
              <span>Boloes e planos</span>
            </div>
            {api.mode === 'demo' && <div className="demo-badge">Modo demo ativo para testes no navegador</div>}
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-stat">
            <span className="hero-stat-label">Ambiente</span>
            <strong>{api.mode === 'demo' ? 'Demo local' : 'Backend remoto'}</strong>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-label">Sessao</span>
            <strong>{user ? `Plano ${user.plan}` : 'Visitante'}</strong>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-label">Perfil</span>
            <strong>{user ? (user.is_admin ? 'Administrador' : user.name) : 'Nao autenticado'}</strong>
          </div>
          {authenticated && (
            <button className="secondary-button" onClick={handleLogout}>
              Sair
            </button>
          )}
        </div>
      </section>

      {!authenticated ? (
        <AuthBox onAuth={() => setAuthenticated(true)} />
      ) : (
        <Dashboard user={user} />
      )}
    </main>
  )
}
