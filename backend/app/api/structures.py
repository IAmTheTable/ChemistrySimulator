import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.engine.orbital_calculator import OrbitalCalculator
from app.engine.structure_generator import StructureGenerator
from app.models.structure import MoleculeData, OrbitalData

router = APIRouter(prefix="/api/structures", tags=["structures"])

_generator = StructureGenerator()
_orbital_calc = OrbitalCalculator()

_COMMON_PATH = Path(__file__).parent.parent / "data" / "common_structures.json"
_common = json.loads(_COMMON_PATH.read_text(encoding="utf-8"))


class StructureRequest(BaseModel):
    input: str
    input_type: str = "smiles"


@router.post("/generate", response_model=MoleculeData)
def generate_structure(request: StructureRequest):
    result = _generator.generate(request.input, request.input_type)
    if not result:
        raise HTTPException(status_code=400, detail="Could not generate structure")
    return result


@router.get("/common/{formula}", response_model=MoleculeData)
def get_common_structure(formula: str):
    data = _common.get(formula)
    if not data:
        raise HTTPException(status_code=404, detail=f"No structure for '{formula}'")
    return data


@router.get("/orbitals/{atomic_number}", response_model=OrbitalData)
def get_orbitals(atomic_number: int):
    try:
        result = _orbital_calc.get_orbitals(atomic_number)
    except (ValueError, IndexError, KeyError, StopIteration):
        raise HTTPException(status_code=404, detail=f"No orbital data for {atomic_number}")
    return result
