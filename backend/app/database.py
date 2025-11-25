import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

#  .env file ထဲက DATABASE_URL ကို ယူပါ
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./dev.db")
# Use connect_args only for sqlite (needed for SQLite thread-safety with SQLAlchemy)
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

# DB Session ကို ဖန်တီးဖို့
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class: SQLAlchemy Models များအတွက် အခြေခံ
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()