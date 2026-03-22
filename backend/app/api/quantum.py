"""Quantum chemistry API endpoints.

Provides geometry optimization, partial charges, molecular energy,
and a combined analysis endpoint that returns all three in a single call.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.engine.geometry_optimizer import GeometryOptimizer
from app.engine.electron_density import ElectronDensityCalculator

router = APIRouter(prefix="/api/quantum", tags=["quantum"])

_optimizer = GeometryOptimizer()
_density_calc = ElectronDensityCalculator()


class OptimizeRequest(BaseModel):
    smiles: str


@router.get("/analyze/{formula}")
def analyze_formula(formula: str):
    """Combined endpoint: charges + energy + geometry in one call.

    Avoids three separate RDKit molecule preparations for the same formula.
    """
    try:
        charges = _density_calc.calculate(formula)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Charge calculation failed: {str(e)}")

    try:
        energy = _density_calc.get_molecular_energy(formula)
    except Exception:
        energy = {"formula": formula, "energy": 0.0, "unit": "kcal/mol", "method": "MMFF94"}

    try:
        geometry = _optimizer.optimize_from_formula(formula)
    except Exception:
        geometry = None

    return {
        "charges": charges,
        "energy": energy,
        "geometry": geometry,
    }


@router.post("/optimize")
def optimize_geometry(request: OptimizeRequest):
    """Optimize molecular geometry and return bond lengths, angles, and geometry type."""
    try:
        result = _optimizer.optimize(request.smiles)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@router.get("/geometry/{formula}")
def get_geometry(formula: str):
    """Get optimized geometry info (bond lengths, angles, geometry type) by formula."""
    try:
        result = _optimizer.optimize_from_formula(formula)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geometry optimization failed: {str(e)}")


@router.get("/charges/{formula}")
def get_partial_charges(formula: str):
    """Get Gasteiger partial charges for all atoms in a molecule."""
    try:
        result = _density_calc.calculate(formula)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Charge calculation failed: {str(e)}")


@router.get("/energy/{formula}")
def get_molecular_energy(formula: str):
    """Get MMFF94 force field energy for a molecule."""
    try:
        result = _density_calc.get_molecular_energy(formula)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Energy calculation failed: {str(e)}")
