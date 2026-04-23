export default function Chart({ type, data }) {
  // Simple chart implementation using canvas or SVG
  // For production, integrate with Chart.js or Recharts

  if (type === 'bar') {
    const maxValue = Math.max(...data.datasets[0].data)
    const barWidth = 100 / data.labels.length

    return (
      <div className="simple-chart bar-chart">
        <div className="chart-bars">
          {data.labels.map((label, idx) => (
            <div key={idx} className="bar-group">
              <div
                className="bar"
                style={{
                  height: `${(data.datasets[0].data[idx] / maxValue) * 100}%`,
                  backgroundColor: data.datasets[0].backgroundColor,
                  width: barWidth + '%',
                }}
                title={`${label}: ${data.datasets[0].data[idx]}`}
              />
              <span className="bar-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'line') {
    return (
      <div className="simple-chart line-chart">
        <p className="chart-placeholder">Gráfico de linha</p>
      </div>
    )
  }

  return <div className="chart-placeholder">Tipo de gráfico não suportado</div>
}
