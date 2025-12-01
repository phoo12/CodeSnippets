"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import EditModal from "./EditModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

//  onCorrectAnswer ကို ဖြုတ်ပြီး onAnswerChange ကို လက်ခံပါ 
export default function SnippetCard({ snippet, onAnswerChange }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  
  //  Component အတွင်းမှာ userAnswer state ကို ထားစရာ မလိုတော့ပါ 
  // Parent Component ကနေ value ကို ပို့ပေးရင်သာ ထားပါ
  // ဒီနေရာမှာတော့ Local state ကိုပဲ ပြန်သုံးပါမယ် (Parent ကို Change event ပို့ပေးဖို့)
  const [userAnswer, setUserAnswer] = useState(""); 
  
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpdateComplete = () => router.refresh();

  //  handleCheckAnswer function ကို လုံးဝ ဖြုတ်ပါ 
  //  စုပေါင်း Submit လုပ်ရန်အတွက် 

  const handleAnswerInputChange = (e) => {
    const answer = e.target.value;
    setUserAnswer(answer);
    //  အဖြေပြောင်းတိုင်း Parent Component ကို Update လုပ်ပါ 
    if (onAnswerChange) {
      onAnswerChange(snippet.id, answer);
    }
  };


  const handleDeleteSnippet = async () => {
    if (!isAuthenticated) {
      setFeedback({
        status: "error",
        message: "Please login to delete snippets",
      });
      return;
    }

    if (!window.confirm("Are you sure you want to delete this snippet?"))
      return;

    setFeedback(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/snippets/${snippet.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        setFeedback({
          status: "success",
          message: "Snippet deleted successfully!",
        });
        handleUpdateComplete();
      } else {
        const error = await response.json();
        throw new Error(error.detail || "Failed to delete snippet");
      }
    } catch (error) {
      setFeedback({ status: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">
            #{snippet.id} - {snippet.language}
          </h2>
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

        <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto text-sm">
          <code>{snippet.snippet}</code>
        </pre>

        <p className="mt-4 font-medium text-gray-800">
          **Question:** {snippet.question}
        </p>

        {/*  Form ကို ဖြုတ်ပြီး Input ကိုသာ ထားရှိပါမည်  */}
        <div className="mt-4 flex flex-col space-y-3">
          <input
            type="text"
            value={userAnswer}
            onChange={handleAnswerInputChange}
            placeholder="Enter your answer"
            required
            className="border border-gray-300 p-2 rounded-md focus:border-blue-500"
          />
          {/*  Check Answer Button ကို ဖြုတ်ပါ  */}
        </div>

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