from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from app.database import engine
from app.routers import books, members, ai_agent, loans
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Library Management System Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books.router, prefix="/books", tags=["Books"])
app.include_router(members.router, prefix="/members", tags=["Members"])
app.include_router(loans.router, prefix="/loans", tags=["Loans"])
app.include_router(ai_agent.router, prefix="/ai", tags=["AI Agent"])

@app.get("/")
async def root():
    return {"message": "Library Management System Backend is running!"}


async def check_database_health():
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return {"status": "healthy"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {str(e)}")


@app.get("/health")
async def health_check(health: dict = Depends(check_database_health)):
    return health