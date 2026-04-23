export default function StatsCard({ title, value, icon, trend }) {
  const isPositive = trend >= 0
  const trendClass = isPositive ? 'positive' : 'negative'
  const trendIcon = isPositive ? '↑' : '↓'

  return (
    <div className="stats-card">
      <div className="stats-icon">{icon}</div>
      <div className="stats-content">
        <p className="stats-title">{title}</p>
        <h3 className="stats-value">{value}</h3>
        {trend !== null && (
          <p className={`stats-trend ${trendClass}`}>
            {trendIcon} {Math.abs(trend)}%
          </p>
        )}
      </div>
    </div>
  )
}
