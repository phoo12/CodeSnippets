export default function ScoreChart({ history }) {
    const chartData = history.slice().reverse().map((h) => ({
      name: new Date(h.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: h.total_score_achieved,
      possible: h.total_score_possible,
      section: h.section_name,
      fullDate: new Date(h.submitted_at).toLocaleString()
    }));
  
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxScore = Math.max(...chartData.map(d => d.score), 10);
    const xStep = chartWidth / (chartData.length - 1 || 1);
  
    const linePath = chartData.map((d, i) => {
      const x = padding.left + (i * xStep);
      const y = padding.top + chartHeight - (d.score / maxScore * chartHeight);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  
    return (
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-center">Score Progression Over Time</h2>
        <div className="overflow-x-auto">
          <svg width={width} height={height} className="mx-auto">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => {
              const y = padding.top + (chartHeight / 4) * i;
              return (
                <g key={i}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} 
                        stroke="#e5e7eb" strokeDasharray="3,3" />
                  <text x={padding.left - 10} y={y + 5} textAnchor="end" fontSize="12" fill="#6b7280">
                    {Math.round(maxScore * (4 - i) / 4)}
                  </text>
                </g>
              );
            })}
            
            {/* X-axis labels */}
            {chartData.map((d, i) => (
              <text key={i} x={padding.left + (i * xStep)} y={height - padding.bottom + 20} 
                    textAnchor="middle" fontSize="12" fill="#6b7280">
                {d.name}
              </text>
            ))}
            
            {/* Line */}
            <path d={linePath} fill="none" stroke="#4bc0c0" strokeWidth="3" />
            
            {/* Data points */}
            {chartData.map((d, i) => {
              const x = padding.left + (i * xStep);
              const y = padding.top + chartHeight - (d.score / maxScore * chartHeight);
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="6" fill="#4bc0c0" stroke="white" strokeWidth="2" />
                  <title>{`${d.fullDate}\n${d.section}\nScore: ${d.score}/${d.possible}`}</title>
                </g>
              );
            })}
            
            {/* Axis labels */}
            <text x={width / 2} y={height - 5} textAnchor="middle" fontSize="14" 
                  fill="#374151" fontWeight="600">
              Test Date
            </text>
            <text x={15} y={height / 2} textAnchor="middle" fontSize="14" 
                  fill="#374151" fontWeight="600" transform={`rotate(-90, 15, ${height / 2})`}>
              Score Achieved
            </text>
          </svg>
        </div>
      </div>
    );
  }
  