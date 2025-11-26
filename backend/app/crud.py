from sqlalchemy.orm import Session
from . import models, schemas
from typing import List, Optional

# ========== Code Snippet CRUD ==========

#  READ: Database မှ Snippet အားလုံးကို ဖတ်ခြင်း
def get_snippets(db: Session, skip: int = 0, limit: int = 100) -> List[models.DbCodeSnippet]:
    return db.query(models.DbCodeSnippet).offset(skip).limit(limit).all()

#  CREATE: Snippet အသစ်ကို Database ထဲသို့ ရေးသွင်းခြင်း
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

#  GET by ID: ID တစ်ခုတည်းဖြင့် ရှာဖွေခြင်း
def get_snippet_by_id(db: Session, snippet_id: int) -> models.DbCodeSnippet | None:
    return db.query(models.DbCodeSnippet).filter(models.DbCodeSnippet.id == snippet_id).first()

#  UPDATE: Snippet တစ်ခုကို ပြင်ဆင်ခြင်း
def update_snippet(db: Session, snippet_id: int, snippet_data: schemas.CodeSnippetCreate) -> models.DbCodeSnippet | None:
    """
    Given an ID and new data, updates the corresponding snippet in the database.
    """
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

#  DELETE: Snippet တစ်ခုကို ဖျက်ခြင်း
def delete_snippet(db: Session, snippet_id: int) -> bool:
    """
    Given an ID, deletes the corresponding snippet from the database.
    """
    db_snippet = db.query(models.DbCodeSnippet).filter(models.DbCodeSnippet.id == snippet_id).first()
    
    if db_snippet:
        db.delete(db_snippet)
        db.commit()
        return True
    return False

# ========== User CRUD ==========

#  GET User by Username
def get_user_by_username(db: Session, username: str) -> Optional[models.DbUser]:
    """Username ဖြင့် User ကို ရှာဖွေခြင်း"""
    return db.query(models.DbUser).filter(models.DbUser.username == username).first()

#  GET User by Email
def get_user_by_email(db: Session, email: str) -> Optional[models.DbUser]:
    """Email ဖြင့် User ကို ရှာဖွေခြင်း"""
    return db.query(models.DbUser).filter(models.DbUser.email == email).first()

#  GET User by ID
def get_user_by_id(db: Session, user_id: int) -> Optional[models.DbUser]:
    """ID ဖြင့် User ကို ရှာဖွေခြင်း"""
    return db.query(models.DbUser).filter(models.DbUser.id == user_id).first()

#  CREATE User
def create_user(db: Session, user: schemas.UserCreate, hashed_password: str) -> models.DbUser:
    """User အသစ် ဖန်တီးခြင်း"""
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