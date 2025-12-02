"use client";

import { useState, useEffect } from "react";
import StatsCards from "@/components/statsCard";
import ScoreChart from "@/components/scoreCard";
import HistoryTable from "@/components/historyTable";
import LoadingSpinner from "@/components/loadingSpinner";
import ErrorDisplay from "@/components/errorDisplay";
import EmptyState from "@/components/emptyState";
import Link from "next/link";

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
      
      if (!token) {
        throw new Error("Please log in to view analytics.");
      }

      const response = await fetch(`${API_URL}/api/test-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        const errorDetail = await response.json().catch(() => ({}));
        throw new Error(errorDetail.detail || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data.history)) {
        setHistory(data.history);
      } else {
        throw new Error("Invalid API response format.");
      }
    } catch (err) {
      setError(err.message || "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={fetchAnalyticsData} />;

  return (
    <main className="container mx-auto p-6">
    <div className="flex justify-between items-center mb-6 border-b pb-2">
      <h1 className="text-3xl font-bold mb-6 border-b pb-2">Test Progress Analytics</h1>
      <Link 
          href="/test-history" 
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Back to TestHistory
        </Link>
      </div>
      {history.length > 0 ? (
        <>
          <StatsCards history={history} />
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-5xl mx-auto">
            <ScoreChart history={history} />
            <HistoryTable history={history} />
          </div>
        </>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-5xl mx-auto">
          <EmptyState />
        </div>
      )}
    </main>
  );
}