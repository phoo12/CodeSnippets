from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from .database import Base
from sqlalchemy.orm import relationship
from datetime import datetime

#  Database Table Structure (SQLAlchemy Model)
class DbCodeSnippet(Base):
    __tablename__ = "code_snippets" # Table နာမည်

    id = Column(Integer, primary_key=True, index=True)
    language = Column(String, index=True)
    snippet = Column(String)
    question = Column(String)
    correct_answer = Column(String)

#  User Model
class DbUser(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    sessions = relationship("DbSession", back_populates="user", cascade="all, delete-orphan")

#  Session Model (For Session-based Authentication)
class DbSession(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    
    # Relationship
    user = relationship("DbUser", back_populates="sessions")