"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import EditModal from "./EditModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SnippetCard({ snippet }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper function for authenticated requests
  const authenticatedFetch = async (url, options = {}) => {
    const token = localStorage.getItem("token");

    if (
      !token &&
      (options.method === "PUT" ||
        options.method === "DELETE" ||
        options.method === "POST")
    ) {
      throw new Error("Please login to perform this action");
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });
  };

  //  Update ပြီးနောက် List ကို Refresh လုပ်ရန် Function
  const handleUpdateComplete = () => {
    router.refresh();
  };

  //  အဖြေစစ်ဆေးခြင်း Function (POST)
  const handleCheckAnswer = async (e) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/submit-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: snippet.id,
          answer: userAnswer.trim(),
        }),
      });

      const result = await response.json();

      if (result.status === "success") {
        setFeedback({ status: "success", message: result.message });
      } else {
        setFeedback({ status: "error", message: result.message });
      }
    } catch (error) {
      setFeedback({ status: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  //  Snippet ကို ဖျက်ခြင်း Function (DELETE)
  const handleDeleteSnippet = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      setFeedback({
        status: "error",
        message: "Please login to delete snippets",
      });
      return;
    }

    if (!window.confirm("Are you sure you want to delete this snippet?")) {
      return;
    }

    setFeedback(null);
    setLoading(true);

    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/snippets/${snippet.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setFeedback({
          status: "success",
          message: "Snippet deleted successfully! Updating list...",
        });
        handleUpdateComplete();
      } else {
        const error = await response.json();
        throw new Error(error.detail || "Failed to delete");
      }
    } catch (error) {
      setFeedback({ status: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Click with Auth Check
  const handleEditClick = () => {
    if (!isAuthenticated) {
      setFeedback({
        status: "error",
        message: "Please login to edit snippets",
      });
      return;
    }
    setIsEditing(true);
    setFeedback(null);
  };

  return (
    <>
      <div className="bg-white shadow-lg rounded-lg p-5 mb-6 border border-gray-200">
        {/* HEADER & CONTROLS */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">
            #{snippet.id} - {snippet.language}
          </h2>

          {/* EDIT & DELETE BUTTONS - Only show if authenticated */}
          {isAuthenticated && (
            <div className="space-x-2">
              <button
                onClick={handleEditClick}
                className="text-sm px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteSnippet}
                disabled={loading}
                className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:bg-gray-400"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>

        {/* CODE SNIPPET */}
        <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto text-sm">
          <code>{snippet.snippet}</code>
        </pre>

        <p className="mt-4 font-medium text-gray-800">
          **Question:** {snippet.question}
        </p>

        {/* ANSWER CHECK FORM */}
        <form
          onSubmit={handleCheckAnswer}
          className="mt-4 flex flex-col space-y-3"
        >
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Enter your answer"
            required
            className="border border-gray-300 p-2 rounded-md focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-green-500 text-white py-2 rounded hover:bg-green-600 transition disabled:bg-gray-400"
          >
            {loading ? "Checking..." : "Check Answer"}
          </button>
        </form>

        {/* FEEDBACK DISPLAY */}
        {feedback && (
          <div
            className={`mt-4 p-3 rounded-md font-semibold ${
              feedback.status === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>

      {/* MODAL RENDERING */}
      {isEditing && (
        <EditModal
          snippet={snippet}
          onClose={() => setIsEditing(false)}
          onUpdate={handleUpdateComplete}
        />
      )}
    </>
  );
}
