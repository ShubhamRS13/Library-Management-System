import os
from sqlmodel import create_engine, SQLModel, Session
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

# Get the URL from .env
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# Create the engine
# Note: psycopg (v3) uses 'postgresql+psycopg' as the dialect
engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session