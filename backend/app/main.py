from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.elements import router as elements_router

app = FastAPI(title="Chemistry Simulator API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(elements_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
