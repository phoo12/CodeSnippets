from sqlalchemy.orm import Session
from . import models, schemas
from typing import List, Optional

# ========== Code Snippet CRUD ==========

def get_snippets(db: Session, skip: int = 0, limit: int = 100) -> List[models.DbCodeSnippet]:
    return db.query(models.DbCodeSnippet).offset(skip).limit(limit).all()

def create_snippet(db: Session, snippet: schemas.CodeSnippetCreate) -> models.DbCodeSnippet:
    db_snippet = models.DbCodeSnippet(
        language=snippet.language,
        snippet=snippet.snippet,
        question=snippet.question,
        correct_answer=snippet.correct_answer
    )
    db.add(db_snippet)
    db.commit()
    db.refresh(db_snippet)
    return db_snippet

def get_snippet_by_id(db: Session, snippet_id: int) -> models.DbCodeSnippet | None:
    return db.query(models.DbCodeSnippet).filter(models.DbCodeSnippet.id == snippet_id).first()

def update_snippet(db: Session, snippet_id: int, snippet_data: schemas.CodeSnippetCreate) -> models.DbCodeSnippet | None:
    db_snippet = db.query(models.DbCodeSnippet).filter(models.DbCodeSnippet.id == snippet_id).first()
    
    if db_snippet:
        db_snippet.language = snippet_data.language
        db_snippet.snippet = snippet_data.snippet
        db_snippet.question = snippet_data.question
        db_snippet.correct_answer = snippet_data.correct_answer
        
        db.commit()
        db.refresh(db_snippet)
        return db_snippet
    return None

def delete_snippet(db: Session, snippet_id: int) -> bool:
    db_snippet = db.query(models.DbCodeSnippet).filter(models.DbCodeSnippet.id == snippet_id).first()
    
    if db_snippet:
        db.delete(db_snippet)
        db.commit()
        return True
    return False

# ========== User CRUD ==========

def get_user_by_username(db: Session, username: str) -> Optional[models.DbUser]:
    return db.query(models.DbUser).filter(models.DbUser.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.DbUser]:
    return db.query(models.DbUser).filter(models.DbUser.email == email).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[models.DbUser]:
    return db.query(models.DbUser).filter(models.DbUser.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str) -> models.DbUser:
    db_user = models.DbUser(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# ========== Score CRUD (Section-based) ==========

def record_or_update_section_score(
    db: Session, 
    user_id: int, 
    
    section_name: str, 
 
    new_total_score: int,
    total_possible: int
) -> tuple[models.DbUserScore, bool]:
    """
    User ၏ Section တစ်ခုအတွက် စုစုပေါင်းရမှတ်ကို မှတ်တမ်းတင်ခြင်း။
    ယခင်ရမှတ်ထက် ပိုကောင်းမှသာ Record အသစ်ကို ထည့်သွင်းသည်။ (Retry concept)
    """
    
    # 1. User ၏ လက်ရှိ အမြင့်ဆုံးရမှတ်ကို ရှာပါ
    current_best_score = db.query(models.DbUserScore).filter(
        models.DbUserScore.user_id == user_id,
        models.DbUserScore.section_name == section_name
    ).order_by(
        models.DbUserScore.total_score.desc(),
        models.DbUserScore.submitted_at.desc()
    ).first()
    
    is_updated = False

    if current_best_score and new_total_score <= current_best_score.total_score:
        # ရမှတ်အသစ်သည် အမြင့်ဆုံးရမှတ်ထက် မကောင်းပါက၊ ဘာမှမလုပ်ပါ
        return current_best_score, is_updated

    # 2. Record အသစ် ဖန်တီးပါ (ယခင်က မရှိသေးလျှင် သို့မဟုတ် ရမှတ်ပိုကောင်းလျှင်)
    db_score = models.DbUserScore(
        user_id=user_id,
        section_name=section_name,
        total_score=new_total_score,
        total_possible= total_possible,
       
    )
    db.add(db_score)
    db.commit()
    db.refresh(db_score)
    is_updated = True
    
    # ပြန်လည်ဖြေဆိုခွင့် (Retry) အတွက် မှတ်တမ်းအသစ်ကို အမြဲသိမ်းဆည်းသော်လည်း၊
    # is_updated သည် ရမှတ်ပိုကောင်းမှသာ True ဖြစ်ပါမည်။
    return db_score, is_updated


def get_user_score_history(db: Session, user_id: int) -> List[models.DbUserScore]:
    """User ၏ ဖြေဆိုပြီးခဲ့သော Section ၏ Score မှတ်တမ်းအားလုံးကို ရယူခြင်း"""
    return db.query(models.DbUserScore).filter(
        models.DbUserScore.user_id == user_id
    ).order_by(
        models.DbUserScore.submitted_at.desc()
    ).all()

