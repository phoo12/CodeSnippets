// Server Component ကို သုံးပြီး API မှ data ကို Server Side တွင် fetch ပါမည်။
import Link from "next/link";
import Navbar from "@/components/Navbar";

import TestSection from "../components/TestSection"; 

export const metadata = {
  title: "Code Practice Test",
};

// Environment Variable မှ API URL ကို ယူပါ
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchSnippets() {
  try {
    // Development/Testing အတွက် caching ကို ပိတ်ထားခြင်း (လိုအပ်ပါက)
    const response = await fetch(`${API_URL}/api/snippets`, {
      cache: "no-store", 
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status} - ${errorDetail}`
      );
    }

    const data = await response.json();
    return data;
  } catch (e) {
    console.error("API Fetching Error: ", e.message);
    return [];
  }
}

export default async function PracticePage() {
  const snippets = await fetchSnippets();

  // TestSection အတွက် ယာယီ Section Name
  const sectionName = "Code Snippet Fundamentals"; 

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 border-b-2 pb-2">
          {sectionName} Test
        </h1>
        <Link
          href="/create"
          className="text-sm px-4 py-2 mb-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition inline-block"
        >
          + Create New Snippet (Admin)
        </Link>
        <hr className="my-4"/>

        {snippets.length === 0 ? (
          <p className="text-red-500 font-semibold">
            There is no data. Please check Database/API or add new snippets.
          </p>
        ) : (
          //  Snippet တစ်ခုချင်းစီကို တိုက်ရိုက် မခေါ်တော့ဘဲ TestSection အသစ်ကို ပို့ပေးပါမည် 
          <TestSection snippets={snippets} sectionName={sectionName} />
        )}
      </div>
    </>
  );
}