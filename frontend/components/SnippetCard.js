"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import EditModal from "./EditModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SnippetCard({ snippet }) {
  // 1. STATE MANAGEMENT
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false); // 👈 Edit Mode ကို စီမံသည်
  const [userAnswer, setUserAnswer] = useState("");

  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper function for submission (PUT or POST)
  const submitData = async (url, method, body) => {
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "API error");
      }
      return data;
    } catch (err) {
      console.error(err);
      throw new Error("Server error or invalid input.");
    } finally {
      setLoading(false);
    }
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
      const result = await submitData(`${API_URL}/api/submit-answer`, "POST", {
        id: snippet.id,
        answer: userAnswer.trim(),
      });
      // Fix: Check the status field in the json response
      if (result.status == "success"){

        setFeedback({ status: "success", message: result.message });
      }
      else{
        // If the HTTP status was 200, but the JSON status is 'error'
        setFeedback({ status: "error", message: result.message });
      }
    } catch (error) {
      setFeedback({ status: "error", message: error.message });
    }
    setLoading(false);
  };

  //  Snippet ကို ဖျက်ခြင်း Function (DELETE)
  const handleDeleteSnippet = async () => {
    if (!window.confirm("Are you sure you want to delete this snippet?")) {
      return;
    }

    setFeedback(null);
    setLoading(true);

    try {
      const url = `${API_URL}/api/snippets/${snippet.id}`;

      // DELETE Method ကို သုံးပြီး API ကို ခေါ်ဆိုခြင်း (204 No Content ကို မျှော်လင့်သည်)
      await fetch(url, { method: "DELETE" });

      setFeedback({
        status: "success",
        message: "Snippet deleted successfully! Updating list...",
      });
      handleUpdateComplete(); // ချက်ချင်း Update လုပ်ပါ
    } catch (error) {
      setFeedback({ status: "error", message: "Failed to delete snippet." });
    } finally {
      setLoading(false);
    }
  };

  // 3. RENDER LOGIC
  return (
    <>
      <div className="bg-white shadow-lg rounded-lg p-5 mb-6 border border-gray-200">
        {/* HEADER & CONTROLS */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">
            #{snippet.id} - {snippet.language}
          </h2>

          {/* EDIT & DELETE BUTTONS */}
          <div className="space-x-2">
            <button
              onClick={() => {
                setIsEditing(true); //  Modal ကို ဖွင့်ပါ
                setFeedback(null);
              }}
              className="text-sm px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteSnippet}
              disabled={loading}
              className="text-sm  px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:bg-gray-400"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        {/* ANSWER CHECK FORM */}
        <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto text-sm">
          <code>{snippet.snippet}</code>
        </pre>
        <p className="mt-4 font-medium text-gray-800">
          **Question:** {snippet.question}
        </p>

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
            className="bg-green-500 text-white py-2 rounded"
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

      {/* 5. MODAL RENDERING */}
      {isEditing && (
        <EditModal
          snippet={snippet}
          onClose={() => setIsEditing(false)} // Modal ပိတ်ရန်
          onUpdate={handleUpdateComplete} // Update ပြီးနောက် Refresh လုပ်ရန်
        />
      )}
    </>
  );
}
