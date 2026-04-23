import { useState } from 'react'
import api from '../services/api'

export default function AuthBox({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [message, setMessage] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      if (mode === 'register') {
        await api.register(form)
        setMessage('Cadastro realizado. Agora faça login.')
        setMode('login')
        return
      }
      const data = await api.login(form.email, form.password)
      localStorage.setItem('token', data.access_token)
      onAuth()
    } catch (error) {
      setMessage(error.message || 'Erro ao autenticar')
    }
  }

  return (
    <div className="card auth-box">
      <h2>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
      <form onSubmit={handleSubmit} className="stack">
        {mode === 'register' && (
          <input name="name" placeholder="Seu nome" value={form.name} onChange={handleChange} required />
        )}
        <input name="email" type="email" placeholder="Seu e-mail" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Sua senha" value={form.password} onChange={handleChange} required />
        <button type="submit">{mode === 'login' ? 'Entrar' : 'Cadastrar'}</button>
      </form>
      <p className="small">{message}</p>
      <button type="button" className="link-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}
      </button>
    </div>
  )
}
