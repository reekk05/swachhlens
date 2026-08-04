from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import get_db

app = FastAPI(
    title="SwachhLens API",
    description="Backend for the AI-Powered Waste Response Decision Support System",
    version="0.1.0",
)


@app.get("/")
def root():
    return {"status": "ok", "service": "SwachhLens API"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/db-check")
def db_check(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT count(*) FROM complaints"))
    count = result.scalar()
    return {"status": "connected", "complaints_count": count}
