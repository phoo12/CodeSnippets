from sqlalchemy.orm import Session
from . import models, schemas
from typing import List

#  READ: Database မှ Snippet အားလုံးကို ဖတ်ခြင်း
def get_snippets(db: Session, skip: int = 0, limit: int = 100) -> List[models.DbCodeSnippet]:
    # .all() ကို ခေါ်ရင် Database ထဲက အားလုံးကို List အဖြစ် ပြန်ပေးပါမယ်။
    return db.query(models.DbCodeSnippet).offset(skip).limit(limit).all()

#  CREATE: Snippet အသစ်ကို Database ထဲသို့ ရေးသွင်းခြင်း
def create_snippet(db: Session, snippet: schemas.CodeSnippetCreate) -> models.DbCodeSnippet:
    db_snippet = models.DbCodeSnippet(
        language=snippet.language,
        snippet=snippet.snippet,
        question=snippet.question,
        correct_answer=snippet.correct_answer # အဖြေမှန်ကို Database မှာ သိမ်းထားသည်
    )
    db.add(db_snippet)
    db.commit() # Database ထဲသို့ တကယ်တမ်း ရေးသွင်းခြင်း
    db.refresh(db_snippet) # အသစ်ဝင်လာသော id ကို ရယူခြင်း
    return db_snippet

#  GET by ID: ID တစ်ခုတည်းဖြင့် ရှာဖွေခြင်း
def get_snippet_by_id(db: Session, snippet_id: int) -> models.DbCodeSnippet | None:
    return db.query(models.DbCodeSnippet).filter(models.DbCodeSnippet.id == snippet_id).first()


#  UPDATE: Snippet တစ်ခုကို ပြင်ဆင်ခြင်း
def update_snippet(db: Session, snippet_id: int, snippet_data: schemas.CodeSnippetCreate) -> models.DbCodeSnippet | None:
    """
    Given an ID and new data, updates the corresponding snippet in the database.
    """
    # 1. ID နဲ့ မူရင်း object ကို ရှာပါ
    db_snippet = db.query(models.DbCodeSnippet).filter(models.DbCodeSnippet.id == snippet_id).first()
    
    if db_snippet:
        # 2. ဒေတာများကို ပြောင်းလဲပါ
        # schemas.CodeSnippetCreate မှာ မပါတဲ့ data ကို update လုပ်ဖို့ သတိထားပါ။
        db_snippet.language = snippet_data.language
        db_snippet.snippet = snippet_data.snippet
        db_snippet.question = snippet_data.question
        db_snippet.correct_answer = snippet_data.correct_answer
        
        # 3. Database သို့ commit လုပ်ပါ
        db.commit()
        db.refresh(db_snippet)
        return db_snippet
    return None

#  (Optional) DELETE: Snippet တစ်ခုကို ဖျက်ခြင်း (Delete Function ကိုလည်း ထည့်သွင်းလိုပါက)
def delete_snippet(db: Session, snippet_id: int) -> bool:
    """
    Given an ID, deletes the corresponding snippet from the database.
    """
    # 1. ID နဲ့ မူရင်း object ကို ရှာပါ
    db_snippet = db.query(models.DbCodeSnippet).filter(models.DbCodeSnippet.id == snippet_id).first()
    
    if db_snippet:
        # 2. Database မှ ဖျက်ပါ
        db.delete(db_snippet)
        # 3. Commit လုပ်ပါ
        db.commit()
        return True # ဖျက်ခြင်းအောင်မြင်ကြောင်း ပြန်ပို့ပါ
    return False # မတွေ့၍ ဖျက်ခြင်းမအောင်မြင်ပါ