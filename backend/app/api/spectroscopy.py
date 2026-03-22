"""Spectroscopy API endpoints.

Provides simulated IR, UV-Vis, and mass spectra for chemical formulas.
"""

from fastapi import APIRouter, HTTPException

from app.engine.spectroscopy import SpectroscopyEngine

router = APIRouter(prefix="/api/spectroscopy", tags=["spectroscopy"])

_engine = SpectroscopyEngine(seed=42)


@router.get("/ir/{formula}")
def get_ir_spectrum(formula: str):
    """Return a simulated IR spectrum for the given formula."""
    try:
        return _engine.generate_ir_spectrum(formula)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/uv-vis/{formula}")
def get_uv_vis_spectrum(formula: str):
    """Return a simulated UV-Vis spectrum for the given formula."""
    try:
        return _engine.generate_uv_vis_spectrum(formula)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/mass-spec/{formula}")
def get_mass_spectrum(formula: str):
    """Return a simulated mass spectrum for the given formula."""
    try:
        return _engine.generate_mass_spectrum(formula)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
