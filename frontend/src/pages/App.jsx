import { useEffect, useState } from 'react'
import AuthBox from '../components/AuthBox'
import Dashboard from '../components/Dashboard'
import { api } from '../services/api'
import tecLogo from '../assets/tec.png'

function BrandMark() {
  return (
    <div className="brand-lockup">
      <div className="brand-icon" aria-hidden="true">
        <img src={tecLogo} alt="3brasil Tech" />
      </div>
      <div>
        <div className="brand-name">3brasil Tech</div>
        <div className="brand-subtitle">LotoMetrics SaaS</div>
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
            <p className="eyebrow">Dashboard de analise estatistica para loterias</p>
            <h1>LotoMetrics SaaS</h1>
            <p className="hero-text">
              Plataforma da 3brasil Tech para gerar jogos, acompanhar resultados, validar
              analises com IA e apresentar o produto com uma identidade mais forte no navegador.
            </p>
            <div className="hero-tags">
              <span>Marca 3brasil Tech</span>
              <span>Gerador inteligente</span>
              <span>Resultados e cache</span>
              <span>IA, planos e boloes</span>
            </div>
            {api.mode === 'demo' && <div className="demo-badge">Modo demo ativo para testes no navegador</div>}
          </div>
        </div>

        <div className="hero-side">
          <div className="brand-poster">
            <img src={tecLogo} alt="Logomarca 3brasil Tech" className="brand-poster-image" />
            <div className="brand-poster-copy">
              <span>Produto</span>
              <strong>LotoMetrics SaaS by 3brasil Tech</strong>
            </div>
          </div>
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
