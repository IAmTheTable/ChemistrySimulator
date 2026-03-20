import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

from app.models.element import Element

router = APIRouter(prefix="/api/elements", tags=["elements"])

_DATA_PATH = Path(__file__).parent.parent / "data" / "elements.json"
_elements: list[dict] = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
_by_number: dict[int, dict] = {e["atomic_number"]: e for e in _elements}
_by_symbol: dict[str, dict] = {e["symbol"]: e for e in _elements}


@router.get("", response_model=list[Element])
def get_all_elements():
    return _elements


@router.get("/search", response_model=Element)
def search_element(symbol: str = Query(..., min_length=1, max_length=3)):
    element = _by_symbol.get(symbol)
    if not element:
        raise HTTPException(status_code=404, detail=f"Element with symbol '{symbol}' not found")
    return element


@router.get("/{atomic_number}", response_model=Element)
def get_element(atomic_number: int):
    element = _by_number.get(atomic_number)
    if not element:
        raise HTTPException(status_code=404, detail=f"Element {atomic_number} not found")
    return element
