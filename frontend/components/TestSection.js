"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SnippetCard from "./SnippetCard";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function TestSection({ snippets, sectionName }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const allAnswered = snippets.length > 0 && 
                      Object.keys(answers).length === snippets.length &&
                      Object.values(answers).every(ans => ans.trim() !== "");

  const handleAnswerChange = (snippetId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [snippetId]: answer,
    }));
  };
  
  const handleSubmitTest = async () => {
    if (!isAuthenticated) {
      setFeedback({ status: "error", message: "Please log in to submit the test." });
      return;
    }
    if (!allAnswered) {
      setFeedback({ status: "error", message: "Please answer all questions before submitting." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const submissionBody = {
      section_name: sectionName,
      answers: snippets.map(snippet => ({
        snippet_id: snippet.id,
        submitted_answer: answers[snippet.id] || "",
      })),
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/submit-batch-answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(submissionBody),
      });

      const resultData = await response.json();
      
      if (response.ok) {
        // Store result in localStorage and redirect
        localStorage.setItem('testResult', JSON.stringify({
          ...resultData,
          userAnswers: answers,
          snippets: snippets
        }));
        router.push('/test-results');
      } else {
        setFeedback({ status: "error", message: resultData.detail || "Submission failed." });
      }
    } catch (err) {
      setFeedback({ status: "error", message: "Network error during submission." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Questions */}
      {snippets.map((snippet) => (
        <SnippetCard 
          key={snippet.id} 
          snippet={snippet} 
          onAnswerChange={handleAnswerChange}
        /> 
      ))}

      {/* Feedback Messages */}
      {feedback && (
        <div className={`p-4 rounded-md font-semibold ${
          feedback.status === "success" 
            ? "bg-green-100 text-green-700" 
            : "bg-red-100 text-red-700"
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Submit Button */}
      <div className="sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200">
        <button
          onClick={handleSubmitTest}
          disabled={loading || !allAnswered || !isAuthenticated}
          className={`w-full py-3 px-4 rounded-lg font-bold transition duration-300 ${
            (loading || !allAnswered || !isAuthenticated) 
              ? "bg-gray-400 cursor-not-allowed text-gray-700" 
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {loading 
            ? "Submitting..." 
            : ` Submit All Answers (${Object.keys(answers).length}/${snippets.length})`
          }
        </button>
        
        {!isAuthenticated && 
          <p className="text-red-500 mt-2 text-center text-sm">
             Please log in to submit your test
          </p>
        }
        {!allAnswered && isAuthenticated &&
          <p className="text-orange-500 mt-2 text-center text-sm">
             Answer all questions to enable submit
          </p>
        }
      </div>
    </div>
  );
}