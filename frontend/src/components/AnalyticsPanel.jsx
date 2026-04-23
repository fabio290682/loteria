import Chart from './Chart'

export default function AnalyticsPanel({ data, lottery }) {
  return (
    <div className="analytics-grid">
      {/* Hot Numbers Chart */}
      <div className="analytics-card">
        <h3>Dezenas Quentes</h3>
        <div className="chart-container">
          <Chart
            type="bar"
            data={{
              labels: data.dezenas_quentes.map(d => d.dezena),
              datasets: [{
                label: 'Frequência',
                data: data.dezenas_quentes.map(d => d.freq),
                backgroundColor: '#ff6b6b',
              }],
            }}
          />
        </div>
      </div>

      {/* Delayed Numbers Chart */}
      <div className="analytics-card">
        <h3>Dezenas Atrasadas</h3>
        <div className="chart-container">
          <Chart
            type="bar"
            data={{
              labels: data.dezenas_atrasadas.map(d => d.dezena),
              datasets: [{
                label: 'Atraso (concursos)',
                data: data.dezenas_atrasadas.map(d => d.atraso),
                backgroundColor: '#4ecdc4',
              }],
            }}
          />
        </div>
      </div>

      {/* Performance Table */}
      <div className="analytics-card full-width">
        <h3>Desempenho de Estratégias</h3>
        <div className="performance-table">
          <table>
            <thead>
              <tr>
                <th>Concurso</th>
                <th>Acertos</th>
                <th>Estratégia</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {data.concursos.map((c, idx) => (
                <tr key={idx}>
                  <td>{c.concurso}</td>
                  <td>
                    <span className={`badge badge-${c.acertos}`}>
                      {c.acertos}
                    </span>
                  </td>
                  <td>{c.estrategia}</td>
                  <td>{c.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="analytics-card full-width">
        <h3>Resumo da Análise</h3>
        <div className="summary-grid">
          {data.resumo.map((item, idx) => (
            <div key={idx} className="summary-item">
              <p className="summary-title">{item.titulo}</p>
              <p className="summary-value">{item.valor}</p>
              <p className="summary-detail">{item.detalhe}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
