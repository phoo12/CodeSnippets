export default function StatsCards({ history }) {
    const totalTests = history.length;
    const avgScore = totalTests > 0 
      ? history.reduce((sum, h) => sum + (h.total_score_achieved / h.total_score_possible), 0) / totalTests * 100
      : 0;
    const bestScore = totalTests > 0
      ? Math.max(...history.map(h => (h.total_score_achieved / h.total_score_possible) * 100))
      : 0;
  
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-semibold">Total Tests</p>
          <p className="text-3xl font-bold text-blue-700">{totalTests}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 font-semibold">Average Score</p>
          <p className="text-3xl font-bold text-green-700">{avgScore.toFixed(1)}%</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-600 font-semibold">Best Score</p>
          <p className="text-3xl font-bold text-purple-700">{bestScore.toFixed(1)}%</p>
        </div>
      </div>
    );
  }
  