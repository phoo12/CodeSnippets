# ...existing code...
from sqlalchemy.orm import Session
from . import crud, schemas, models # import models as well

#  Initial Snippet Data
initial_snippets = [
    {
        "language": "JavaScript",
        "snippet": "const result = 5 == '5';",
        "question": "What is the final value of 'result' due to Type Coercion?",
        "correct_answer": "true"
    },
    {
        "language": "JavaScript",
        "snippet": "let count = 0; for (var i = 0; i < 3; i++) { count += 1; }; console.log(i);",
        "question": "What is the output of console.log(i) after the loop finishes?",
        "correct_answer": "3"
    },
    {
        "language": "React",
        "snippet": "const [data, setData] = useState(0);\nsetData(prev => prev + 1);\nsetData(prev => prev + 1);\n// What is the final value of data?",
        "question": "What is the final value of data due to React state batching?",
        "correct_answer": "2"
    },
]

#  Seed Function
def create_initial_snippets(db: Session):
    for data in initial_snippets:
        # check if snippet already exists
        snippet_exists = db.query(models.DbCodeSnippet).filter(
            models.DbCodeSnippet.question == data["question"]
        ).first()

        if not snippet_exists:
            # use pydantic schema and insert into DB
            snippet_schema = schemas.CodeSnippetCreate(**data)
            crud.create_snippet(db, snippet=snippet_schema)
            print(f"Created snippet: {data['question']}")
        else:
            print(f"Snippet already exists: {data['question']}")
