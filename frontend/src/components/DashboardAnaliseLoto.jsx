import dashboardAnalise from '../data/dashboardAnaliseLoto.json'
import ProbabilidadesLoto from './ProbabilidadesLoto'
import tecLogo from '../assets/tec.png'

function NumberBallsMini({ numbers }) {
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

function FreqBar({ freq, maxFreq }) {
  const width = Math.round((freq / maxFreq) * 100)
  return (
    <div className="freq-bar-track">
      <div className="freq-bar-fill" style={{ width: `${width}%` }} />
    </div>
  )
}

function ScoreBadge({ score }) {
  const valor = parseInt(score, 10)
  const cls = valor >= 80 ? 'positive' : valor >= 55 ? 'warning' : 'danger'
  return <span className={`analysis-trend ${cls}`}>{score}</span>
}

export default function DashboardAnaliseLoto({ onRefresh, onExport }) {
  const maxFreq = Math.max(...dashboardAnalise.dezenas_quentes.map((d) => d.freq))

  return (
    <div className="dashboard-analise-wrap">
      <section className="analysis-showcase card">
        <div className="section-header">
          <div className="brand-inline-lockup">
            <img src={tecLogo} alt="3brasil Tech" className="brand-inline-logo" />
            <div>
              <div className="brand-inline-tagline">
                <span className="brand-inline-name">3brasil Tech</span>
                <span className="brand-inline-product">LotoMetrics</span>
              </div>
              <h2>Dashboard de Analise Estatistica</h2>
              <p className="muted section-copy">
                Painel para leitura rapida de frequencia, atraso, tendencia, performance por
                estrategia e geracao de jogos com apoio estatistico.
              </p>
            </div>
          </div>
          <div className="analysis-toolbar">
            <button className="primary-button" onClick={onRefresh}>Atualizar analise</button>
            <button className="secondary-button" onClick={onExport}>Exportar CSV</button>
          </div>
        </div>

        <div className="analysis-summary-grid">
          {dashboardAnalise.resumo.map((item) => (
            <article key={item.titulo} className="analysis-summary-card">
              <span className="muted">{item.titulo}</span>
              <strong>{item.valor}</strong>
              <small>{item.detalhe}</small>
            </article>
          ))}
        </div>

        <div className="analysis-panels">
          <div className="analysis-panel">
            <h3>Dezenas quentes</h3>
            <div className="analysis-list">
              {dashboardAnalise.dezenas_quentes.map((item) => (
                <div key={item.dezena} className="analysis-list-item">
                  <div className="analysis-list-left">
                    <strong className="dezena-num">{item.dezena}</strong>
                    <small>{item.freq} ocorrencias</small>
                  </div>
                  <div className="analysis-list-right">
                    <FreqBar freq={item.freq} maxFreq={maxFreq} />
                    <span className="analysis-trend positive">{item.tendencia}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="analysis-panel">
            <h3>Dezenas atrasadas</h3>
            <div className="analysis-list">
              {dashboardAnalise.dezenas_atrasadas.map((item) => (
                <div key={item.dezena} className="analysis-list-item">
                  <div className="analysis-list-left">
                    <strong className="dezena-num">{item.dezena}</strong>
                    <small>ausente ha {item.atraso} concursos</small>
                  </div>
                  <div className="atraso-meter">
                    <div
                      className="atraso-fill"
                      style={{ width: `${Math.min(100, (item.atraso / 15) * 100)}%` }}
                    />
                    <span className="analysis-trend warning">{item.atraso}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="analysis-panel analysis-panel-wide">
            <h3>Desempenho por concurso</h3>
            <div className="analysis-table-wrap">
              <table className="analysis-table">
                <thead>
                  <tr>
                    <th>Concurso</th>
                    <th>Acertos</th>
                    <th>Estrategia</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardAnalise.concursos.map((item) => (
                    <tr key={item.concurso}>
                      <td>#{item.concurso}</td>
                      <td>{item.acertos}</td>
                      <td>{item.estrategia}</td>
                      <td><ScoreBadge score={item.score} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="analysis-panel analysis-panel-wide">
            <div className="row-between">
              <h3>Jogos sugeridos</h3>
              <span className="section-counter">{dashboardAnalise.jogos_sugeridos.length} combinacoes</span>
            </div>
            <div className="suggested-games-grid">
              {dashboardAnalise.jogos_sugeridos.map((jogo, index) => (
                <div key={`dashboard-jogo-${index}`} className="suggested-game-card">
                  <div className="row-between">
                    <span className="muted">Jogo {index + 1}</span>
                    <span className="analysis-trend positive">Score estimado alto</span>
                  </div>
                  <div className="suggested-game-balls">
                    {jogo.map((dezena) => (
                      <span key={dezena} className="suggested-game-ball">{dezena}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="analysis-panel analysis-panel-wide">
            <h3>Resultados monitorados</h3>
            <div className="analysis-results-grid">
              {dashboardAnalise.resultados.map((resultado, index) => (
                <div key={`resultado-${index}`} className="analysis-result-card">
                  <span className="muted">Resultado {index + 1}</span>
                  <NumberBallsMini numbers={resultado.dezenas} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ProbabilidadesLoto />
    </div>
  )
}
