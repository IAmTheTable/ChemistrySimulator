import json
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(prefix="/api/substances", tags=["substances"])
_DATA_PATH = Path(__file__).parent.parent / "data" / "substances.json"
_substances = json.loads(_DATA_PATH.read_text(encoding="utf-8"))


@router.get("/common")
def get_common_substances():
    return _substances
