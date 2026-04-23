const RAW_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '')
const FORCE_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const DEMO_MODE = FORCE_DEMO_MODE || !import.meta.env.VITE_API_URL

const STORAGE_KEYS = {
  users: 'lotometrics.demo.users',
  games: 'lotometrics.demo.games',
  subscriptions: 'lotometrics.demo.subscriptions',
  pools: 'lotometrics.demo.pools',
  resultsCache: 'lotometrics.demo.resultsCache',
}

const PLANS = [
  {
    slug: 'starter',
    name: 'Starter',
    price_brl_monthly: 29,
    features: ['10 jogos por geracao', 'Ate 50 jogos/dia', '1 bolao'],
    limits: { daily_generations: 50, max_games_per_batch: 10, max_pools: 1, priority_support: false },
  },
  {
    slug: 'pro',
    name: 'Pro',
    price_brl_monthly: 79,
    features: ['25 jogos por geracao', 'Ate 300 jogos/dia', '5 boloes', 'Exportacoes completas'],
    limits: { daily_generations: 300, max_games_per_batch: 25, max_pools: 5, priority_support: false },
  },
  {
    slug: 'premium',
    name: 'Premium',
    price_brl_monthly: 149,
    features: ['100 jogos por geracao', 'Uso intenso', 'Boloes ilimitados', 'Painel admin-ready'],
    limits: { daily_generations: 5000, max_games_per_batch: 100, max_pools: 9999, priority_support: true },
  },
]

const FALLBACK_RESULTS = {
  megasena: [
    { lottery_type: 'megasena', contest: 2998, draw_date: '2026-04-18', numbers: [4, 15, 17, 20, 24, 54], estimated_prize: 'R$ 70.000.000,00', source: 'demo-local' },
    { lottery_type: 'megasena', contest: 2997, draw_date: '2026-04-16', numbers: [5, 18, 24, 37, 51, 56], estimated_prize: 'R$ 45.000.000,00', source: 'demo-local' },
  ],
  lotofacil: [
    { lottery_type: 'lotofacil', contest: 3668, draw_date: '2026-04-22', numbers: [1, 2, 5, 6, 7, 9, 10, 11, 12, 14, 18, 20, 21, 24, 25], estimated_prize: 'R$ 1.800.000,00', source: 'demo-local' },
    { lottery_type: 'lotofacil', contest: 3667, draw_date: '2026-04-21', numbers: [1, 3, 4, 5, 7, 9, 10, 11, 13, 14, 16, 20, 22, 23, 25], estimated_prize: 'R$ 1.700.000,00', source: 'demo-local' },
  ],
  quina: [
    { lottery_type: 'quina', contest: 6712, draw_date: '2026-04-22', numbers: [3, 11, 26, 37, 78], estimated_prize: 'R$ 600.000,00', source: 'demo-local' },
    { lottery_type: 'quina', contest: 6711, draw_date: '2026-04-21', numbers: [10, 14, 24, 61, 79], estimated_prize: 'R$ 500.000,00', source: 'demo-local' },
  ],
}

function parseBody(body) {
  if (!body) return {}
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch (_) {
      return {}
    }
  }
  return body
}

function getHeaders(extra = {}) {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (_) {
    return fallback
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function ensureSeedData() {
  if (!readStore(STORAGE_KEYS.users, null)) {
    writeStore(STORAGE_KEYS.users, [
      { id: 1, name: 'Demo User', email: 'demo@lotometrics.app', password: '123456', plan: 'starter', is_admin: false },
      { id: 2, name: 'Admin Demo', email: 'owner@admin.local', password: '123456', plan: 'premium', is_admin: true },
    ])
  }
  if (!readStore(STORAGE_KEYS.games, null)) writeStore(STORAGE_KEYS.games, [])
  if (!readStore(STORAGE_KEYS.subscriptions, null)) writeStore(STORAGE_KEYS.subscriptions, [])
  if (!readStore(STORAGE_KEYS.pools, null)) writeStore(STORAGE_KEYS.pools, [])
  if (!readStore(STORAGE_KEYS.resultsCache, null)) writeStore(STORAGE_KEYS.resultsCache, [])
}

function nextId(items) {
  return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1
}

function createToken(email) {
  return `demo-token:${email}`
}

function getCurrentDemoUser() {
  ensureSeedData()
  const token = localStorage.getItem('token') || ''
  const email = token.startsWith('demo-token:') ? token.slice('demo-token:'.length) : null
  if (!email) return null
  const users = readStore(STORAGE_KEYS.users, [])
  return users.find((user) => user.email === email) || null
}

function requireDemoUser() {
  const user = getCurrentDemoUser()
  if (!user) throw new Error('Sessao expirada. Entre novamente.')
  return user
}

function pickNumbers(total, picks) {
  const bag = Array.from({ length: total }, (_, index) => index + 1)
  const chosen = []
  while (chosen.length < picks && bag.length) {
    const index = Math.floor(Math.random() * bag.length)
    chosen.push(bag.splice(index, 1)[0])
  }
  return chosen.sort((a, b) => a - b)
}

function buildGeneratedGame(filters, userId, poolId = null) {
  const picks = Number(filters.picks || filters.numbers_count || 6)
  const total = Number(filters.total_numbers || 60)
  const numbers = pickNumbers(total, picks)
  const gameSum = numbers.reduce((sum, value) => sum + value, 0)
  const aiRanked = Math.random() > 0.35
  const aiConfidence = aiRanked ? Number((0.58 + Math.random() * 0.32).toFixed(2)) : null
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    lottery_type: filters.lottery_type,
    numbers,
    score: Math.floor(20 + Math.random() * 10),
    game_sum: gameSum,
    even_count: numbers.filter((value) => value % 2 === 0).length,
    source: aiRanked ? 'ai-ranked' : 'demo',
    ai_confidence: aiConfidence,
    ai_notes: aiRanked
      ? 'Ranking reforcado por consenso entre motor local, ChatGPT e Gemini no modo demonstracao.'
      : null,
    ai_provider_votes: aiRanked
      ? {
          chatgpt: 'Destacou distribuicao equilibrada e soma central.',
          gemini: 'Priorizou menor concentracao e paridade consistente.',
        }
      : null,
    user_id: userId,
    pool_id: poolId,
  }
}

function toCsv(rows) {
  const header = 'id,lottery_type,numbers,score,game_sum,even_count,source'
  const lines = rows.map((row) => [
    row.id,
    row.lottery_type,
    `"${row.numbers.join('-')}"`,
    row.score,
    row.game_sum,
    row.even_count,
    row.source,
  ].join(','))
  return [header, ...lines].join('\n')
}

function createPdfLikeBlob(game) {
  const content = [
    'LotoMetrics Demo',
    `Jogo #${game.id}`,
    `Loteria: ${game.lottery_type}`,
    `Numeros: ${game.numbers.join(', ')}`,
    `Score: ${game.score}`,
    `Soma: ${game.game_sum}`,
  ].join('\n')
  return new Blob([content], { type: 'application/pdf' })
}

async function mockRequest(path, options = {}) {
  ensureSeedData()
  const payload = parseBody(options.body)

  if (path === '/auth/register' && options.method === 'POST') {
    const users = readStore(STORAGE_KEYS.users, [])
    if (users.some((item) => item.email === payload.email)) throw new Error('E-mail ja cadastrado')
    const created = {
      id: nextId(users),
      name: payload.name || 'Novo usuario',
      email: payload.email,
      password: payload.password,
      plan: 'starter',
      is_admin: String(payload.email || '').endsWith('@admin.local'),
    }
    writeStore(STORAGE_KEYS.users, [...users, created])
    return { id: created.id, name: created.name, email: created.email, plan: created.plan, is_admin: created.is_admin }
  }

  if (path === '/auth/login' && options.method === 'POST') {
    const users = readStore(STORAGE_KEYS.users, [])
    const user = users.find((item) => item.email === payload.email && item.password === payload.password)
    if (!user) throw new Error('Credenciais invalidas')
    return { access_token: createToken(user.email), token_type: 'bearer' }
  }

  if (path === '/auth/me') {
    const user = requireDemoUser()
    return { id: user.id, name: user.name, email: user.email, plan: user.plan, is_admin: user.is_admin }
  }

  if (path === '/games/history') {
    const user = requireDemoUser()
    return readStore(STORAGE_KEYS.games, []).filter((item) => item.user_id === user.id).sort((a, b) => b.id - a.id)
  }

  if (path === '/games/generate-and-save' && options.method === 'POST') {
    const user = requireDemoUser()
    const games = readStore(STORAGE_KEYS.games, [])
    const count = Number(payload.game_count || 1)
    const created = Array.from({ length: count }, () => buildGeneratedGame(payload, user.id))
    writeStore(STORAGE_KEYS.games, [...games, ...created])
    return created
  }

  if (path === '/games/generate' && options.method === 'POST') {
    requireDemoUser()
    const count = Number(payload.game_count || 1)
    const created = Array.from({ length: count }, () => buildGeneratedGame(payload, 0))
    return {
      lottery_type: payload.lottery_type,
      total_generated: created.length,
      filters: payload,
      games: created.map(({ user_id, pool_id, ...rest }) => rest),
    }
  }

  if (path.startsWith('/results/latest/')) {
    const lotteryType = path.split('/').pop()
    return FALLBACK_RESULTS[lotteryType]?.[0] || { lottery_type: lotteryType, contest: 0, draw_date: null, numbers: [], estimated_prize: null, source: 'demo-local' }
  }

  if (path.startsWith('/results/history/')) {
    const lotteryType = path.split('/')[3].split('?')[0]
    return { lottery_type: lotteryType, items: FALLBACK_RESULTS[lotteryType] || [] }
  }

  if (path.startsWith('/results/cache/')) {
    const lotteryType = path.split('/').pop()
    return readStore(STORAGE_KEYS.resultsCache, []).filter((item) => item.lottery_type === lotteryType)
  }

  if (path.startsWith('/results/sync/') && options.method === 'POST') {
    const user = requireDemoUser()
    if (!user.is_admin) throw new Error('Acesso restrito ao admin')
    const lotteryType = path.split('/').pop()
    const entry = { ...(FALLBACK_RESULTS[lotteryType]?.[0] || { lottery_type: lotteryType, contest: 0, draw_date: null, numbers: [], source: 'demo-local' }) }
    const current = readStore(STORAGE_KEYS.resultsCache, []).filter((item) => !(item.lottery_type === entry.lottery_type && item.contest === entry.contest))
    writeStore(STORAGE_KEYS.resultsCache, [entry, ...current])
    return { status: 'synced', item: entry }
  }

  if (path === '/subscriptions/plans') return PLANS

  if (path === '/subscriptions/me') {
    const user = requireDemoUser()
    return readStore(STORAGE_KEYS.subscriptions, []).filter((item) => item.user_id === user.id).sort((a, b) => b.id - a.id)
  }

  if (path === '/subscriptions/checkout' && options.method === 'POST') {
    const user = requireDemoUser()
    const items = readStore(STORAGE_KEYS.subscriptions, [])
    const created = {
      id: nextId(items),
      provider: payload.provider || 'stripe',
      plan: payload.plan,
      status: 'demo',
      checkout_reference: `checkout-${Date.now()}`,
      checkout_url: 'https://checkout.demo.local',
      user_id: user.id,
    }
    writeStore(STORAGE_KEYS.subscriptions, [created, ...items])
    return {
      provider: created.provider,
      plan: created.plan,
      status: created.status,
      checkout_url: created.checkout_url,
      reference: created.checkout_reference,
    }
  }

  if (path.startsWith('/subscriptions/activate/') && options.method === 'POST') {
    const user = requireDemoUser()
    const plan = path.split('/').pop()
    const subscriptions = readStore(STORAGE_KEYS.subscriptions, [])
    const users = readStore(STORAGE_KEYS.users, [])
    const created = {
      id: nextId(subscriptions),
      provider: 'internal-demo',
      plan,
      status: 'active',
      checkout_reference: `activated-${user.id}-${plan}`,
      checkout_url: null,
      user_id: user.id,
    }
    writeStore(STORAGE_KEYS.subscriptions, [created, ...subscriptions])
    writeStore(STORAGE_KEYS.users, users.map((item) => item.id === user.id ? { ...item, plan } : item))
    return created
  }

  if (path === '/exports/history.csv') {
    const user = requireDemoUser()
    const games = readStore(STORAGE_KEYS.games, []).filter((item) => item.user_id === user.id)
    return new Blob([toCsv(games)], { type: 'text/csv' })
  }

  if (path.startsWith('/exports/game/')) {
    const user = requireDemoUser()
    const id = Number(path.split('/')[3].split('.')[0])
    const game = readStore(STORAGE_KEYS.games, []).find((item) => item.id === id && item.user_id === user.id)
    if (!game) throw new Error('Jogo nao encontrado')
    return createPdfLikeBlob(game)
  }

  if (path === '/pools') {
    const user = requireDemoUser()
    return readStore(STORAGE_KEYS.pools, []).filter((item) => item.owner_id === user.id).map((pool) => ({
      id: pool.id,
      name: pool.name,
      lottery_type: pool.lottery_type,
      members_count: pool.members.length,
      games_count: pool.games.length,
    }))
  }

  if (path === '/pools' && options.method === 'POST') {
    const user = requireDemoUser()
    const pools = readStore(STORAGE_KEYS.pools, [])
    const created = {
      id: nextId(pools),
      name: payload.name,
      lottery_type: payload.lottery_type,
      description: payload.description || '',
      quota_value: payload.quota_value || 0,
      owner_id: user.id,
      members: [{ id: 1, email: user.email, role: 'owner', quota_count: 1 }],
      games: [],
    }
    writeStore(STORAGE_KEYS.pools, [created, ...pools])
    return created
  }

  if (/^\/pools\/\d+$/.test(path)) {
    requireDemoUser()
    const id = Number(path.split('/')[2])
    const pool = readStore(STORAGE_KEYS.pools, []).find((item) => item.id === id)
    if (!pool) throw new Error('Bolao nao encontrado')
    return pool
  }

  if (/^\/pools\/\d+\/members$/.test(path) && options.method === 'POST') {
    requireDemoUser()
    const id = Number(path.split('/')[2])
    const pools = readStore(STORAGE_KEYS.pools, [])
    const pool = pools.find((item) => item.id === id)
    if (!pool) throw new Error('Bolao nao encontrado')
    pool.members.push({
      id: nextId(pool.members),
      email: payload.email,
      role: 'member',
      quota_count: payload.quota_count || 1,
    })
    writeStore(STORAGE_KEYS.pools, pools)
    return { status: 'ok' }
  }

  if (/^\/pools\/\d+\/generate-games$/.test(path) && options.method === 'POST') {
    const user = requireDemoUser()
    const id = Number(path.split('/')[2])
    const pools = readStore(STORAGE_KEYS.pools, [])
    const games = readStore(STORAGE_KEYS.games, [])
    const pool = pools.find((item) => item.id === id)
    if (!pool) throw new Error('Bolao nao encontrado')
    const created = Array.from({ length: Number(payload.game_count || 1) }, () => buildGeneratedGame(payload, user.id, pool.id))
    pool.games.push(...created)
    writeStore(STORAGE_KEYS.games, [...games, ...created])
    writeStore(STORAGE_KEYS.pools, pools)
    return { status: 'ok' }
  }

  if (path === '/admin/metrics') {
    const user = requireDemoUser()
    if (!user.is_admin) throw new Error('Acesso restrito ao admin')
    const users = readStore(STORAGE_KEYS.users, [])
    const subscriptions = readStore(STORAGE_KEYS.subscriptions, [])
    const games = readStore(STORAGE_KEYS.games, [])
    const pools = readStore(STORAGE_KEYS.pools, [])
    const planBreakdown = users.reduce((acc, item) => {
      acc[item.plan] = (acc[item.plan] || 0) + 1
      return acc
    }, {})
    return {
      total_users: users.length,
      active_subscriptions: subscriptions.filter((item) => item.status === 'active').length,
      total_games: games.length,
      total_pools: pools.length,
      plan_breakdown: planBreakdown,
    }
  }

  throw new Error(`Rota demo nao implementada: ${path}`)
}

async function request(path, options = {}) {
  if (DEMO_MODE) return mockRequest(path, options)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: getHeaders(options.headers || {}),
    })

    if (!res.ok) {
      let detail = 'Erro na requisicao'
      try {
        const data = await res.json()
        detail = data.detail || JSON.stringify(data)
      } catch (_) {}
      throw new Error(detail)
    }

    const type = res.headers.get('content-type') || ''
    if (type.includes('application/pdf') || type.includes('text/csv')) return res.blob()
    return res.json()
  } catch (_) {
    return mockRequest(path, options)
  }
}

export const api = {
  mode: DEMO_MODE ? 'demo' : 'remote',
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payloadOrEmail, password) => {
    const payload = typeof payloadOrEmail === 'object' ? payloadOrEmail : { email: payloadOrEmail, password }
    return request('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
  },
  me: () => request('/auth/me'),
  generateAndSave: (payload) => request('/games/generate-and-save', { method: 'POST', body: JSON.stringify(payload) }),
  generate: (payload) => request('/games/generate', { method: 'POST', body: JSON.stringify(payload) }),
  history: () => request('/games/history'),
  latestResult: (lotteryType) => request(`/results/latest/${lotteryType}`),
  resultsHistory: (lotteryType, limit = 5) => request(`/results/history/${lotteryType}?limit=${limit}`),
  cachedResults: (lotteryType) => request(`/results/cache/${lotteryType}`),
  syncResults: (lotteryType) => request(`/results/sync/${lotteryType}`, { method: 'POST' }),
  plans: () => request('/subscriptions/plans'),
  checkout: (payload) => request('/subscriptions/checkout', { method: 'POST', body: JSON.stringify(payload) }),
  activatePlan: (plan) => request(`/subscriptions/activate/${plan}`, { method: 'POST' }),
  mySubscriptions: () => request('/subscriptions/me'),
  exportCsv: () => request('/exports/history.csv', { headers: {} }),
  exportPdf: (id) => request(`/exports/game/${id}.pdf`, { headers: {} }),
  pools: () => request('/pools'),
  createPool: (payload) => request('/pools', { method: 'POST', body: JSON.stringify(payload) }),
  poolDetail: (id) => request(`/pools/${id}`),
  addPoolMember: (id, payload) => request(`/pools/${id}/members`, { method: 'POST', body: JSON.stringify(payload) }),
  generatePoolGames: (id, payload) => request(`/pools/${id}/generate-games`, { method: 'POST', body: JSON.stringify(payload) }),
  adminMetrics: () => request('/admin/metrics'),
}

export default api
