import { useMemo, useState } from 'react'
import tecLogo from '../assets/tec.png'
import { FREQ_DATA, calcScore } from '../data/freqLoterias'

const LOTERIAS = {
  megasena: { nome: 'Mega-Sena', total: 60, picks: 6, cor: 'amber', concursos: 2891 },
  lotofacil: { nome: 'Lotofacil', total: 25, picks: 15, cor: 'lime', concursos: 3121 },
  quina: { nome: 'Quina', total: 80, picks: 5, cor: 'sky', concursos: 6347 },
}

// Converte score 0-1 em classe de calor
function heatClass(score) {
  if (score >= 0.85) return 'heat-5'
  if (score >= 0.70) return 'heat-4'
  if (score >= 0.55) return 'heat-3'
  if (score >= 0.38) return 'heat-2'
  if (score >= 0.22) return 'heat-1'
  return 'heat-0'
}

function heatLabel(score) {
  if (score >= 0.85) return 'Muito quente'
  if (score >= 0.70) return 'Quente'
  if (score >= 0.55) return 'Morno'
  if (score >= 0.38) return 'Frio'
  if (score >= 0.22) return 'Muito frio'
  return 'Glacial'
}

function MiniBar({ value }) {
  return (
    <div className="mini-bar-track">
      <div className="mini-bar-fill" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  )
}

function NumeroCell({ dado, onClick, selected }) {
  const cls = heatClass(dado.score)
  return (
    <button
      className={`heat-cell ${cls} ${selected ? 'heat-selected' : ''}`}
      onClick={() => onClick(dado)}
      title={`${String(dado.num).padStart(2, '0')} — ${dado.freq} aparicoes — atraso: ${dado.atraso} concursos`}
    >
      {String(dado.num).padStart(2, '0')}
    </button>
  )
}

function DetalhePanel({ dado, loteria }) {
  if (!dado) {
    return (
      <div className="heat-detalhe-empty">
        <p className="muted">Clique em um numero para ver os detalhes</p>
      </div>
    )
  }
  const lot = LOTERIAS[loteria]
  const total = FREQ_DATA[loteria]
  const rank = [...total].sort((a, b) => b.freq - a.freq).findIndex((d) => d.num === dado.num) + 1
  return (
    <div className="heat-detalhe">
      <div className={`heat-detalhe-num ${heatClass(dado.score)}`}>
        {String(dado.num).padStart(2, '0')}
      </div>
      <h3>Dezena {String(dado.num).padStart(2, '0')}</h3>
      <p className={`heat-label-badge ${heatClass(dado.score)}`}>{heatLabel(dado.score)}</p>
      <div className="heat-detalhe-stats">
        <div>
          <span>Aparicoes totais</span>
          <strong>{dado.freq.toLocaleString('pt-BR')}</strong>
        </div>
        <div>
          <span>Ranking de frequencia</span>
          <strong>#{rank} de {lot.total}</strong>
        </div>
        <div>
          <span>Atraso atual</span>
          <strong>{dado.atraso} concursos</strong>
        </div>
        <div>
          <span>Score de calor</span>
          <strong>{Math.round(dado.score * 100)}%</strong>
        </div>
      </div>
      <div className="heat-detalhe-bar">
        <span className="muted">Calor</span>
        <MiniBar value={dado.score} />
      </div>
    </div>
  )
}

export default function NumerosQuentes() {
  const [loteria, setLoteria] = useState('megasena')
  const [selecionado, setSelecionado] = useState(null)
  const [mostrarTop, setMostrarTop] = useState(false)

  const lot = LOTERIAS[loteria]

  const dados = useMemo(() => {
    const raw = FREQ_DATA[loteria]
    return raw.map((d) => ({ ...d, score: calcScore(d, raw) }))
  }, [loteria])

  const dadosPorNum = useMemo(() => {
    const map = {}
    dados.forEach((d) => { map[d.num] = d })
    return map
  }, [dados])

  const topDezenas = useMemo(
    () => [...dados].sort((a, b) => b.score - a.score).slice(0, lot.picks),
    [dados, lot.picks],
  )

  const topNums = new Set(topDezenas.map((d) => d.num))

  const handleLoteria = (key) => {
    setLoteria(key)
    setSelecionado(null)
  }

  return (
    <section className="heat-section card">
      <div className="section-header">
        <div className="brand-inline-lockup">
          <img src={tecLogo} alt="3brasil Tech" className="brand-inline-logo" />
          <div>
            <div className="brand-inline-tagline">
              <span className="brand-inline-name">3brasil Tech</span>
              <span className="brand-inline-product">LotoMetrics</span>
            </div>
            <h2>Numeros Quentes</h2>
            <p className="muted section-copy">
              Mapa de calor de todos os numeros com score baseado em frequencia historica e atraso.
              Numeros vermelhos tem maior probabilidade estatistica de sair nos proximos concursos.
            </p>
          </div>
        </div>
        <button
          className={`secondary-button heat-top-toggle ${mostrarTop ? 'active' : ''}`}
          onClick={() => setMostrarTop(!mostrarTop)}
        >
          {mostrarTop ? 'Ver mapa completo' : `Ver top ${lot.picks} picks`}
        </button>
      </div>

      <div className="heat-tabs">
        {Object.entries(LOTERIAS).map(([key, l]) => (
          <button
            key={key}
            className={`prob-tab ${l.cor} ${loteria === key ? 'active' : ''}`}
            onClick={() => handleLoteria(key)}
          >
            {l.nome}
          </button>
        ))}
        <span className="muted heat-meta">{lot.concursos.toLocaleString('pt-BR')} concursos analisados</span>
      </div>

      <div className="heat-layout">
        <div className="heat-main">
          {mostrarTop ? (
            <div className="heat-top-list">
              <p className="eyebrow">Top {lot.picks} dezenas recomendadas</p>
              {topDezenas.map((d, i) => (
                <div
                  key={d.num}
                  className={`heat-rank-item ${heatClass(d.score)}`}
                  onClick={() => setSelecionado(d)}
                >
                  <span className="heat-rank-pos">#{i + 1}</span>
                  <span className={`heat-rank-ball ${heatClass(d.score)}`}>
                    {String(d.num).padStart(2, '0')}
                  </span>
                  <div className="heat-rank-info">
                    <span>{d.freq} aparicoes — atraso: {d.atraso}x</span>
                    <MiniBar value={d.score} />
                  </div>
                  <span className="heat-rank-score">{Math.round(d.score * 100)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="heat-grid" style={{ '--cols': Math.ceil(Math.sqrt(lot.total * 1.6)) }}>
                {Array.from({ length: lot.total }, (_, i) => i + 1).map((num) => {
                  const dado = dadosPorNum[num]
                  return dado ? (
                    <NumeroCell
                      key={num}
                      dado={dado}
                      onClick={setSelecionado}
                      selected={selecionado?.num === num}
                    />
                  ) : null
                })}
              </div>

              <div className="heat-legend">
                {['Glacial', 'Muito frio', 'Frio', 'Morno', 'Quente', 'Muito quente'].map((label, i) => (
                  <div key={label} className="heat-legend-item">
                    <span className={`heat-legend-dot heat-${i}`} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="heat-side">
          <DetalhePanel dado={selecionado} loteria={loteria} />

          <div className="heat-recomendados">
            <p className="eyebrow">Sugestao de jogo</p>
            <p className="muted" style={{ fontSize: '0.82rem', marginBottom: 10 }}>
              Top {lot.picks} numeros pelo score de calor
            </p>
            <div className="heat-picks">
              {topDezenas.map((d) => (
                <span
                  key={d.num}
                  className={`heat-pick-ball ${heatClass(d.score)} ${topNums.has(d.num) ? '' : ''}`}
                  onClick={() => setSelecionado(d)}
                >
                  {String(d.num).padStart(2, '0')}
                </span>
              ))}
            </div>
          </div>

          <div className="heat-dist">
            <p className="eyebrow">Distribuicao de calor</p>
            {[
              { label: 'Muito quente / Quente', min: 0.70, cor: 'heat-4' },
              { label: 'Morno', min: 0.55, max: 0.70, cor: 'heat-3' },
              { label: 'Frio / Glacial', max: 0.55, cor: 'heat-1' },
            ].map(({ label, min = 0, max = 1, cor }) => {
              const count = dados.filter((d) => d.score >= min && d.score < max).length
              return (
                <div key={label} className="heat-dist-row">
                  <span className={`heat-dist-dot ${cor}`} />
                  <span className="heat-dist-label">{label}</span>
                  <strong>{count}</strong>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
