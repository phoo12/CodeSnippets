"use client";

import { useState, useEffect } from "react";

// API URL ကို global environment variable မှ ယူပါ
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Props: snippet (မူရင်းဒေတာ), onClose (ပိတ်ရန် function), onUpdate (update ပြီးနောက် refresh လုပ်ရန် function)
export default function EditModal({ snippet, onClose, onUpdate }) {
  const [editData, setEditData] = useState({
    language: snippet.language,
    snippet: snippet.snippet,
    question: snippet.question,
    correct_answer: "", // Update အတွက် လျှို့ဝှက်အဖြေအသစ်ကို ထည့်ရန်
  });
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  //  Input/Textarea တန်ဖိုးများ ပြောင်းလဲခြင်းကို ကိုင်တွယ်သည်
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  //  Snippet ကို ပြင်ဆင်ခြင်း Function (PUT)
  const handleUpdateSnippet = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    if (!editData.correct_answer) {
      setFeedback({
        status: "error",
        message: "New Correct Answer is required to update snippet.",
      });
      setLoading(false);
      return;
    }

    try {
      const url = `${API_URL}/api/snippets/${snippet.id}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      const data = await response.json();

      if (response.ok) {
        setFeedback({
          status: "success",
          message: "Snippet updated successfully!",
        });

        //  Update အောင်မြင်ပါက Parent Component (page.js) ကို ချက်ချင်း Update လုပ်ဖို့ ခေါ်ပါ
        onUpdate();

        // Modal ကို ခဏပိတ်ဖို့ အချိန်ပေးပါ
        setTimeout(onClose, 1000);
      } else {
        setFeedback({
          status: "error",
          message: data.detail || "Failed to update snippet.",
        });
      }
    } catch (error) {
      setFeedback({
        status: "error",
        message: "Network error or invalid input.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Esc key ဖြင့် Modal ပိတ်ခြင်း
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    // Modal Backdrop (Background Blur အတွက်)
    <div className="fixed inset-0 bg-opacity-90 backdrop-blur flex items-center justify-center z-50">
      {/* Modal Content */}
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg mx-4 transform transition-all">
        <h3 className="text-xl font-bold mb-4 border-b pb-2 text-yellow-600">
          Editing Snippet #{snippet.id} ({snippet.language})
        </h3>

        <form onSubmit={handleUpdateSnippet} className="space-y-4">
          {/* Snippet Area - Current Snippet */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Code Snippet
            </label>
            <textarea
              name="snippet"
              value={editData.snippet}
              onChange={handleChange}
              required
              rows="6"
              className="mt-1 w-full border border-gray-300 p-2 rounded font-mono"
            />
          </div>

          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Question
            </label>
            <input
              type="text"
              name="question"
              value={editData.question}
              onChange={handleChange}
              required
              className="mt-1 w-full border border-gray-300 p-2 rounded"
            />
          </div>

          {/* New Correct Answer Input (Required) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Correct Answer (Required)
            </label>
            <input
              type="text"
              name="correct_answer"
              value={editData.correct_answer}
              onChange={handleChange}
              required
              placeholder="Enter the new correct answer"
              className="mt-1 w-full border border-gray-300 p-2 rounded"
            />
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-md font-semibold ${
                feedback.status === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
