"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function TestResultPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);

  useEffect(() => {
    // LocalStorage ကနေ ရလဒ် load လုပ်ပါမယ်
    const saved = localStorage.getItem("testResult");
    if (!saved) {
      router.push("/"); // မရှိရင်မှန်ကန်တဲ့နေရာ redirect
      return;
    }
    setResult(JSON.parse(saved));
  }, [router]);

  if (!result) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto p-6 text-center">
          <p className="text-gray-600 text-lg">Loading test results...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="container mx-auto p-6">
        {/* Header */}
        <h1 className="text-4xl font-bold text-blue-700 mb-6">
           Test Results: {result.section_name}
        </h1>

        {/* Score Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-2xl font-semibold">
            Total Score:{" "}
            {result.total_score_achieved} / {result.total_score_possible}
          </p>

          {result.is_record_updated && (
            <p className="text-green-600 font-bold mt-2">
              🏆 New High Score Recorded!
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              localStorage.removeItem("testResult");
              router.back(); // အရှေ့က page ကို ပြန်သွားမယ်
            }}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition font-semibold"
          >
            🔄 Retry Test
          </button>

          <Link
            href="/test-history"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            📘 View Test History
          </Link>

          <Link
            href="/"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition font-semibold"
          >
             Back to Home
          </Link>
        </div>

        {/* Detailed Breakdown */}
        <h2 className="text-2xl font-bold mb-4">Detailed Breakdown</h2>

        <div className="space-y-4">
          {result.results.map((item) => {
            const snippet = result.snippets.find(
              (s) => s.id === item.snippet_id
            );

            return (
              <div
                key={item.snippet_id}
                className={`p-4 rounded-lg border shadow-sm ${
                  item.is_correct
                    ? "bg-green-50 border-green-300"
                    : "bg-red-50 border-red-300"
                }`}
              >
                {/* Question */}
                <p className="font-semibold mb-2">
                  {snippet?.question || "Question"}
                </p>

                {/* Correct or Incorrect */}
                <p
                  className={`text-sm font-bold mb-1 ${
                    item.is_correct ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {item.is_correct ? "✔ Correct" : "✘ Incorrect"} (
                  {item.user_score} Point)
                </p>

                {/* User Answer */}
                <p className="text-sm text-gray-800">
                  <span className="font-medium">Your Answer:</span>{" "}
                  {result.userAnswers[snippet.id] || "N/A"}
                </p>

                {/* Correct Answer */}
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Correct Answer:</span>{" "}
                  {item.correct_answer}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
