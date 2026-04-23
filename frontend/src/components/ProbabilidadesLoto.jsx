import { useState } from 'react'
import tecLogo from '../assets/tec.png'

function comb(n, k) {
  if (k > n || k < 0) return 0
  if (k === 0 || k === n) return 1
  k = Math.min(k, n - k)
  let result = 1
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1)
  }
  return Math.round(result)
}

const LOTERIAS = {
  megasena: {
    nome: 'Mega-Sena',
    total: 60,
    picks: 6,
    cor: 'amber',
    premios: [
      { nome: 'Sena', acertos: 6, premio_min: 'R$ 3.000.000', tipo: 'top' },
      { nome: 'Quina', acertos: 5, premio_min: 'R$ 20.000', tipo: 'mid' },
      { nome: 'Quadra', acertos: 4, premio_min: 'R$ 700', tipo: 'low' },
    ],
  },
  lotofacil: {
    nome: 'Lotofacil',
    total: 25,
    picks: 15,
    cor: 'lime',
    premios: [
      { nome: '15 acertos', acertos: 15, premio_min: 'R$ 1.500.000', tipo: 'top' },
      { nome: '14 acertos', acertos: 14, premio_min: 'R$ 2.000', tipo: 'mid' },
      { nome: '13 acertos', acertos: 13, premio_min: 'R$ 25', tipo: 'low' },
      { nome: '12 acertos', acertos: 12, premio_min: 'R$ 12', tipo: 'low' },
      { nome: '11 acertos', acertos: 11, premio_min: 'R$ 6', tipo: 'low' },
    ],
  },
  quina: {
    nome: 'Quina',
    total: 80,
    picks: 5,
    cor: 'sky',
    premios: [
      { nome: 'Quina', acertos: 5, premio_min: 'R$ 1.000.000', tipo: 'top' },
      { nome: 'Quadra', acertos: 4, premio_min: 'R$ 2.000', tipo: 'mid' },
      { nome: 'Terno', acertos: 3, premio_min: 'R$ 5', tipo: 'low' },
      { nome: 'Duque', acertos: 2, premio_min: 'R$ 2', tipo: 'low' },
    ],
  },
}

function calcProbabilidade(total, picks, acertos) {
  const totalAcertos = picks
  const totalNaoAcertos = total - picks
  const ganhou = acertos
  const naoGanhou = picks - acertos
  const combinacoesFavoraveis = comb(totalAcertos, ganhou) * comb(totalNaoAcertos, naoGanhou)
  const totalCombinacoes = comb(total, picks)
  return { favoraveis: combinacoesFavoraveis, total: totalCombinacoes }
}

function formatOdds(favoraveis, total) {
  if (favoraveis === 0) return '0'
  const ratio = Math.round(total / favoraveis)
  return `1 em ${ratio.toLocaleString('pt-BR')}`
}

function formatPercent(favoraveis, total) {
  if (favoraveis === 0) return '0%'
  const pct = (favoraveis / total) * 100
  if (pct < 0.0001) return `${(pct * 1e6).toFixed(2)} por milhao`
  if (pct < 0.01) return `${(pct * 1000).toFixed(2)} por mil`
  return `${pct.toFixed(2)}%`
}

function OddsBar({ favoraveis, total }) {
  const logMax = Math.log10(total)
  const logFav = Math.log10(Math.max(favoraveis, 1))
  const width = Math.max(2, Math.min(100, (logFav / logMax) * 100))
  return (
    <div className="odds-bar-track">
      <div className="odds-bar-fill" style={{ width: `${width}%` }} />
    </div>
  )
}

function LoteriaSeletor({ atual, onChange }) {
  return (
    <div className="prob-tabs">
      {Object.entries(LOTERIAS).map(([key, lot]) => (
        <button
          key={key}
          className={`prob-tab ${lot.cor} ${atual === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
        >
          {lot.nome}
        </button>
      ))}
    </div>
  )
}

function TabelaProbabilidades({ loteria }) {
  const lot = LOTERIAS[loteria]
  const totalCombinacoes = comb(lot.total, lot.picks)

  return (
    <div className="prob-table-wrap">
      <table className="prob-table">
        <thead>
          <tr>
            <th>Faixa</th>
            <th>Acertos</th>
            <th>Combinacoes</th>
            <th>Probabilidade</th>
            <th>1 em...</th>
            <th className="prob-col-bar">Chance relativa</th>
          </tr>
        </thead>
        <tbody>
          {lot.premios.map((premio) => {
            const { favoraveis } = calcProbabilidade(lot.total, lot.picks, premio.acertos)
            return (
              <tr key={premio.nome} className={`prob-row ${premio.tipo}`}>
                <td>
                  <span className="prob-nome">{premio.nome}</span>
                  <small className="prob-premio-min">{premio.premio_min}</small>
                </td>
                <td>
                  <span className="prob-acertos">{premio.acertos}/{lot.picks}</span>
                </td>
                <td className="prob-num">{favoraveis.toLocaleString('pt-BR')}</td>
                <td className="prob-num">{formatPercent(favoraveis, totalCombinacoes)}</td>
                <td className="prob-odds">{formatOdds(favoraveis, totalCombinacoes)}</td>
                <td>
                  <OddsBar favoraveis={favoraveis} total={totalCombinacoes} />
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="2" className="prob-foot-label">Total de combinacoes possiveis</td>
            <td colSpan="4" className="prob-foot-total">
              {totalCombinacoes.toLocaleString('pt-BR')}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function ComparativoCard({ loteria }) {
  const lot = LOTERIAS[loteria]
  const totalCombinacoes = comb(lot.total, lot.picks)
  const premioTop = lot.premios[0]
  const { favoraveis: favTop } = calcProbabilidade(lot.total, lot.picks, premioTop.acertos)
  const { favoraveis: favSegundo } = lot.premios[1]
    ? calcProbabilidade(lot.total, lot.picks, lot.premios[1].acertos)
    : { favoraveis: 0 }

  return (
    <div className={`prob-resumo-card ${lot.cor}`}>
      <p className="eyebrow">{lot.nome}</p>
      <div className="prob-resumo-stats">
        <div>
          <span>Premio principal</span>
          <strong>{formatOdds(favTop, totalCombinacoes)}</strong>
        </div>
        {lot.premios[1] && (
          <div>
            <span>2a faixa</span>
            <strong>{formatOdds(favSegundo, totalCombinacoes)}</strong>
          </div>
        )}
        <div>
          <span>Dezenas totais</span>
          <strong>{lot.total}</strong>
        </div>
        <div>
          <span>Marcacoes</span>
          <strong>{lot.picks}</strong>
        </div>
      </div>
    </div>
  )
}

export default function ProbabilidadesLoto() {
  const [loteriaSelecionada, setLoteriaSelecionada] = useState('megasena')

  return (
    <section className="analysis-showcase card prob-section">
      <div className="section-header">
        <div className="brand-inline-lockup">
          <img src={tecLogo} alt="3brasil Tech" className="brand-inline-logo" />
          <div>
            <div className="brand-inline-tagline">
              <span className="brand-inline-name">3brasil Tech</span>
              <span className="brand-inline-product">LotoMetrics</span>
            </div>
            <h2>Probabilidades de Acerto</h2>
            <p className="muted section-copy">
              Calculo combinatorial exato para cada faixa de premio. Baseado na formula C(n,k) aplicada
              ao universo completo de combinacoes possiveis de cada loteria.
            </p>
          </div>
        </div>
        <span className="eyebrow-pill">Matematica da sorte</span>
      </div>

      <div className="prob-comparativo">
        {Object.keys(LOTERIAS).map((key) => (
          <ComparativoCard key={key} loteria={key} />
        ))}
      </div>

      <LoteriaSeletor atual={loteriaSelecionada} onChange={setLoteriaSelecionada} />

      <TabelaProbabilidades loteria={loteriaSelecionada} />

      <div className="prob-nota">
        <p>
          <strong>Como interpretar:</strong> "1 em 50.063.860" significa que, jogando uma combinacao
          aleatoria, voce tem 1 chance em 50 milhoes de acertar a Sena. A barra de chance relativa
          usa escala logaritmica para visualizar as diferancas entre as faixas.
        </p>
      </div>
    </section>
  )
}
