"""API endpoint for chemical nomenclature (compound naming)."""

from fastapi import APIRouter, Query

from app.engine.nomenclature import name_compound

router = APIRouter(prefix="/api/nomenclature", tags=["nomenclature"])


@router.get("/name")
def get_compound_name(formula: str = Query(..., min_length=1)):
    """Return the IUPAC name for a given chemical formula."""
    name = name_compound(formula)
    return {"formula": formula, "name": name}
