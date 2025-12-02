export default function LoadingSpinner() {
    return (
      <main className="p-6 text-center">
        <div className="mt-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600 text-lg mt-4">Loading analytics data...</p>
        </div>
      </main>
    );
  }
  