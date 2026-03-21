from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.elements import router as elements_router
from app.api.nomenclature import router as nomenclature_router
from app.api.reactions import router as reactions_router
from app.api.structures import router as structures_router
from app.api.substances import router as substances_router

app = FastAPI(title="Chemistry Simulator API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(elements_router)
app.include_router(nomenclature_router)
app.include_router(reactions_router)
app.include_router(structures_router)
app.include_router(substances_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
