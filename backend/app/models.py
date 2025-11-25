from sqlalchemy import Column, Integer, String
from .database import Base

#  Database Table Structure (SQLAlchemy Model)
class DbCodeSnippet(Base):
    __tablename__ = "code_snippets" # Table နာမည်

    id = Column(Integer, primary_key=True, index=True)
    language = Column(String, index=True)
    snippet = Column(String)
    question = Column(String)
    correct_answer = Column(String)