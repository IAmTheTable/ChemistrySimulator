import json
from pathlib import Path

from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/api/substances", tags=["substances"])
_DATA_PATH = Path(__file__).parent.parent / "data" / "substances.json"
_ELEMENTS_PATH = Path(__file__).parent.parent / "data" / "elements.json"
_substances = json.loads(_DATA_PATH.read_text(encoding="utf-8"))

# Load element data for molar mass lookup
_elements_list = json.loads(_ELEMENTS_PATH.read_text(encoding="utf-8"))
_ELEMENT_MASSES: dict[str, float] = {e["symbol"]: e["atomic_mass"] for e in _elements_list}

# Comprehensive compound color database
COMPOUND_COLORS: dict[str, str] = {
    # Solutions
    "CuSO4": "#4169e1",       # Blue (copper sulfate solution)
    "KMnO4": "#800080",       # Purple (potassium permanganate)
    "FeCl3": "#b8860b",       # Dark goldenrod (ferric chloride)
    "K2Cr2O7": "#ff8c00",     # Orange (potassium dichromate)
    "NiCl2": "#00cc00",       # Green (nickel chloride)
    "CoCl2": "#ff69b4",       # Pink (cobalt chloride)
    "Cu(NO3)2": "#0000cd",    # Blue
    "FeSO4": "#90ee90",       # Light green (ferrous sulfate)
    "Cr2(SO4)3": "#006400",   # Dark green
    "MnSO4": "#ffb6c1",       # Light pink
    "I2": "#4b0082",          # Indigo (iodine)
    "Br2": "#8b0000",         # Dark red (bromine)
    "S": "#ffff00",           # Yellow (sulfur)
    "Cu": "#b87333",          # Copper color
    "Au": "#ffd700",          # Gold
    "Fe": "#808080",          # Iron gray
    "C": "#333333",           # Carbon black
    "P": "#ff4500",           # Red phosphorus
    # Precipitates
    "Fe(OH)3": "#8b4513",     # Rust brown
    "Cu(OH)2": "#87ceeb",     # Light blue
    "AgCl": "#f0f0f0",        # White
    "PbI2": "#ffd700",        # Bright yellow
    "BaSO4": "#f8f8f8",       # White
    "CaCO3": "#ffffff",       # White
    "MnO2": "#1a1a1a",        # Black
    # Gases
    "Cl2": "#90ee90",         # Yellow-green
    "NO2": "#8b4513",         # Brown
    # Acids (in solution)
    "HCl": "#e8e8e8",         # Nearly colorless
    "H2SO4": "#e8e8e8",       # Nearly colorless
    "HNO3": "#ffffcc",        # Slightly yellow
    # Bases
    "NaOH": "#f0f0f0",        # Colorless
    "KOH": "#f0f0f0",         # Colorless
    "NH3": "#e8f0ff",          # Very light blue tint
    # Water
    "H2O": "#cce5ff",
}

# Known gases at STP
_GASES = {"H2", "O2", "N2", "Cl2", "CO2", "CO", "SO2", "SO3", "NO", "NO2",
           "NH3", "HF", "HCl", "HBr", "HI", "H2S", "CH4", "C2H2", "C2H4",
           "C3H8", "He", "Ne", "Ar", "Kr", "Xe", "Rn", "F2"}

# Known liquids at STP
_LIQUIDS = {"H2O", "Br2", "Hg", "C2H5OH", "CH3OH", "H2O2", "H2SO4", "HNO3"}

# Hazard classes by formula pattern
_HAZARD_LOOKUP: dict[str, str] = {
    "HCl": "corrosive", "H2SO4": "corrosive", "HNO3": "corrosive",
    "HF": "corrosive", "NaOH": "corrosive", "KOH": "corrosive",
    "H2O2": "oxidizer", "KMnO4": "oxidizer", "KClO3": "oxidizer",
    "NH4NO3": "oxidizer", "AgNO3": "oxidizer",
    "Cl2": "toxic", "CO": "toxic", "H2S": "toxic", "HCN": "toxic",
    "Na": "flammable", "K": "flammable", "Li": "flammable",
    "Mg": "flammable", "CH4": "flammable", "C3H8": "flammable",
}


def _determine_phase(formula: str) -> str:
    """Determine the phase at STP for a given formula."""
    if formula in _GASES:
        return "g"
    if formula in _LIQUIDS:
        return "l"
    # Acids and ionic compounds in water are typically aqueous
    if formula.startswith("H") and len(formula) > 1 and not formula[1].islower():
        return "aq"
    return "s"


def _determine_hazard(formula: str) -> str:
    """Determine hazard class for a formula."""
    return _HAZARD_LOOKUP.get(formula, "none")


@router.get("/common")
def get_common_substances():
    return _substances


@router.post("/lookup")
def lookup_substance(formula: str = Query(...)):
    """Look up or create substance info for any formula."""
    from app.engine.nomenclature import name_compound
    from app.engine.equation_balancer import parse_formula

    # First check if it's already in our substances list
    for sub in _substances:
        if sub["formula"] == formula:
            return sub

    try:
        name = name_compound(formula)
        elements = parse_formula(formula)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid formula: {formula}")

    # Compute molar mass from element atomic masses
    molar_mass = 0.0
    for symbol, count in elements.items():
        mass = _ELEMENT_MASSES.get(symbol)
        if mass is None:
            raise HTTPException(status_code=400, detail=f"Unknown element: {symbol}")
        molar_mass += mass * count

    phase = _determine_phase(formula)
    color = COMPOUND_COLORS.get(formula, "#cccccc")
    hazard_class = _determine_hazard(formula)

    return {
        "formula": formula,
        "name": name,
        "phase": phase,
        "color": color,
        "molar_mass": round(molar_mass, 2),
        "hazard_class": hazard_class,
    }
