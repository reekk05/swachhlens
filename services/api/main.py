from fastapi import FastAPI
from routers import complaints, staff
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="SwachhLens API",
    description="Backend for the AI-Powered Waste Response Decision Support System",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(complaints.router)
app.include_router(staff.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "SwachhLens API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
