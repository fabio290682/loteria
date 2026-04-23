import dashboardAnalise from '../data/dashboardAnaliseLoto.json'

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

export default function DashboardAnaliseLoto({ onRefresh, onExport }) {
  return (
    <section className="analysis-showcase card">
      <div className="section-header">
        <div>
          <p className="eyebrow">LotoMetrics SaaS</p>
          <h2>Dashboard de Analise Estatistica</h2>
          <p className="muted section-copy">
            Painel para leitura rapida de frequencia, atraso, tendencia, performance por
            estrategia e geracao de jogos com apoio estatistico.
          </p>
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
                <div>
                  <strong>{item.dezena}</strong>
                  <small>{item.freq} ocorrencias</small>
                </div>
                <span className="analysis-trend positive">{item.tendencia}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analysis-panel">
          <h3>Dezenas atrasadas</h3>
          <div className="analysis-list">
            {dashboardAnalise.dezenas_atrasadas.map((item) => (
              <div key={item.dezena} className="analysis-list-item">
                <strong>{item.dezena}</strong>
                <span className="analysis-trend warning">{item.atraso} concursos</span>
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
                    <td className="analysis-trend positive">{item.score}</td>
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
  )
}
