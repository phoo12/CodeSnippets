from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List


# ဖန်တီးထားတဲ့ file တွေကနေ import လုပ်ခြင်း
from . import models, schemas, crud
from .database import engine, Base, get_db
from .initial_data import create_initial_snippets

#  DB Table များကို စတင်ဖန်တီးခြင်း
# ဒီ command က models.py ထဲက Base ကို အခြေခံပြီး Table တွေ ဖန်တီးပေးပါမယ်။
Base.metadata.create_all(bind=engine)

#  FastAPI Application စတင်ခြင်း
app = FastAPI()
# Startup Event မှာ Initial Data ထည့်သွင်းခြင်း
@app.on_event("startup")
def startup_event():
    # Application စတင်တဲ့အခါ DB Session ကို ယူပြီး Seed Data ထည့်သွင်းပါ
    db = next(get_db())
    create_initial_snippets(db)
    db.close()

#  CORS Configuration (ယခင်အတိုင်း)
origins = ["http://localhost", "http://localhost:3001"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#  Endpoint: Database မှ snippets များကို ဖတ်ခြင်း
@app.get("/api/snippets", response_model=List[schemas.CodeSnippet])
def read_snippets(db: Session = Depends(get_db)):
    # crud.py ထဲက function ကို အသုံးပြုပြီး DB ကနေ data ယူပါမယ်။
    snippets = crud.get_snippets(db)
    
    # အဖြေမှန်ကို Frontend သို့ မပေးပို့ဖို့ schemas.CodeSnippet ကို response_model အဖြစ် သုံးထားပါတယ်။
    return snippets

#  Endpoint: Snippet အသစ် ထည့်သွင်းခြင်း (Testing အတွက်)
@app.post("/api/snippets", response_model=schemas.CodeSnippet, status_code=status.HTTP_201_CREATED)
def create_snippet_endpoint(snippet: schemas.CodeSnippetCreate, db: Session = Depends(get_db)):
    return crud.create_snippet(db, snippet=snippet)

#  Endpoint: အဖြေစစ်ဆေးခြင်း
@app.post("/api/submit-answer")
def check_answer(user_data: dict, db: Session = Depends(get_db)):
    snippet_id = user_data.get("id")
    user_answer = user_data.get("answer")

    if not snippet_id or not user_answer:
        raise HTTPException(status_code=400, detail="ID and answer are required.")

    # DB ကနေ မူရင်း Snippet ကို ID နဲ့ ရှာပါ
    original_snippet = crud.get_snippet_by_id(db, snippet_id=snippet_id)

    if not original_snippet:
        raise HTTPException(status_code=404, detail="Snippet not found.")
    
    #  FIX: Robust comparison by stripping whitespace and converting to lowercase
    # This prevents errors from 'true ' vs 'true' or 'True' vs 'true'
    stored_answer = str(original_snippet.correct_answer).strip().lower()
    submitted_answer = user_answer.strip().lower()

    # အဖြေစစ်ဆေးခြင်း

    if submitted_answer == stored_answer:
        return {"status": "success", "message": "Correct answer! Excellent!"}
    else:
        return {"status": "error", "message": "Incorrect answer. Try again."}
    
#  Endpoint: Snippet တစ်ခုကို ID ဖြင့် ပြင်ဆင်ခြင်း
@app.put("/api/snippets/{snippet_id}", response_model=schemas.CodeSnippet)
def update_snippet_endpoint(
    snippet_id: int, 
    snippet: schemas.CodeSnippetCreate, 
    db: Session = Depends(get_db)
):
    # 1. crud function ကို ခေါ်ဆိုပြီး ပြင်ဆင်ပါ
    updated_snippet = crud.update_snippet(db, snippet_id=snippet_id, snippet_data=snippet)
    
    if updated_snippet is None:
        # 2. Snippet ကို ရှာမတွေ့ရင် Error ပြန်ပို့ပါ
        raise HTTPException(status_code=404, detail="Snippet not found for update.")
        
    return updated_snippet

#  Endpoint: Snippet တစ်ခုကို ID ဖြင့် ဖျက်ခြင်း
@app.delete("/api/snippets/{snippet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_snippet_endpoint(
    snippet_id: int, 
    db: Session = Depends(get_db)
):
    # 1. crud function ကို ခေါ်ဆိုပြီး ဖျက်ပါ
    was_deleted = crud.delete_snippet(db, snippet_id=snippet_id)
    
    if not was_deleted:
        # 2. Snippet ကို ရှာမတွေ့ရင် Error ပြန်ပို့ပါ
        raise HTTPException(status_code=404, detail=f"Snippet with ID {snippet_id} not found.")
        
    # 3. အောင်မြင်စွာ ဖျက်ပြီးပါက 204 No Content ကို ပြန်ပို့ပါ (Response Body မပါ)
    return