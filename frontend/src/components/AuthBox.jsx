import { useState } from 'react'
import { api } from '../services/api'

const DEMO_USERS = [
  { label: 'Entrar com demo', email: 'demo@lotometrics.app', password: '123456' },
  { label: 'Entrar como admin', email: 'owner@admin.local', password: '123456' },
]

export default function AuthBox({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [message, setMessage] = useState('')

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      if (mode === 'register') {
        await api.register(form)
        setMessage('Cadastro realizado. Agora faca login.')
        setMode('login')
        return
      }

      const data = await api.login({ email: form.email, password: form.password })
      localStorage.setItem('token', data.access_token)
      onAuth()
    } catch (error) {
      setMessage(error.message || 'Erro ao autenticar')
    }
  }

  const loginAsDemo = async (credentials) => {
    setMessage('')
    try {
      const data = await api.login(credentials)
      localStorage.setItem('token', data.access_token)
      onAuth()
    } catch (error) {
      setMessage(error.message || 'Erro ao autenticar')
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-intro card card-tinted">
        <p className="eyebrow">Experiencia pronta para teste</p>
        <h2>Entre no SaaS e navegue como se fosse producao</h2>
        <p className="auth-copy">
          Use as contas de demonstração para explorar geracao de jogos, assinatura, resultados,
          cache local e painel admin sem depender do backend publicado.
        </p>
        <div className="demo-user-list">
          {DEMO_USERS.map((item) => (
            <button key={item.email} className="demo-user" type="button" onClick={() => loginAsDemo(item)}>
              <strong>{item.label}</strong>
              <span>{item.email}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="auth-box card">
        <div className="auth-switch">
          <button
            type="button"
            className={mode === 'login' ? 'tab-button active' : 'tab-button'}
            onClick={() => setMode('login')}
          >
            Entrar
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'tab-button active' : 'tab-button'}
            onClick={() => setMode('register')}
          >
            Criar conta
          </button>
        </div>

        <h2>{mode === 'login' ? 'Acessar plataforma' : 'Criar conta demo'}</h2>
        <p className="muted auth-caption">
          {mode === 'login'
            ? 'Entre para abrir o dashboard completo.'
            : 'Crie um usuario de teste e experimente o fluxo comercial.'}
        </p>

        <form onSubmit={handleSubmit} className="stack">
          {mode === 'register' && (
            <div className="field">
              <label>Nome</label>
              <input name="name" placeholder="Seu nome" value={form.name} onChange={handleChange} required />
            </div>
          )}
          <div className="field">
            <label>E-mail</label>
            <input name="email" type="email" placeholder="voce@empresa.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Senha</label>
            <input name="password" type="password" placeholder="Sua senha" value={form.password} onChange={handleChange} required />
          </div>
          <button type="submit" className="primary-button">
            {mode === 'login' ? 'Entrar agora' : 'Cadastrar'}
          </button>
        </form>

        {message && <div className="message-inline">{message}</div>}
      </div>
    </section>
  )
}
