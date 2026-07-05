from fastapi import Depends, FastAPI
from sqlalchemy import text
from app.database import engine, get_session
from sqlmodel import Session

app = FastAPI(title="Library Management System Backend", version="1.0.0")


# New test endpoint to verify DB connection
@app.get("/test-db")
def test_db_connection(session: Session = Depends(get_session)):
    try:
        # Execute a simple SQL query to test connectivity
        session.exec(text("SELECT 1"))
        return {"status": "success", "message": "Connected to Neon DB successfully!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/")
async def root():
    return {"message": "Library Management System Backend is running!"}