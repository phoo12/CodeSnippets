from pydantic import BaseModel
from typing import Optional

#  Base Schema: အခြေခံ ပုံစံ
class CodeSnippetBase(BaseModel):
    language: str
    snippet: str
    question: str

#  Create Schema: ဒေတာအသစ် ဖန်တီးရာတွင် အသုံးပြုသည်
class CodeSnippetCreate(CodeSnippetBase):
    correct_answer: str  # အဖြေမှန်ကို ဖန်တီးတဲ့အချိန်မှာ လိုအပ်သည်

#  Response Schema: Frontend သို့ ပြန်ပို့မည့် ပုံစံ
class CodeSnippet(CodeSnippetBase):
    id: int
    
    #  Configuration: SQLAlchemy model နဲ့ တွဲဖက်ဖို့
    class Config:
        orm_mode = True