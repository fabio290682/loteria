import { useState, useEffect } from 'react'
import { api } from '../services/api'
import StatsCard from './StatsCard'
import AnalyticsPanel from './AnalyticsPanel'
import './Dashboard.css'

export default function DashboardPro() {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [selectedLottery, setSelectedLottery] = useState('megasena')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [selectedLottery])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, analyticsRes] = await Promise.all([
        api.get('/dashboard/stats', { params: { lottery: selectedLottery } }),
        api.get('/analytics/dashboard', { params: { lottery: selectedLottery, range: 30 } }),
      ])
      setStats(statsRes.data)
      setAnalytics(analyticsRes.data)
      setError(null)
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const lotteries = [
    { value: 'megasena', label: 'Mega-Sena' },
    { value: 'quina', label: 'Quina' },
    { value: 'lotofacil', label: 'Lotofácil' },
  ]

  if (loading) {
    return (
      <div className="dashboard-container loading">
        <div className="spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard LotoMetrics</h1>
        <div className="lottery-selector">
          <label htmlFor="lottery">Loteria:</label>
          <select
            id="lottery"
            value={selectedLottery}
            onChange={(e) => setSelectedLottery(e.target.value)}
          >
            {lotteries.map(lot => (
              <option key={lot.value} value={lot.value}>
                {lot.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={fetchDashboardData}>Tentar novamente</button>
        </div>
      )}

      {/* KPI Cards */}
      {stats && (
        <div className="kpi-section">
          <StatsCard
            title="Concursos Analisados"
            value={stats.contests_analyzed}
            icon="📊"
            trend={stats.contests_growth}
          />
          <StatsCard
            title="Dezenas Quentes"
            value={stats.hot_numbers_count}
            icon="🔥"
            trend={stats.hot_numbers_change}
          />
          <StatsCard
            title="Dezenas Atrasadas"
            value={stats.delayed_numbers_count}
            icon="⏰"
            trend={stats.delayed_numbers_change}
          />
          <StatsCard
            title="Taxa de Acerto"
            value={`${stats.accuracy_rate}%`}
            icon="🎯"
            trend={stats.accuracy_trend}
          />
        </div>
      )}

      {/* Analytics Panel */}
      {analytics && (
        <div className="analytics-section">
          <AnalyticsPanel data={analytics} lottery={selectedLottery} />
        </div>
      )}

      {/* Recommended Games */}
      {analytics?.jogos_sugeridos && (
        <div className="games-section">
          <h2>Jogos Sugeridos</h2>
          <div className="games-grid">
            {analytics.jogos_sugeridos.slice(0, 6).map((jogo, idx) => (
              <div key={idx} className="game-card">
                <div className="game-number">#{idx + 1}</div>
                <div className="game-numbers">
                  {jogo.map((num, i) => (
                    <span key={i} className="number-badge">
                      {num.padStart(2, '0')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {analytics?.resultados && (
        <div className="results-section">
          <h2>Últimos Resultados</h2>
          <div className="results-list">
            {analytics.resultados.slice(0, 5).map((resultado, idx) => (
              <div key={idx} className="result-item">
                <div className="result-contest">
                  <strong>Concurso {resultado.concurso}</strong>
                </div>
                <div className="result-numbers">
                  {resultado.dezenas.map((num, i) => (
                    <span key={i} className="result-number">{num}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
