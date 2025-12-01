"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function TestHistoryPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasRecentResult, setHasRecentResult] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Check if there's a recent test result
    const recentResult = localStorage.getItem('testResult');
    setHasRecentResult(!!recentResult);
    
    fetchHistory();
  }, [isAuthenticated, loading, router]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/test-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      } else {
        setError("Failed to load test history");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto p-8 text-center">
          <p className="text-gray-600 text-lg">Loading test history...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">📚 Test History</h1>
          <div className="flex gap-3">
            {hasRecentResult && (
              <Link
                href="/test-results"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Back to Recent Result
              </Link>
            )}
            <Link
              href="/analytics"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Analytics Graph
            </Link>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">
              No test history yet. Take your first test!
            </p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-block"
            >
              Start a Test
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((test, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {test.section_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(test.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {test.total_score_achieved || test.score || 0} / {test.total_score_possible || test.total_possible || 0}
                    </p>
                    <p className="text-sm text-gray-600">
                      {test.total_score_possible > 0 
                        ? Math.round(((test.total_score_achieved || test.score || 0) / (test.total_score_possible || test.total_possible)) * 100)
                        : 0
                      }%
                    </p>
                  </div>
                </div>
                
                {test.is_best_score && (
                  <div className="mt-2">
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                      🏆 Best Score
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}