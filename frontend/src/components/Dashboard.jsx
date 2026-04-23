import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

const defaultFilters = {
  lottery_type: 'lotofacil',
  total_numbers: 25,
  picks: 15,
  game_count: 6,
  even_target: null,
  min_sum: 120,
  max_sum: 220,
  avoid_sequences: true,
  favor_delayed: true,
  favor_frequent: true,
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function formatLotteryName(value) {
  const map = {
    lotofacil: 'Lotofacil',
    quina: 'Quina',
    megasena: 'Mega-Sena',
  }
  return map[value] || value
}

function formatCurrency(value) {
  return `R$ ${Number(value).toFixed(2)}/mes`
}

function formatConfidence(value) {
  if (typeof value !== 'number') return null
  return `${Math.round(value * 100)}%`
}

function formatSourceLabel(value) {
  if (value === 'ai-ranked') return 'IA validada'
  if (value === 'manual') return 'Motor local'
  if (value === 'pool') return 'Bolao'
  if (value === 'demo') return 'Demo'
  return value
}

function NumberBalls({ numbers }) {
  return (
    <div className="number-list">
      {numbers.map((number) => (
        <span key={number} className="ball">
          {String(number).padStart(2, '0')}
        </span>
      ))}
    </div>
  )
}

function ProviderVotes({ votes }) {
  if (!votes || typeof votes !== 'object' || Object.keys(votes).length === 0) return null

  return (
    <div className="ai-votes">
      {Object.entries(votes).map(([provider, note]) => (
        <div key={provider} className="ai-vote-line">
          <strong>{provider}</strong>
          <span>{String(note)}</span>
        </div>
      ))}
    </div>
  )
}

function GameInsights({ game }) {
  return (
    <>
      <div className="card-badges">
        <span className={`status-badge ${game.source === 'ai-ranked' ? 'ai' : 'neutral'}`}>
          {formatSourceLabel(game.source)}
        </span>
        {typeof game.ai_confidence === 'number' && (
          <span className="status-badge confidence">Confianca {formatConfidence(game.ai_confidence)}</span>
        )}
      </div>
      {game.ai_notes && <p className="ai-note">{game.ai_notes}</p>}
      <ProviderVotes votes={game.ai_provider_votes} />
    </>
  )
}

export default function Dashboard({ user }) {
  const [filters, setFilters] = useState(defaultFilters)
  const [games, setGames] = useState([])
  const [history, setHistory] = useState([])
  const [plans, setPlans] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [latest, setLatest] = useState(null)
  const [resultsHistory, setResultsHistory] = useState([])
  const [cachedResults, setCachedResults] = useState([])
  const [pools, setPools] = useState([])
  const [selectedPool, setSelectedPool] = useState(null)
  const [adminMetrics, setAdminMetrics] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [poolForm, setPoolForm] = useState({
    name: 'Bolao Principal',
    lottery_type: 'lotofacil',
    description: 'Grupo inicial',
    quota_value: 10,
  })
  const [memberEmail, setMemberEmail] = useState('')

  const lotteryConfig = useMemo(
    () => ({
      lotofacil: { total: 25, picks: 15, minSum: 120, maxSum: 220, accent: 'lime' },
      quina: { total: 80, picks: 5, minSum: 80, maxSum: 250, accent: 'sky' },
      megasena: { total: 60, picks: 6, minSum: 100, maxSum: 240, accent: 'amber' },
    }),
    [],
  )

  const refreshAll = async (lotteryType = filters.lottery_type) => {
    try {
      const requests = [
        api.history(),
        api.plans(),
        api.mySubscriptions(),
        api.latestResult(lotteryType),
        api.resultsHistory(lotteryType, 5),
        api.cachedResults(lotteryType),
        api.pools(),
        api.me(),
      ]
      const [hist, plansRes, subs, latestRes, latestHistory, cached, poolsRes, me] =
        await Promise.all(requests)
      setHistory(hist)
      setPlans(plansRes)
      setSubscriptions(subs)
      setLatest(latestRes)
      setResultsHistory(latestHistory.items || [])
      setCachedResults(cached)
      setPools(poolsRes)
      if (me?.is_admin) {
        const metrics = await api.adminMetrics()
        setAdminMetrics(metrics)
      } else {
        setAdminMetrics(null)
      }
    } catch (error) {
      setMessage(`Erro ao carregar dashboard: ${error.message}`)
    }
  }

  useEffect(() => {
    refreshAll()
  }, [])

  const changeLottery = async (lotteryType) => {
    const config = lotteryConfig[lotteryType]
    setFilters((current) => ({
      ...current,
      lottery_type: lotteryType,
      total_numbers: config.total,
      picks: config.picks,
      min_sum: config.minSum,
      max_sum: config.maxSum,
    }))
    await refreshAll(lotteryType)
  }

  const handleGenerate = async () => {
    setLoading(true)
    setMessage('')
    try {
      const generated = await api.generateAndSave(filters)
      setGames(generated)
      await refreshAll(filters.lottery_type)
      setMessage(`${generated.length} jogo(s) gerado(s) e salvo(s) com sucesso.`)
    } catch (error) {
      setMessage(`Falha ao gerar jogos: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePool = async () => {
    try {
      await api.createPool(poolForm)
      setMessage('Bolao criado com sucesso.')
      await refreshAll(filters.lottery_type)
    } catch (error) {
      setMessage(`Erro ao criar bolao: ${error.message}`)
    }
  }

  const openPool = async (id) => {
    try {
      setSelectedPool(await api.poolDetail(id))
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleAddMember = async () => {
    if (!selectedPool) return
    try {
      await api.addPoolMember(selectedPool.id, { email: memberEmail, quota_count: 1 })
      setSelectedPool(await api.poolDetail(selectedPool.id))
      setMemberEmail('')
      setMessage('Membro adicionado ao bolao.')
    } catch (error) {
      setMessage(`Erro ao adicionar membro: ${error.message}`)
    }
  }

  const handleGeneratePoolGames = async () => {
    if (!selectedPool) return
    try {
      await api.generatePoolGames(selectedPool.id, {
        ...filters,
        lottery_type: selectedPool.lottery_type,
      })
      setSelectedPool(await api.poolDetail(selectedPool.id))
      setMessage('Jogos do bolao criados.')
    } catch (error) {
      setMessage(`Erro ao gerar jogos do bolao: ${error.message}`)
    }
  }

  const handleActivatePlan = async (plan) => {
    try {
      await api.activatePlan(plan)
      await refreshAll(filters.lottery_type)
      setMessage(`Plano ${plan} ativado.`)
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleCheckout = async (plan, provider) => {
    try {
      const response = await api.checkout({ plan, provider })
      setMessage(`Checkout ${response.status}: ${response.checkout_url}`)
      await refreshAll(filters.lottery_type)
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleExportCsv = async () => {
    try {
      downloadBlob(await api.exportCsv(), 'historico-jogos.csv')
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleExportPdf = async (id) => {
    try {
      downloadBlob(await api.exportPdf(id), `jogo-${id}.pdf`)
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleSyncResults = async () => {
    try {
      await api.syncResults(filters.lottery_type)
      await refreshAll(filters.lottery_type)
      setMessage('Cache de resultados sincronizado.')
    } catch (error) {
      setMessage(`Erro ao sincronizar: ${error.message}`)
    }
  }

  const quickStats = [
    { label: 'Jogos salvos', value: history.length },
    { label: 'Assinaturas', value: subscriptions.length },
    { label: 'Boloes', value: pools.length },
    { label: 'Resultados em cache', value: cachedResults.length },
  ]
  const aiGames = history.filter((game) => game.source === 'ai-ranked')
  const aiAverageConfidence = aiGames.length
    ? Math.round(
        (aiGames.reduce((total, game) => total + (game.ai_confidence || 0), 0) / aiGames.length) * 100,
      )
    : 0

  return (
    <section className="dashboard-shell">
      <section className="overview-strip card">
        <div>
          <p className="eyebrow">Painel principal</p>
          <h2>Operacao comercial pronta para demonstracao</h2>
          <p className="muted section-copy">
            Explore geracao, historico, resultados, planos e recursos administrativos em um fluxo
            mais organizado para teste e apresentacao.
          </p>
        </div>
        <div className="overview-grid">
          {quickStats.map((item) => (
            <div key={item.label} className="overview-item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      {message && <div className="message-banner">{message}</div>}

      <section className="quick-actions-bar">
        <button className="action-pill" onClick={handleGenerate}>Gerar jogos</button>
        <button className="action-pill secondary-button" onClick={handleExportCsv}>
          Exportar CSV
        </button>
        <button className="action-pill secondary-button" onClick={handleSyncResults}>
          Atualizar resultados
        </button>
      </section>

      <section className="dashboard-grid">
        <div className="card hero-card">
          <div className="hero-card-top">
            <div>
              <p className="eyebrow">Gerador inteligente</p>
              <h3>Monte jogos com estrategia e controle</h3>
            </div>
            <span className={`lottery-chip ${lotteryConfig[filters.lottery_type].accent}`}>
              {formatLotteryName(filters.lottery_type)}
            </span>
          </div>

          <div className="form-grid">
            <div className="field">
              <label>Tipo de loteria</label>
              <select
                value={filters.lottery_type}
                onChange={(event) => changeLottery(event.target.value)}
              >
                <option value="lotofacil">Lotofacil</option>
                <option value="quina">Quina</option>
                <option value="megasena">Mega-Sena</option>
              </select>
            </div>
            <div className="field">
              <label>Jogos</label>
              <input
                type="number"
                value={filters.game_count}
                min="1"
                max="100"
                onChange={(event) =>
                  setFilters({ ...filters, game_count: Number(event.target.value) })
                }
              />
            </div>
            <div className="field">
              <label>Dezenas por jogo</label>
              <input
                type="number"
                value={filters.picks}
                min="5"
                max={filters.total_numbers}
                onChange={(event) => setFilters({ ...filters, picks: Number(event.target.value) })}
              />
            </div>
            <div className="field">
              <label>Soma minima</label>
              <input
                type="number"
                value={filters.min_sum}
                onChange={(event) => setFilters({ ...filters, min_sum: Number(event.target.value) })}
              />
            </div>
            <div className="field">
              <label>Soma maxima</label>
              <input
                type="number"
                value={filters.max_sum}
                onChange={(event) => setFilters({ ...filters, max_sum: Number(event.target.value) })}
              />
            </div>
          </div>

          <div className="generator-footer">
            <button className="primary-button" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Gerando...' : 'Gerar e salvar'}
            </button>
            <div className="mini-note">Plano atual: {user?.plan || 'starter'}</div>
          </div>
        </div>

        <div className="card result-card">
          <div className="row-between">
            <div>
              <p className="eyebrow">Resultado do dia</p>
              <h3>Ultimo concurso</h3>
            </div>
            <button className="secondary-button" onClick={handleSyncResults}>Sincronizar</button>
          </div>
          {latest ? (
            <>
              <div className="result-headline">
                <strong>{formatLotteryName(latest.lottery_type)}</strong>
                <span>Concurso {latest.contest}</span>
              </div>
              <NumberBalls numbers={latest.numbers} />
              <div className="result-meta">
                <span>Data: {latest.draw_date || '--'}</span>
                <span>Fonte: {latest.source}</span>
              </div>
              <div className="prize-panel">
                <span>Premio estimado</span>
                <strong>{latest.estimated_prize || '--'}</strong>
              </div>
            </>
          ) : (
            <p className="muted">Carregando resultados...</p>
          )}
        </div>

        <div className="card result-card">
          <div className="row-between">
            <div>
              <p className="eyebrow">Analise IA</p>
              <h3>Consenso aplicado</h3>
            </div>
            <span className="section-counter">{aiGames.length} jogos validados</span>
          </div>
          <div className="analysis-stats">
            <div className="analysis-stat">
              <span>Jogos com consenso</span>
              <strong>{aiGames.length}</strong>
            </div>
            <div className="analysis-stat">
              <span>Confianca media</span>
              <strong>{aiAverageConfidence}%</strong>
            </div>
          </div>
          <p className="muted">
            O motor local continua gerando candidatos e a camada de IA destaca apenas os jogos que
            receberam sinal suficiente de consenso.
          </p>
        </div>

        <div className="card full-width">
          <div className="section-header">
            <div>
              <p className="eyebrow">Ultimos gerados</p>
              <h3>Historico salvo</h3>
            </div>
            <span className="section-counter">{history.length} registros</span>
          </div>
          <div className="games-grid">
            {history.length === 0 ? (
              <p className="muted">Sem historico ainda.</p>
            ) : (
              history.map((game) => (
                <article className="game-card-panel" key={game.id}>
                  <div className="row-between">
                    <strong>#{game.id} - {formatLotteryName(game.lottery_type)}</strong>
                    <button className="ghost-button" onClick={() => handleExportPdf(game.id)}>
                      PDF
                    </button>
                  </div>
                  <GameInsights game={game} />
                  <NumberBalls numbers={game.numbers} />
                  <small className="muted">
                    Score {game.score} - soma {game.game_sum} - pares {game.even_count} -
                    {' '}
                    origem {game.source}
                  </small>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="card full-width">
          <div className="section-header">
            <div>
              <p className="eyebrow">Monetizacao</p>
              <h3>Planos e assinatura</h3>
            </div>
          </div>
          <div className="plans-grid">
            {plans.map((plan) => (
              <div className="plan-card premium-card" key={plan.slug}>
                <div className="row-between">
                  <h4>{plan.name}</h4>
                  <span className="plan-pill">{plan.slug}</span>
                </div>
                <div className="price">{formatCurrency(plan.price_brl_monthly)}</div>
                <ul className="feature-list">
                  {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <small className="muted">
                  Limite por lote: {plan.limits.max_games_per_batch} -
                  {' '}
                  {plan.limits.max_pools === 9999
                    ? 'Boloes ilimitados'
                    : `${plan.limits.max_pools} boloes`}
                </small>
                <div className="actions">
                  <button className="primary-button" onClick={() => handleActivatePlan(plan.slug)}>
                    Ativar demo
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => handleCheckout(plan.slug, 'stripe')}
                  >
                    Checkout
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="subscriptions-list">
            <h4>Historico de assinatura</h4>
            {subscriptions.length === 0 ? (
              <p className="muted">Sem assinaturas registradas.</p>
            ) : (
              subscriptions.map((item) => (
                <div key={item.id} className="subscription-item">
                  <strong>{item.plan}</strong>
                  <span>{item.provider}</span>
                  <span>{item.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card full-width">
          <div className="section-header">
            <div>
              <p className="eyebrow">Analise IA</p>
              <h3>Jogos com justificativa de ranking</h3>
            </div>
            <span className="section-counter">{aiGames.length} itens</span>
          </div>
          <div className="games-grid">
            {aiGames.length === 0 ? (
              <p className="muted">
                Gere novos jogos para visualizar candidatos aprovados pela camada de IA.
              </p>
            ) : (
              aiGames.slice(0, 6).map((game) => (
                <article className="game-card-panel ai-featured-card" key={`ai-${game.id}`}>
                  <div className="row-between">
                    <strong>#{game.id} - {formatLotteryName(game.lottery_type)}</strong>
                    <span className="status-badge ai">Top IA</span>
                  </div>
                  <NumberBalls numbers={game.numbers} />
                  <small className="muted">
                    Score {game.score} - soma {game.game_sum} - pares {game.even_count}
                  </small>
                  <GameInsights game={game} />
                </article>
              ))
            )}
          </div>
        </div>

        <div className="card full-width">
          <div className="section-header">
            <div>
              <p className="eyebrow">Colaboracao</p>
              <h3>Boloes</h3>
            </div>
          </div>
          <div className="split-layout">
            <div className="form-column">
              <div className="field">
                <label>Nome</label>
                <input
                  value={poolForm.name}
                  onChange={(event) => setPoolForm({ ...poolForm, name: event.target.value })}
                />
              </div>
              <div className="field">
                <label>Loteria</label>
                <select
                  value={poolForm.lottery_type}
                  onChange={(event) =>
                    setPoolForm({ ...poolForm, lottery_type: event.target.value })
                  }
                >
                  <option value="lotofacil">Lotofacil</option>
                  <option value="quina">Quina</option>
                  <option value="megasena">Mega-Sena</option>
                </select>
              </div>
              <div className="field">
                <label>Descricao</label>
                <input
                  value={poolForm.description}
                  onChange={(event) =>
                    setPoolForm({ ...poolForm, description: event.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>Valor da cota</label>
                <input
                  type="number"
                  value={poolForm.quota_value}
                  onChange={(event) =>
                    setPoolForm({ ...poolForm, quota_value: Number(event.target.value) })
                  }
                />
              </div>
              <button className="primary-button" onClick={handleCreatePool}>Criar bolao</button>
            </div>

            <div>
              <div className="games-grid">
                {pools.length === 0 ? (
                  <p className="muted">Nenhum bolao criado.</p>
                ) : (
                  pools.map((pool) => (
                    <div className="game-card-panel" key={pool.id}>
                      <strong>{pool.name}</strong>
                      <p className="muted">
                        {formatLotteryName(pool.lottery_type)} - {pool.members_count} membros -
                        {' '}
                        {pool.games_count} jogos
                      </p>
                      <button className="ghost-button" onClick={() => openPool(pool.id)}>
                        Abrir
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {selectedPool && (
            <div className="pool-detail">
              <div className="section-header">
                <div>
                  <h4>{selectedPool.name}</h4>
                  <p className="muted">{selectedPool.description || 'Sem descricao'}</p>
                </div>
              </div>
              <div className="pool-toolbar">
                <input
                  placeholder="email do membro"
                  value={memberEmail}
                  onChange={(event) => setMemberEmail(event.target.value)}
                />
                <button className="secondary-button" onClick={handleAddMember}>
                  Adicionar membro
                </button>
                <button className="primary-button" onClick={handleGeneratePoolGames}>
                  Gerar jogos do bolao
                </button>
              </div>

              <div className="split-layout">
                <div>
                  <h4>Membros</h4>
                  <div className="games-grid">
                    {selectedPool.members.map((member) => (
                      <div className="game-card-panel" key={member.id}>
                        <strong>{member.email}</strong>
                        <small className="muted">{member.role}</small>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4>Jogos do bolao</h4>
                  <div className="games-grid">
                    {selectedPool.games.map((game) => (
                      <div className="game-card-panel" key={game.id}>
                        <NumberBalls numbers={game.numbers} />
                        <small className="muted">Score {game.score}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card full-width">
          <div className="section-header">
            <div>
              <p className="eyebrow">Resultados</p>
              <h3>Historico remoto e cache local</h3>
            </div>
          </div>
          <div className="split-layout">
            <div>
              <h4>Historico remoto</h4>
              <div className="games-grid">
                {resultsHistory.map((item) => (
                  <div className="game-card-panel" key={`${item.lottery_type}-${item.contest}`}>
                    <strong>{formatLotteryName(item.lottery_type)} - concurso {item.contest}</strong>
                    <NumberBalls numbers={item.numbers} />
                    <small className="muted">{item.draw_date || '--'}</small>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4>Cache local</h4>
              <div className="games-grid">
                {cachedResults.map((item, index) => (
                  <div className="game-card-panel" key={`${item.contest}-${index}`}>
                    <strong>Concurso {item.contest}</strong>
                    <NumberBalls numbers={item.numbers} />
                    <small className="muted">{item.draw_date || '--'} - {item.source}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {games.length > 0 && (
          <div className="card full-width">
            <div className="section-header">
              <div>
                <p className="eyebrow">Ultima rodada</p>
                <h3>Jogos gerados agora</h3>
              </div>
            </div>
            <div className="games-grid">
              {games.map((game) => (
                <div className="game-card-panel" key={game.id}>
                  <strong>{formatLotteryName(game.lottery_type)}</strong>
                  <GameInsights game={game} />
                  <NumberBalls numbers={game.numbers} />
                  <small className="muted">Score {game.score} - soma {game.game_sum}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminMetrics && (
          <div className="card full-width admin-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Admin</p>
                <h3>Painel executivo</h3>
              </div>
            </div>
            <div className="overview-grid">
              <div className="overview-item">
                <span>Usuarios</span>
                <strong>{adminMetrics.total_users}</strong>
              </div>
              <div className="overview-item">
                <span>Assinaturas ativas</span>
                <strong>{adminMetrics.active_subscriptions}</strong>
              </div>
              <div className="overview-item">
                <span>Jogos</span>
                <strong>{adminMetrics.total_games}</strong>
              </div>
              <div className="overview-item">
                <span>Boloes</span>
                <strong>{adminMetrics.total_pools}</strong>
              </div>
            </div>
            <pre className="json-box">{JSON.stringify(adminMetrics.plan_breakdown, null, 2)}</pre>
          </div>
        )}
      </section>
    </section>
  )
}
