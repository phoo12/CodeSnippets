from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from datetime import datetime

# ========== Code Snippet Schemas ==========

#  Base Schema: အခြေခံ ပုံစံ
class CodeSnippetBase(BaseModel):
    language: str
    snippet: str
    question: str

#  Create Schema: ဒေတာအသစ် ဖန်တီးရာတွင် အသုံးပြုသည်
class CodeSnippetCreate(CodeSnippetBase):
    correct_answer: str

#  Response Schema: Frontend သို့ ပြန်ပို့မည့် ပုံစံ
class CodeSnippet(CodeSnippetBase):
    id: int
    
    class Config:
        model_config = ConfigDict(from_attributes=True)

# ========== Authentication Schemas ==========

#  User Registration Schema
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

#  User Login Schema
class UserLogin(BaseModel):
    username: str
    password: str

#  User Response Schema (Public Info)
class User(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

#  Token Response Schema
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

#  Login Response Schema (Hybrid: JWT + Session)
class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    session_token: str
    user: User