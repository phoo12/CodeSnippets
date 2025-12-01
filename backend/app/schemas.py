from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime

# ========== Code Snippet Schemas ==========

class CodeSnippetBase(BaseModel):
    language: str
    snippet: str
    question: str

class CodeSnippetCreate(CodeSnippetBase):
    correct_answer: str

class CodeSnippet(CodeSnippetBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

# ========== Submission Schemas (Concept အသစ်အတွက်) ==========
# တစ်မေးခွန်းချင်းစီရဲ့ အဖြေ (Backend သို့ ပို့ရန်)
class SingleAnswer(BaseModel): 
    snippet_id: int 
    submitted_answer: str

# မေးခွန်းများစွာရဲ့ အဖြေကို တစ်ပြိုင်တည်း ပို့ရန်
class BatchSubmission(BaseModel):
    section_name: str # ဒီ Submission က ဘယ် Section အတွက်လဲ
    answers: List[SingleAnswer]


# ========== Response Schemas (Score) ==========

# Database ထဲမှာ သိမ်းဆည်းမယ့် User Score Record (Section တစ်ခုလုံးအတွက်)
class UserScoreRecord(BaseModel):
    id: int
    user_id: int
    section_name: str
    total_score: int
    submitted_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Submission ရဲ့ အဖြေနှင့် ရလဒ်များ (Frontend ကို ပြန်ပို့ရန်)
class SubmissionResult(BaseModel):
    snippet_id: int
    is_correct: bool
    user_score: int
    correct_answer: str # ချက်ချင်း Feedback အတွက် မူရင်းအဖြေကို ပြန်ပို့သည်

# Final Response Model (Total Score နှင့် အသေးစိတ် ရလဒ်များ)
class SectionScoreResponse(BaseModel):
    section_name: str
    total_score_achieved: int
    total_score_possible: int
    results: List[SubmissionResult]
    is_record_updated: bool # ရမှတ်ကောင်းလို့ DB မှာ Update လုပ်ခဲ့လား

# ========== Authentication Schemas ==========

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    session_token: str
    user: User

# ========== TestHistory Schemas ==========

class TestHistoryItem(BaseModel):
    section_name: str
    total_score_achieved: int
    total_score_possible: int
    submitted_at: str
    is_best_score: bool

class TestHistoryResponse(BaseModel):
    history: List[TestHistoryItem]
