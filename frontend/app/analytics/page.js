"use client";

import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export default function AnalyticsPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      console.log("Token found:", !!token);
      
      if (!token) {
        throw new Error("Please log in to view analytics.");
      }

      console.log("Fetching from:", `${API_URL}/api/test-history`);

      const response = await fetch(`${API_URL}/api/test-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        let errorDetail;
        try {
          errorDetail = await response.json();
          console.error("Error detail:", errorDetail);
        } catch {
          errorDetail = { detail: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorDetail.detail || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw API response:", JSON.stringify(data, null, 2));
      console.log("Data type:", typeof data);
      console.log("Has history property:", 'history' in data);
      console.log("History is array:", Array.isArray(data?.history));

      if (data && Array.isArray(data.history)) {
        console.log("History items found:", data.history.length);
        console.log("First item:", data.history[0]);
        setHistory(data.history);
      } else {
        console.error("Invalid response format");
        console.error("Expected: { history: [...] }");
        console.error("Received:", data);
        throw new Error(`Invalid API response format. Received: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      console.error("Error stack:", err.stack);
      setError(err.message || "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="p-6 text-center">
        <div className="mt-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600 text-lg mt-4">Loading analytics data...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-red-600">Analytics Error</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
          <p className="font-semibold mb-2">Error:</p>
          <p>{error}</p>
          <button 
            onClick={fetchAnalyticsData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  // Calculate stats
  const totalTests = history.length;
  const avgScore = totalTests > 0 
    ? history.reduce((sum, h) => sum + (h.total_score_achieved / h.total_score_possible), 0) / totalTests * 100
    : 0;
  const bestScore = totalTests > 0
    ? Math.max(...history.map(h => (h.total_score_achieved / h.total_score_possible) * 100))
    : 0;

  // Prepare data for SVG chart
  const chartData = history.slice().reverse().map((h, index) => {
    const date = new Date(h.submitted_at);
    return {
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: h.total_score_achieved,
      possible: h.total_score_possible,
      percentage: (h.total_score_achieved / h.total_score_possible) * 100,
      section: h.section_name,
      fullDate: date.toLocaleString()
    };
  });

  // SVG Chart dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const maxScore = Math.max(...chartData.map(d => d.score), 10);
  const xStep = chartWidth / (chartData.length - 1 || 1);
  
  // Generate path for line
  const linePath = chartData.map((d, i) => {
    const x = padding.left + (i * xStep);
    const y = padding.top + chartHeight - (d.score / maxScore * chartHeight);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 border-b pb-2">Test Progress Analytics</h1>
      
      {/* Stats Cards */}
      {totalTests > 0 && (
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
      )}
      
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-5xl mx-auto">
        {history.length > 0 ? (
          <>
            {/* SVG Chart */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-center">Score Progression Over Time</h2>
              <div className="overflow-x-auto">
                <svg width={width} height={height} className="mx-auto">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map(i => {
                    const y = padding.top + (chartHeight / 4) * i;
                    return (
                      <g key={i}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={width - padding.right}
                          y2={y}
                          stroke="#e5e7eb"
                          strokeDasharray="3,3"
                        />
                        <text
                          x={padding.left - 10}
                          y={y + 5}
                          textAnchor="end"
                          fontSize="12"
                          fill="#6b7280"
                        >
                          {Math.round(maxScore * (4 - i) / 4)}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* X-axis labels */}
                  {chartData.map((d, i) => {
                    const x = padding.left + (i * xStep);
                    return (
                      <text
                        key={i}
                        x={x}
                        y={height - padding.bottom + 20}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#6b7280"
                      >
                        {d.name}
                      </text>
                    );
                  })}
                  
                  {/* Line path */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#4bc0c0"
                    strokeWidth="3"
                  />
                  
                  {/* Data points */}
                  {chartData.map((d, i) => {
                    const x = padding.left + (i * xStep);
                    const y = padding.top + chartHeight - (d.score / maxScore * chartHeight);
                    return (
                      <g key={i}>
                        <circle
                          cx={x}
                          cy={y}
                          r="6"
                          fill="#4bc0c0"
                          stroke="white"
                          strokeWidth="2"
                        />
                        <title>{`${d.fullDate}\n${d.section}\nScore: ${d.score}/${d.possible}`}</title>
                      </g>
                    );
                  })}
                  
                  {/* Axis labels */}
                  <text
                    x={width / 2}
                    y={height - 5}
                    textAnchor="middle"
                    fontSize="14"
                    fill="#374151"
                    fontWeight="600"
                  >
                    Test Date
                  </text>
                  <text
                    x={15}
                    y={height / 2}
                    textAnchor="middle"
                    fontSize="14"
                    fill="#374151"
                    fontWeight="600"
                    transform={`rotate(-90, 15, ${height / 2})`}
                  >
                    Score Achieved
                  </text>
                </svg>
              </div>
            </div>
            
            {/* Test History Table */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Recent Test History</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Section</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {history.map((item, idx) => {
                      const percentage = (item.total_score_achieved / item.total_score_possible) * 100;
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(item.submitted_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.section_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.total_score_achieved} / {item.total_score_possible}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-semibold ${
                              percentage >= 80 
                                ? 'text-green-600' 
                                : percentage >= 60
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No test history</h3>
            <p className="mt-1 text-gray-500">
              Complete a test to start tracking your progress.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}