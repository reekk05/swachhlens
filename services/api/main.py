from fastapi import FastAPI
from routers import complaints

app = FastAPI(
    title="SwachhLens API",
    description="Backend for the AI-Powered Waste Response Decision Support System",
    version="0.1.0",
)

app.include_router(complaints.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "SwachhLens API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
