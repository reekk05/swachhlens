from fastapi import FastAPI
from routers import classify, verify

app = FastAPI(
    title="SwachhLens AI Engine",
    description="Waste classification, volume estimation, and decision support intelligence",
    version="0.1.0",
)

app.include_router(classify.router)
app.include_router(verify.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "SwachhLens AI Engine"}


@app.get("/health")
def health():
    return {"status": "healthy"}
