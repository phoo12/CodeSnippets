from fastapi import FastAPI, Depends, HTTPException, status, Response, Request, APIRouter
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

# --------------------------
# Create database tables
# --------------------------
Base.metadata.create_all(bind=engine)

app = FastAPI()

router = APIRouter()  # FIX: Router added

# --------------------------
# CORS Configuration
# --------------------------
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://frontend:3000",
    "http://frontend:3001",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    create_initial_snippets(db)
    db.close()


# =================================================
#               Authentication Endpoints
# =================================================

@app.post("/api/auth/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    return crud.create_user(db, user=user, hashed_password=hashed_password)


@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login_user(
    response: Response,
    user_login: schemas.UserLogin, 
    db: Session = Depends(get_db)
):
    db_user = crud.get_user_by_username(db, username=user_login.username)
    
    if not db_user or not verify_password(user_login.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username}, 
        expires_delta=access_token_expires
    )
    
    session_token = create_user_session(db, user_id=db_user.id)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        max_age=60 * 60 * 24,
        samesite="lax"
    )
    
    user_response = schemas.User(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        full_name=db_user.full_name,
        created_at=db_user.created_at
    )
    
    return schemas.LoginResponse(
        access_token=access_token,
        token_type="bearer",
        session_token=session_token,
        user=user_response
    )


@app.post("/api/auth/logout")
def logout_user(
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.DbUser = Depends(get_current_user_hybrid)
):
    session_token = request.cookies.get("session_token")
    
    if session_token:
        delete_user_session(db, session_token=session_token)

    response.delete_cookie(key="session_token")
    return {"message": "Successfully logged out"}


@app.get("/api/auth/me", response_model=schemas.User)
def get_current_user_info(
    current_user: models.DbUser = Depends(get_current_user_hybrid)
):
    return current_user


# =================================================
#               Code Snippet Endpoints
# =================================================

@app.get("/api/snippets", response_model=List[schemas.CodeSnippet])
def read_snippets(db: Session = Depends(get_db)):
    return crud.get_snippets(db)


@app.post("/api/snippets", response_model=schemas.CodeSnippet, status_code=status.HTTP_201_CREATED)
def create_snippet_endpoint(
    snippet: schemas.CodeSnippetCreate, 
    db: Session = Depends(get_db),
    current_user: models.DbUser = Depends(get_current_user_hybrid)
):
    return crud.create_snippet(db, snippet=snippet)


# =================================================
#           Score Submission Endpoint
# =================================================

@app.post("/api/submit-batch-answer", response_model=schemas.SectionScoreResponse)
def submit_batch_answer(
    submission_data: schemas.BatchSubmission,
    db: Session = Depends(get_db),
    current_user: models.DbUser = Depends(get_current_user_hybrid)
):
    snippet_ids = [ans.snippet_id for ans in submission_data.answers]

    original_snippets = db.query(models.DbCodeSnippet).filter(
        models.DbCodeSnippet.id.in_(snippet_ids)
    ).all()
    
    snippet_map = {s.id: s for s in original_snippets}
    
    results: List[schemas.SubmissionResult] = []
    total_score_achieved = 0
    total_score_possible = 0
    
    for answer in submission_data.answers:
        snippet = snippet_map.get(answer.snippet_id)
        if not snippet:
            continue
            
        total_score_possible += 1
        
        stored_answer = str(snippet.correct_answer).strip().lower()
        submitted_answer = str(answer.submitted_answer).strip().lower()
        
        is_correct = (submitted_answer == stored_answer)
        user_score = 1 if is_correct else 0
        total_score_achieved += user_score

        results.append(
            schemas.SubmissionResult(
                snippet_id=answer.snippet_id,
                is_correct=is_correct,
                user_score=user_score,
                correct_answer=snippet.correct_answer
            )
        )
        
    recorded_score, is_updated = crud.record_or_update_section_score(
        db, 
        user_id=current_user.id,
        section_name=submission_data.section_name,
        new_total_score=total_score_achieved,
        total_possible=total_score_possible
    )
    
    return schemas.SectionScoreResponse(
        section_name=submission_data.section_name,
        total_score_achieved=total_score_achieved,
        total_score_possible=total_score_possible,
        results=results,
        is_record_updated=is_updated
    )


# =================================================
#       Working Existing History Endpoint
# =================================================

@app.get("/api/scores/history", response_model=List[schemas.UserScoreRecord])
def get_user_score_history_endpoint(
    db: Session = Depends(get_db),
    current_user: models.DbUser = Depends(get_current_user_hybrid)
):
    return crud.get_user_score_history(db, user_id=current_user.id)


# =================================================
#       FIXED /api/test-history (router)
# =================================================




@app.get("/api/test-history",  response_model=schemas.TestHistoryResponse)
def get_test_history(
    db: Session = Depends(get_db),
    current_user: models.DbUser = Depends(get_current_user_hybrid)
):
    """Get user's test history"""
    # Query test submissions
    submissions = db.query(models.DbUserScore).filter(
        models.DbUserScore.user_id == current_user.id
    ).order_by(
        models.DbUserScore.submitted_at.desc()
    ).all()

    return {
        "history": [
            {
                "section_name": sub.section_name,
                "total_score_achieved": sub.total_score,
                "total_score_possible": sub.total_possible,
                "submitted_at": sub.submitted_at.isoformat(),
                "is_best_score": True
            }
            for sub in submissions
        ]
    }
    return {"history": history_items}


# =================================================
#               Snippet Update/Delete
# =================================================

@app.put("/api/snippets/{snippet_id}", response_model=schemas.CodeSnippet)
def update_snippet_endpoint(
    snippet_id: int, 
    snippet: schemas.CodeSnippetCreate, 
    db: Session = Depends(get_db),
    current_user: models.DbUser = Depends(get_current_user_hybrid)
):
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
    was_deleted = crud.delete_snippet(db, snippet_id=snippet_id)
    
    if not was_deleted:
        raise HTTPException(status_code=404, detail=f"Snippet with ID {snippet_id} not found.")
        
    return
