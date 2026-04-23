const RAW_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '')

function getHeaders(extra = {}) {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function request(path, options = {}) {
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
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),
  generateAndSave: (payload) => request('/games/generate-and-save', { method: 'POST', body: JSON.stringify(payload) }),
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
