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
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
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
  const [poolForm, setPoolForm] = useState({ name: 'Bolão Principal', lottery_type: 'lotofacil', description: 'Grupo inicial', quota_value: 10 })
  const [memberEmail, setMemberEmail] = useState('')

  const lotteryConfig = useMemo(() => ({
    lotofacil: { total: 25, picks: 15, minSum: 120, maxSum: 220 },
    quina: { total: 80, picks: 5, minSum: 80, maxSum: 250 },
    megasena: { total: 60, picks: 6, minSum: 100, maxSum: 240 },
  }), [])

  const refreshAll = async (lotteryType = filters.lottery_type) => {
    try {
      const requests = [
        api.history(), api.plans(), api.mySubscriptions(), api.latestResult(lotteryType), api.resultsHistory(lotteryType, 5), api.cachedResults(lotteryType), api.pools(), api.me()
      ]
      const [hist, plansRes, subs, latestRes, latestHistory, cached, poolsRes, me] = await Promise.all(requests)
      setHistory(hist); setPlans(plansRes); setSubscriptions(subs); setLatest(latestRes); setResultsHistory(latestHistory.items || []); setCachedResults(cached); setPools(poolsRes)
      if (me?.is_admin) {
        const metrics = await api.adminMetrics()
        setAdminMetrics(metrics)
      }
    } catch (error) {
      setMessage(`Erro ao carregar dashboard: ${error.message}`)
    }
  }

  useEffect(() => { refreshAll() }, [])

  const changeLottery = async (lotteryType) => {
    const conf = lotteryConfig[lotteryType]
    setFilters((prev) => ({ ...prev, lottery_type: lotteryType, total_numbers: conf.total, picks: conf.picks, min_sum: conf.minSum, max_sum: conf.maxSum }))
    await refreshAll(lotteryType)
  }

  const handleGenerate = async () => {
    setLoading(true); setMessage('')
    try {
      const generated = await api.generateAndSave(filters)
      setGames(generated)
      await refreshAll(filters.lottery_type)
      setMessage(`Foram gerados ${generated.length} jogos com persistência no banco.`)
    } catch (error) {
      setMessage(`Falha ao gerar jogos: ${error.message}`)
    } finally { setLoading(false) }
  }

  const handleCreatePool = async () => {
    try {
      await api.createPool(poolForm)
      setMessage('Bolão criado com sucesso.')
      await refreshAll(filters.lottery_type)
    } catch (error) {
      setMessage(`Erro ao criar bolão: ${error.message}`)
    }
  }

  const openPool = async (id) => {
    try { setSelectedPool(await api.poolDetail(id)) } catch (error) { setMessage(error.message) }
  }

  const handleAddMember = async () => {
    if (!selectedPool) return
    try {
      await api.addPoolMember(selectedPool.id, { email: memberEmail, quota_count: 1 })
      setSelectedPool(await api.poolDetail(selectedPool.id))
      setMemberEmail('')
      setMessage('Membro adicionado ao bolão.')
    } catch (error) { setMessage(`Erro ao adicionar membro: ${error.message}`) }
  }

  const handleGeneratePoolGames = async () => {
    if (!selectedPool) return
    try {
      await api.generatePoolGames(selectedPool.id, { ...filters, lottery_type: selectedPool.lottery_type })
      setSelectedPool(await api.poolDetail(selectedPool.id))
      setMessage('Jogos do bolão criados.')
    } catch (error) { setMessage(`Erro ao gerar jogos do bolão: ${error.message}`) }
  }

  const handleActivatePlan = async (plan) => { try { await api.activatePlan(plan); await refreshAll(filters.lottery_type); setMessage(`Plano ${plan} ativado.`) } catch (error) { setMessage(error.message) } }
  const handleCheckout = async (plan, provider) => { try { const res = await api.checkout({ plan, provider }); setMessage(`Checkout ${res.status}: ${res.checkout_url}`); await refreshAll(filters.lottery_type) } catch (error) { setMessage(error.message) } }
  const handleExportCsv = async () => { try { downloadBlob(await api.exportCsv(), 'historico-jogos.csv') } catch (error) { setMessage(error.message) } }
  const handleExportPdf = async (id) => { try { downloadBlob(await api.exportPdf(id), `jogo-${id}.pdf`) } catch (error) { setMessage(error.message) } }
  const handleSyncResults = async () => { try { await api.syncResults(filters.lottery_type); await refreshAll(filters.lottery_type); setMessage('Cache de resultados sincronizado.') } catch (error) { setMessage(`Erro ao sincronizar: ${error.message}`) } }

  return (
    <section className="dashboard-grid">
      <div className="card full-width">
        <h2>Versão 3 comercial</h2>
        <p>Planos com limites, bolões, cache local de resultados, webhooks e painel admin-ready.</p>
        {message && <div className="message">{message}</div>}
      </div>

      <div className="card">
        <h3>Gerador V3</h3>
        <label>Tipo de loteria</label>
        <select value={filters.lottery_type} onChange={(e) => changeLottery(e.target.value)}>
          <option value="lotofacil">Lotofácil</option><option value="quina">Quina</option><option value="megasena">Mega-Sena</option>
        </select>
        <label>Jogos</label>
        <input type="number" value={filters.game_count} min="1" max="100" onChange={(e) => setFilters({ ...filters, game_count: Number(e.target.value) })} />
        <label>Dezenas por jogo</label>
        <input type="number" value={filters.picks} min="5" max={filters.total_numbers} onChange={(e) => setFilters({ ...filters, picks: Number(e.target.value) })} />
        <label>Soma mínima</label>
        <input type="number" value={filters.min_sum} onChange={(e) => setFilters({ ...filters, min_sum: Number(e.target.value) })} />
        <label>Soma máxima</label>
        <input type="number" value={filters.max_sum} onChange={(e) => setFilters({ ...filters, max_sum: Number(e.target.value) })} />
        <button onClick={handleGenerate} disabled={loading}>{loading ? 'Gerando...' : 'Gerar e salvar'}</button>
        <small className="muted">Plano atual: {user?.plan || 'starter'}</small>
      </div>

      <div className="card">
        <div className="row-between"><h3>Último resultado</h3><button onClick={handleSyncResults}>Sincronizar cache</button></div>
        {latest ? <>
          <div className="result-title">{latest.lottery_type} · concurso {latest.contest}</div>
          <div className="number-list">{latest.numbers.map((n) => <span key={n} className="ball">{String(n).padStart(2, '0')}</span>)}</div>
          <p>Data: {latest.draw_date || '—'}</p><p>Estimativa: {latest.estimated_prize || '—'}</p><p className="muted">Fonte: {latest.source}</p>
        </> : <p>Carregando...</p>}
      </div>

      <div className="card full-width">
        <h3>Histórico salvo</h3>
        <div className="row-between"><span>{history.length} registros</span><button onClick={handleExportCsv}>Exportar CSV</button></div>
        <div className="games-grid">{history.length === 0 ? <p>Sem histórico ainda.</p> : history.map((game) => (
          <div className="game-item" key={game.id}><div className="row-between"><strong>#{game.id} · {game.lottery_type}</strong><button onClick={() => handleExportPdf(game.id)}>PDF</button></div>
          <div className="number-list">{game.numbers.map((n) => <span key={n} className="ball">{String(n).padStart(2, '0')}</span>)}</div>
          <small>Score {game.score} · soma {game.game_sum} · pares {game.even_count} · origem {game.source}</small></div>
        ))}</div>
      </div>

      <div className="card full-width">
        <h3>Assinaturas</h3>
        <div className="plans-grid">{plans.map((plan) => (
          <div className="plan-card" key={plan.slug}><h4>{plan.name}</h4><div className="price">R$ {plan.price_brl_monthly.toFixed(2)}/mês</div><ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <small className="muted">Limites: {plan.limits.max_games_per_batch} por geração · {plan.limits.max_pools === 9999 ? 'bolões ilimitados' : `${plan.limits.max_pools} bolões`}</small>
          <div className="actions"><button onClick={() => handleActivatePlan(plan.slug)}>Ativar demo</button><button onClick={() => handleCheckout(plan.slug, 'stripe')}>Checkout Stripe</button></div></div>
        ))}</div>
        <div className="subscriptions-list"><h4>Meu histórico de assinatura</h4>{subscriptions.length === 0 ? <p>Sem assinaturas registradas.</p> : subscriptions.map((s) => <div key={s.id} className="subscription-item">{s.plan} · {s.provider} · {s.status}</div>)}</div>
      </div>

      <div className="card full-width">
        <h3>Bolões</h3>
        <div className="grid-2">
          <div>
            <label>Nome</label><input value={poolForm.name} onChange={(e) => setPoolForm({ ...poolForm, name: e.target.value })} />
            <label>Loteria</label><select value={poolForm.lottery_type} onChange={(e) => setPoolForm({ ...poolForm, lottery_type: e.target.value })}><option value="lotofacil">Lotofácil</option><option value="quina">Quina</option><option value="megasena">Mega-Sena</option></select>
            <label>Valor da cota</label><input type="number" value={poolForm.quota_value} onChange={(e) => setPoolForm({ ...poolForm, quota_value: Number(e.target.value) })} />
            <button onClick={handleCreatePool}>Criar bolão</button>
          </div>
          <div>
            <div className="games-grid">{pools.length === 0 ? <p>Nenhum bolão criado.</p> : pools.map((pool) => <div className="game-item" key={pool.id}><strong>{pool.name}</strong><p>{pool.lottery_type} · {pool.members_count} membros · {pool.games_count} jogos</p><button onClick={() => openPool(pool.id)}>Abrir</button></div>)}</div>
          </div>
        </div>
        {selectedPool && <div className="pool-detail"><h4>{selectedPool.name}</h4><p>{selectedPool.description || 'Sem descrição'}</p>
          <div className="row-between"><input placeholder="email do membro" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} /><button onClick={handleAddMember}>Adicionar membro</button><button onClick={handleGeneratePoolGames}>Gerar jogos do bolão</button></div>
          <div className="games-grid">{selectedPool.members.map((m) => <div className="game-item" key={m.id}>{m.email} · {m.role}</div>)}</div>
          <div className="games-grid">{selectedPool.games.map((g) => <div className="game-item" key={g.id}><div className="number-list">{g.numbers.map((n) => <span key={n} className="ball">{String(n).padStart(2, '0')}</span>)}</div><small>Score {g.score}</small></div>)}</div>
        </div>}
      </div>

      <div className="card full-width">
        <h3>Resultados e cache</h3>
        <div className="grid-2">
          <div><h4>Histórico remoto</h4><div className="games-grid">{resultsHistory.map((item) => <div className="game-item" key={`${item.lottery_type}-${item.contest}`}><strong>{item.lottery_type} · concurso {item.contest}</strong><div className="number-list">{item.numbers.map((n) => <span key={n} className="ball">{String(n).padStart(2, '0')}</span>)}</div><small>{item.draw_date || '—'}</small></div>)}</div></div>
          <div><h4>Cache local</h4><div className="games-grid">{cachedResults.map((item, idx) => <div className="game-item" key={`${item.contest}-${idx}`}><strong>Concurso {item.contest}</strong><div className="number-list">{item.numbers.map((n) => <span key={n} className="ball">{String(n).padStart(2, '0')}</span>)}</div><small>{item.draw_date || '—'} · {item.source}</small></div>)}</div></div>
        </div>
      </div>

      {adminMetrics && <div className="card full-width"><h3>Painel admin</h3><div className="plans-grid">
        <div className="plan-card"><h4>Usuários</h4><div className="price">{adminMetrics.total_users}</div></div>
        <div className="plan-card"><h4>Assinaturas ativas</h4><div className="price">{adminMetrics.active_subscriptions}</div></div>
        <div className="plan-card"><h4>Jogos</h4><div className="price">{adminMetrics.total_games}</div></div>
        <div className="plan-card"><h4>Bolões</h4><div className="price">{adminMetrics.total_pools}</div></div>
      </div><pre className="json-box">{JSON.stringify(adminMetrics.plan_breakdown, null, 2)}</pre></div>}
    </section>
  )
}
