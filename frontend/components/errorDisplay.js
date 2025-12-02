export default function ErrorDisplay({ error, onRetry }) {
    return (
      <main className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-red-600">Analytics Error</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
          <p className="font-semibold mb-2">Error:</p>
          <p>{error}</p>
          <button 
            onClick={onRetry}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }
  