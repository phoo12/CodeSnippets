"use client"; // Client Component

import { useState } from "react";
import { useRouter } from "next/navigation";
import EditModal from "./EditModal"; // EditModal ကို Form ထဲတွင် မသုံးသော်လည်း import လုပ်ထားသည်။

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CreateSnippetForm() {
  const router = useRouter();

  // 1. Form Data State ကို ပြန်လည်ထည့်သွင်းခြင်း
  const [formData, setFormData] = useState({
    language: "",
    snippet: "",
    question: "",
    correct_answer: "",
  });

  // 2. Loading State ကို ပြန်လည်ထည့်သွင်းခြင်း
  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState(null);

  // Note: isEditing, userAnswer, handleUpdateComplete များကို Create Form တွင် မလိုအပ်သောကြောင့် ဖယ်ထားသည်။

  // 3. Input Change Handler ကို ပြန်လည်ထည့်သွင်းခြင်း
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 4. Form Submit Handler ကို ပြန်လည်ထည့်သွင်းခြင်း
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch(`${API_URL}/api/snippets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setFeedback({
          status: "success",
          message: `Snippet created successfully! ID: ${data.id}. Updating list...`,
        });

        // Data List ကို ချက်ချင်း Update လုပ်ရန်
        router.refresh();

        // Form ကို ရှင်းပါ
        setFormData({
          language: "",
          snippet: "",
          question: "",
          correct_answer: "",
        });
      } else {
        setFeedback({
          status: "error",
          message: data.detail || "Failed to create snippet. Check input.",
        });
      }
    } catch (err) {
      setFeedback({
        status: "error",
        message: "Network error. Could not connect to API.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow-xl rounded-lg mb-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">
        Add New Practice Snippet
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Language (Dropdown for better practice) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Language
          </label>
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">Select Language</option>
            <option value="JavaScript">JavaScript</option>
            <option value="React">React</option>
            <option value="Python">Python</option>
          </select>
        </div>

        {/* Snippet (Code Block) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Code Snippet
          </label>
          <textarea
            name="snippet"
            value={formData.snippet}
            onChange={handleChange}
            required
            rows="6"
            placeholder="// Enter code here..."
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono"
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
            value={formData.question}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        {/* Correct Answer */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Correct Answer
          </label>
          <input
            type="text"
            name="correct_answer"
            value={formData.correct_answer}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded font-bold transition duration-300 ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {loading ? "Submitting..." : "Create Snippet"}
        </button>
      </form>
    </div>
  );
}
