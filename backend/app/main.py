from fastapi import FastAPI, Depends, HTTPException, status, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta

from . import models, schemas, crud
from .database import engine, Base, get_db
from .initial_data import create_initial_snippets
from .auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    create_user_session,
    delete_user_session,
    get_current_user_hybrid,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

#  DB Table များကို စတင်ဖန်တီးခြင်း
Base.metadata.create_all(bind=engine)

#  FastAPI Application စတင်ခြင်း
app = FastAPI()

#  CORS Configuration - FIXED
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://frontend:3000",  # Docker internal network
    "*"  # Allow all origins during development (remove in production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicitly include OPTIONS
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    create_initial_snippets(db)
    db.close()

# ========== Authentication Endpoints ==========

@app.post("/api/auth/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """User အသစ် Registration လုပ်ခြင်း"""
    
    # Username ရှိပြီးသား စစ်ဆေးခြင်း
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Email ရှိပြီးသား စစ်ဆေးခြင်း
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Password Hash လုပ်ပြီး User ဖန်တီးခြင်း
    hashed_password = get_password_hash(user.password)
    return crud.create_user(db, user=user, hashed_password=hashed_password)

@app.post("/api/auth/login")
def login_user(
    response: Response,
    user_login: schemas.UserLogin, 
    db: Session = Depends(get_db)
):
    """User Login လုပ်ခြင်း (Hybrid: JWT + Session)"""
    
    # User ရှာဖွေခြင်း
    db_user = crud.get_user_by_username(db, username=user_login.username)
    
    if not db_user or not verify_password(user_login.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # JWT Token ဖန်တီးခြင်း
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username}, 
        expires_delta=access_token_expires
    )
    
    # Session Token ဖန်တီးခြင်း
    session_token = create_user_session(db, user_id=db_user.id)
    
    # Session Token ကို Cookie အဖြစ် သတ်မှတ်ခြင်း
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        max_age=60 * 60 * 24,  # 24 hours
        samesite="lax"
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "session_token": session_token,
        "user": db_user
    }

@app.post("/api/auth/logout")
def logout_user(
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.DbUser = Depends(get_current_user_hybrid)
):
    """User Logout လုပ်ခြင်း"""
    
    # Session Token ကို Cookie ကနေ ရယူခြင်း
    session_token = request.cookies.get("session_token")
    
    if session_token:
        # Database မှ Session ဖျက်ခြင်း
        delete_user_session(db, session_token=session_token)
    
    # Cookie ကို ဖျက်ခြင်း
    response.delete_cookie(key="session_token")
    
    return {"message": "Successfully logged out"}

@app.get("/api/auth/me", response_model=schemas.User)
def get_current_user_info(
    current_user: models.DbUser = Depends(get_current_user_hybrid)
):
    """လက်ရှိ Login ဝင်ထားသော User ၏ အချက်အလက်များ"""
    return current_user

# ========== Code Snippet Endpoints ==========

@app.get("/api/snippets", response_model=List[schemas.CodeSnippet])
def read_snippets(db: Session = Depends(get_db)):
    """Database မှ snippets များကို ဖတ်ခြင်း"""
    snippets = crud.get_snippets(db)
    return snippets

@app.post("/api/snippets", response_model=schemas.CodeSnippet, status_code=status.HTTP_201_CREATED)
def create_snippet_endpoint(
    snippet: schemas.CodeSnippetCreate, 
    db: Session = Depends(get_db),
    current_user: models.DbUser = Depends(get_current_user_hybrid)
):
    """Snippet အသစ် ထည့်သွင်းခြင်း (Authentication လိုအပ်သည်)"""
    return crud.create_snippet(db, snippet=snippet)

@app.post("/api/submit-answer")
def check_answer(user_data: dict, db: Session = Depends(get_db)):
    """အဖြေစစ်ဆေးခြင်း"""
    snippet_id = user_data.get("id")
    user_answer = user_data.get("answer")

    if not snippet_id or not user_answer:
        raise HTTPException(status_code=400, detail="ID and answer are required.")

    original_snippet = crud.get_snippet_by_id(db, snippet_id=snippet_id)

    if not original_snippet:
        raise HTTPException(status_code=404, detail="Snippet not found.")
    
    stored_answer = str(original_snippet.correct_answer).strip().lower()
    submitted_answer = user_answer.strip().lower()

    if submitted_answer == stored_answer:
        return {"status": "success", "message": "Correct answer! Excellent!"}
    else:
        return {"status": "error", "message": "Incorrect answer. Try again."}
    
@app.put("/api/snippets/{snippet_id}", response_model=schemas.CodeSnippet)
def update_snippet_endpoint(
    snippet_id: int, 
    snippet: schemas.CodeSnippetCreate, 
    db: Session = Depends(get_db),
    current_user: models.DbUser = Depends(get_current_user_hybrid)
):
    """Snippet ပြင်ဆင်ခြင်း (Authentication လိုအပ်သည်)"""
    updated_snippet = crud.update_snippet(db, snippet_id=snippet_id, snippet_data=snippet)
    
    if updated_snippet is None:
        raise HTTPException(status_code=404, detail="Snippet not found for update.")
        
    return updated_snippet

@app.delete("/api/snippets/{snippet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_snippet_endpoint(
    snippet_id: int, 
    db: Session = Depends(get_db),
    current_user: models.DbUser = Depends(get_current_user_hybrid)
):
    """Snippet ဖျက်ခြင်း (Authentication လိုအပ်သည်)"""
    was_deleted = crud.delete_snippet(db, snippet_id=snippet_id)
    
    if not was_deleted:
        raise HTTPException(status_code=404, detail=f"Snippet with ID {snippet_id} not found.")
        
    return