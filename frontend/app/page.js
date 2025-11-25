// Server Component ကို သုံးပြီး API မှ data ကို Server Side တွင် fetch ပါမည်။
import SnippetCard from "../components/SnippetCard"; // 👈 SnippetCard ကို import လုပ်ပါ
import CreateSnippetForm from "@/components/CreateSnippetForm";

// Environment Variable မှ API URL ကို ယူပါ (Docker တွင် backend:8000 သို့ ညွှန်ပြပါသည်)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchSnippets() {
  try {
    //  Next.js Server Component တွင် fetch() သည် automatically cache လုပ်သည်
    const response = await fetch(`${API_URL}/api/snippets`, {
      cache: "no-store", // Development အတွက် caching ကို ပိတ်ထားခြင်း
    });

    if (!response.ok) {
      // Error message ကို ပိုမိုရှင်းလင်းအောင် ဖန်တီးပါ
      const errorDetail = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status} - ${errorDetail}`
      );
    }

    const data = await response.json();
    return data;
  } catch (e) {
    console.error("API Fetching Error: ", e.message);
    // Error ဖြစ်ရင် Empty Array ပြန်ပေးခြင်း
    return [];
  }
}

export default async function PracticePage() {
  const snippets = await fetchSnippets();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 border-b-2 pb-2">
        Full-Stack Code Practice
      </h1>
      <CreateSnippetForm />

      {snippets.length === 0 ? (
        <p className="text-red-500">
          လေ့ကျင့်ခန်း ဒေတာများ မရှိသေးပါ။ Database/API ကို စစ်ဆေးပါ။
        </p>
      ) : (
        snippets.map((snippet) => (
          //  ဤနေရာကို ပြင်ဆင်ခြင်း: Button ပါသော Div ကို ဖယ်ပြီး SnippetCard ကို သုံးပါ
          <SnippetCard key={snippet.id} snippet={snippet} />
        ))
      )}
    </div>
  );
}

// ⚠️ အရေးကြီး: SnippetCard.js ရဲ့ ကုဒ်ကို page.js အောက်မှာ လုံးဝ မထားပါနဲ့။
