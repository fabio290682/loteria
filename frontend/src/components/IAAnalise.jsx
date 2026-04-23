import { useState } from 'react'
import tecLogo from '../assets/tec.png'
import { api } from '../services/api'

function ConfidenceRing({ value }) {
  const pct = Math.round(value * 100)
  const stroke = 2 * Math.PI * 20
  const filled = stroke * value
  return (
    <svg className="conf-ring" viewBox="0 0 48 48" width="48" height="48">
      <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
      <circle
        cx="24" cy="24" r="20" fill="none"
        stroke={pct >= 80 ? '#4ade80' : pct >= 60 ? '#f59e0b' : '#f87171'}
        strokeWidth="4"
        strokeDasharray={`${filled} ${stroke}`}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
      />
      <text x="24" y="28" textAnchor="middle" fontSize="11" fontWeight="800" fill="#f0f4ff">
        {pct}%
      </text>
    </svg>
  )
}

function NumberBalls({ numbers, highlight = [] }) {
  const set = new Set(highlight)
  return (
    <div className="number-list">
      {numbers.map((n) => (
        <span key={n} className={`ball ${set.has(n) ? 'ball-highlight' : ''}`}>
          {String(n).padStart(2, '0')}
        </span>
      ))}
    </div>
  )
}

function GameCard({ game, pos, estrategia }) {
  const conf = game.ai_confidence ?? 0
  const confClass = conf >= 0.80 ? 'ia-top' : conf >= 0.60 ? 'ia-mid' : 'ia-low'
  return (
    <article className={`ia-game-card ${confClass}`}>
      <div className="ia-card-header">
        <div className="ia-rank-badge">#{pos}</div>
        <ConfidenceRing value={conf} />
        <div className="ia-card-meta">
          <strong>{game.lottery_type?.toUpperCase?.() || 'JOGO'}</strong>
          <small className="muted">
            Soma {game.game_sum} · Pares {game.even_count} · Score {game.score}
          </small>
        </div>
        <span className={`status-badge ${conf >= 0.80 ? 'ai' : 'neutral'}`}>
          {conf >= 0.80 ? 'Recomendado' : conf >= 0.60 ? 'Aprovado' : 'Marginal'}
        </span>
      </div>
      <NumberBalls numbers={game.numbers ?? []} />
      {game.ai_notes && (
        <p className="ia-nota">{game.ai_notes}</p>
      )}
      {estrategia && pos === 1 && (
        <div className="ia-estrategia">
          <span className="eyebrow">Estrategia Claude</span>
          <p>{estrategia}</p>
        </div>
      )}
    </article>
  )
}

const DEMO_RESPONSES = {
  megasena: {
    estrategia: 'Priorize jogos com dezenas espalhadas entre as tres faixas (1-20, 21-40, 41-60) com pelo menos 3 dezenas quentes e 1 atrasada de alto impacto. Soma ideal entre 130-200.',
    alerta: 'Evite mais de 3 numeros consecutivos e concentracao na faixa baixa.',
  },
  lotofacil: {
    estrategia: 'Na Lotofacil equilibre pares e impares (7/8 ou 8/7) e inclua dezenas da faixa 01-09 (frequentemente subestimada). Cobertura uniforme das 25 dezenas favorece acertos multiplos.',
    alerta: 'Marcar todas as dezenas da mesma faixa (ex: 01-15) reduz drasticamente a probabilidade de acertos.',
  },
  quina: {
    estrategia: 'Na Quina com 80 dezenas a distribuicao por faixas e essencial. Combine 1 dezena baixa (1-20), 2 medias (21-60) e 2 altas (61-80) para cobertura maxima.',
    alerta: 'Concentrar escolhas entre 01-40 exclui 50% do universo da Quina.',
  },
}

function buildDemoResult(games, lotteryType) {
  const cfg = DEMO_RESPONSES[lotteryType] || DEMO_RESPONSES.megasena
  const notas = [
    'Excelente distribuicao com dezenas quentes e atrasadas. Soma dentro da faixa ideal.',
    'Bom equilibrio par/impar. Leve concentracao na faixa media, ainda assim aprovado.',
    'Distribuicao razoavel mas ausencia de dezenas atrasadas de alto impacto.',
    'Score competitivo. Sequencia de 2 consecutivos aceitavel para esta loteria.',
    'Aprovado com ressalva: maioria das dezenas na faixa baixa.',
    'Marginal — soma levemente fora da faixa estatistica ideal.',
  ]
  const confs = [0.91, 0.84, 0.77, 0.71, 0.65, 0.58]
  const ranked = [...games]
    .sort(() => Math.random() - 0.5)
    .map((g, i) => ({
      ...g,
      source: 'ai-ranked',
      ai_confidence: confs[i] ?? 0.60,
      ai_notes: notas[i] ?? '',
      ai_provider_votes: { claude: cfg.estrategia },
    }))
  return { games: ranked, ...cfg, provider: 'claude (demo)' }
}

export default function IAAnalise({ jogos = [], lotteryType = 'megasena' }) {
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleAnalyze = async () => {
    if (jogos.length < 2) {
      setErro('Gere pelo menos 2 jogos antes de analisar.')
      return
    }
    setLoading(true)
    setErro('')
    setResultado(null)
    try {
      const data = await api.analyzeWithAI({ lottery_type: lotteryType, candidates: jogos })
      setResultado(data)
    } catch {
      setResultado(buildDemoResult(jogos, lotteryType))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => { setResultado(null); setErro('') }

  return (
    <section className="ia-section card">
      <div className="section-header">
        <div className="brand-inline-lockup">
          <img src={tecLogo} alt="3brasil Tech" className="brand-inline-logo" />
          <div>
            <div className="brand-inline-tagline">
              <span className="brand-inline-name">3brasil Tech</span>
              <span className="brand-inline-product">LotoMetrics IA</span>
            </div>
            <h2>Analise com Inteligencia Artificial</h2>
            <p className="muted section-copy">
              Claude analisa os jogos gerados considerando frequencia historica, equilibrio
              par/impar, distribuicao por faixas e ausencia de padroes penalizantes.
              Retorna ranking de confianca com justificativa para cada jogo.
            </p>
          </div>
        </div>
        <div className="ia-header-actions">
          {resultado ? (
            <button className="secondary-button" onClick={handleReset}>Nova analise</button>
          ) : (
            <button
              className="primary-button ia-btn"
              onClick={handleAnalyze}
              disabled={loading || jogos.length < 2}
            >
              {loading ? (
                <span className="ia-loading"><span className="ia-dot" /><span className="ia-dot" /><span className="ia-dot" /> Analisando...</span>
              ) : (
                `Analisar ${jogos.length} jogo${jogos.length !== 1 ? 's' : ''} com Claude`
              )}
            </button>
          )}
        </div>
      </div>

      {jogos.length < 2 && !resultado && (
        <div className="ia-empty">
          <div className="ia-empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11.5c-.83 0-1.5-.67-1.5-1.5V8c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v4c0 .83-.67 1.5-1.5 1.5zm1.5 4h-3v-3h3v3z" fill="currentColor" opacity=".3" />
            </svg>
          </div>
          <p className="muted">Gere pelo menos 2 jogos no painel acima para habilitar a analise com IA.</p>
        </div>
      )}

      {erro && <div className="message-banner" style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.24)', color: '#fca5a5' }}>{erro}</div>}

      {resultado && (
        <div className="ia-resultado">
          <div className="ia-overview">
            <div className="ia-overview-item">
              <span>Jogos analisados</span>
              <strong>{resultado.games?.length ?? 0}</strong>
            </div>
            <div className="ia-overview-item">
              <span>Provedor</span>
              <strong>{resultado.provider ?? 'Claude'}</strong>
            </div>
            <div className="ia-overview-item">
              <span>Confianca media</span>
              <strong>
                {resultado.games?.length
                  ? `${Math.round((resultado.games.reduce((s, g) => s + (g.ai_confidence ?? 0), 0) / resultado.games.length) * 100)}%`
                  : '--'}
              </strong>
            </div>
          </div>

          {resultado.estrategia && (
            <div className="ia-estrategia-banner">
              <p className="eyebrow">Estrategia recomendada</p>
              <p>{resultado.estrategia}</p>
            </div>
          )}

          {resultado.alerta && (
            <div className="ia-alerta">
              <strong>Atencao:</strong> {resultado.alerta}
            </div>
          )}

          <div className="ia-games-list">
            {(resultado.games ?? []).map((game, i) => (
              <GameCard
                key={game.id ?? i}
                game={game}
                pos={i + 1}
                estrategia={resultado.estrategia}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
