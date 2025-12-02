export default function HistoryTable({ history }) {
    return (
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
                        percentage >= 80 ? 'text-green-600' 
                        : percentage >= 60 ? 'text-yellow-600'
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
    );
  }
  