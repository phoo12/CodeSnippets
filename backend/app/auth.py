from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session
import secrets

from .database import get_db
from . import models

# Security Configuration
SECRET_KEY = "your-secret-key-change-this-in-production"  # change!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
SESSION_EXPIRE_MINUTES = 60 * 24  # 24 hours

# HTTP Bearer for JWT
security = HTTPBearer()

# Password Utilities using bcrypt directly
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Password မှန်/မမှန် စစ်ဆေးခြင်း"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    """Password ကို Hash လုပ်ခြင်း"""
    # Bcrypt requires bytes
    password_bytes = password.encode('utf-8')
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return as string for database storage
    return hashed.decode('utf-8')

# JWT Token Functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """JWT Access Token ဖန်တီးခြင်း"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """JWT Token ကို Decode လုပ်ခြင်း"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# Session Token Functions
def create_session_token() -> str:
    """Random Session Token ဖန်တီးခြင်း"""
    return secrets.token_urlsafe(32)

# Authentication Dependencies
async def get_current_user_jwt(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.DbUser:
    """JWT Token မှ User ကို ရယူခြင်း"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    user = db.query(models.DbUser).filter(models.DbUser.username == username).first()
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_user_session(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[models.DbUser]:
    """Session Token မှ User ကို ရယူခြင်း"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        return None
    
    session = db.query(models.DbSession).filter(
        models.DbSession.token == session_token,
        models.DbSession.expires_at > datetime.utcnow()
    ).first()
    
    if not session:
        return None
    
    return session.user

async def get_current_user_hybrid(
    request: Request,
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> models.DbUser:
    """
    Hybrid Authentication: JWT သို့မဟုတ် Session အသုံးပြုနိုင်သည်
    """
    # ပထမဦးစွာ JWT ကို စစ်ဆေးပါ
    if credentials:
        try:
            return await get_current_user_jwt(credentials, db)
        except HTTPException:
            pass
    
    # JWT မရှိလျှင် Session ကို စစ်ဆေးပါ
    user = await get_current_user_session(request, db)
    if user:
        return user
    
    # နှစ်ခုလုံး မရှိလျှင် Error
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated. Please login.",
        headers={"WWW-Authenticate": "Bearer"},
    )

# Session Management
def create_user_session(db: Session, user_id: int) -> str:
    """User အတွက် Session အသစ် ဖန်တီးခြင်း"""
    # ရှိပြီးသား active sessions များကို ဖျက်ပါ (Optional)
    db.query(models.DbSession).filter(
        models.DbSession.user_id == user_id
    ).delete()
    
    # Session အသစ် ဖန်တီးပါ
    session_token = create_session_token()
    expires_at = datetime.utcnow() + timedelta(minutes=SESSION_EXPIRE_MINUTES)
    
    db_session = models.DbSession(
        token=session_token,
        user_id=user_id,
        expires_at=expires_at
    )
    db.add(db_session)
    db.commit()
    
    return session_token

def delete_user_session(db: Session, session_token: str) -> bool:
    """Session ကို ဖျက်ခြင်း (Logout)"""
    session = db.query(models.DbSession).filter(
        models.DbSession.token == session_token
    ).first()
    
    if session:
        db.delete(session)
        db.commit()
        return True
    return False