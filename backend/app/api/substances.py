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
           "C3H8", "C4H10", "He", "Ne", "Ar", "Kr", "Xe", "Rn", "F2",
           "N2O", "C2H6", "PH3", "SiH4", "BF3", "BCl3", "NF3", "ClF3",
           "GeH4", "AsH3", "COCl2", "HCN", "CF4", "SF6", "XeF2"}

# Known liquids at STP
_LIQUIDS = {"H2O", "Br2", "Hg", "C2H5OH", "CH3OH", "H2O2", "H2SO4", "HNO3",
            "H3PO4", "CH3COOH", "C3H6O", "CS2", "CCl4", "CHCl3", "CH2Cl2",
            "C6H6", "C7H8", "C3H8O3", "C2H6O2", "C6H14", "C7H16", "C8H18",
            "C4H10O", "C3H7OH", "SOCl2", "PCl3", "TiCl4", "SnCl4"}

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


def _determine_phase(formula: str, elements: dict[str, int] | None = None) -> str:
    """Determine the phase at STP for a given formula."""
    if formula in _GASES:
        return "g"
    if formula in _LIQUIDS:
        return "l"
    if elements is not None:
        c_count = elements.get("C", 0)
        h_count = elements.get("H", 0)
        # Organic liquids: hydrocarbons with 5-16 carbons
        if c_count >= 5 and h_count >= 10 and c_count <= 16:
            return "l"
        # Small organics with oxygen (alcohols, esters, etc.)
        if c_count >= 3 and h_count >= 6 and elements.get("O", 0) >= 1 and c_count <= 12:
            return "l"
    # Noble gases
    if formula in {"He", "Ne", "Ar", "Kr", "Xe", "Rn"}:
        return "g"
    # Acids and ionic compounds in water are typically aqueous
    if formula.startswith("H") and len(formula) > 1 and not formula[1].islower():
        return "aq"
    return "s"


def _determine_color(formula: str, elements: dict[str, int] | None = None) -> str:
    """Determine color for a given formula using heuristic rules."""
    # Check known colors first
    if formula in COMPOUND_COLORS:
        return COMPOUND_COLORS[formula]

    if elements is None:
        return "#cccccc"

    # Transition metal compound colors
    if "Cu" in elements and elements["Cu"] > 0:
        if "S" in elements and "O" in elements:
            return "#4169e1"  # Copper sulfate blue
        if "Cl" in elements:
            return "#008b8b"  # Copper chloride teal-green
        if "O" in elements and elements.get("H", 0) > 0:
            return "#87ceeb"  # Copper hydroxide light blue
        if "O" in elements:
            return "#1a1a1a"  # Copper oxide black
        return "#4169e1"  # General copper compounds blue

    if "Fe" in elements:
        fe_count = elements["Fe"]
        # Fe(III) compounds tend to be brown/rust
        if "Cl" in elements and elements.get("Cl", 0) >= 3:
            return "#b8860b"  # FeCl3 dark goldenrod
        if "O" in elements and "H" in elements:
            return "#8b4513"  # Fe(OH)3 rust brown
        if "O" in elements and fe_count >= 2:
            return "#8b4513"  # Fe2O3 rust
        # Fe(II) compounds tend to be green
        return "#90ee90"  # Light green

    if "Co" in elements:
        if "Cl" in elements:
            return "#ff69b4"  # Cobalt chloride pink
        return "#4169e1"  # Cobalt blue

    if "Ni" in elements:
        return "#00cc00"  # Nickel green

    if "Cr" in elements:
        if "O" in elements and elements.get("Cr", 0) >= 2:
            return "#ff8c00"  # Dichromate orange
        return "#006400"  # Chromium green

    if "Mn" in elements and "O" in elements:
        if elements.get("K", 0) > 0:
            return "#800080"  # Permanganate purple
        return "#1a1a1a"  # MnO2 black

    if "Pb" in elements:
        if "I" in elements:
            return "#ffd700"  # Lead iodide yellow
        if "S" in elements and elements.get("O", 0) == 0:
            return "#1a1a1a"  # PbS black
        if "O" in elements and elements.get("N", 0) == 0 and elements.get("S", 0) == 0:
            return "#ffd700"  # PbO yellow
        return "#f0f0f0"  # White/colorless

    if "Ag" in elements:
        if "I" in elements:
            return "#ffff99"  # AgI yellow
        if "Br" in elements:
            return "#ffffcc"  # AgBr pale yellow
        if "S" in elements and elements.get("O", 0) == 0:
            return "#1a1a1a"  # Ag2S black
        return "#f5f5f5"  # White/silver

    if "Zn" in elements:
        if "S" in elements and elements.get("O", 0) == 0:
            return "#f0f0f0"  # ZnS white
        return "#e8e8e8"  # Zinc compounds colorless

    if "Cd" in elements:
        if "S" in elements:
            return "#ffd700"  # CdS yellow
        return "#f0f0f0"

    if "Hg" in elements:
        if "S" in elements:
            return "#ff0000"  # HgS cinnabar red
        if "O" in elements:
            return "#ff4500"  # HgO red/orange
        return "#c0c0c0"  # Mercury silver

    if "Bi" in elements:
        return "#ffffcc"  # Bismuth compounds yellowish

    # Halogen colors
    if "I" in elements and len(elements) == 1:
        return "#4b0082"  # Iodine purple
    if "Br" in elements and len(elements) == 1:
        return "#8b0000"  # Bromine dark red

    # Sulfur compounds
    if "S" in elements and len(elements) == 1:
        return "#ffff00"  # Sulfur yellow

    # Organic compounds
    if "C" in elements and "H" in elements:
        return "#e8e8e8"  # Organic — nearly colorless

    # Ionic/inorganic — default white/colorless
    return "#cccccc"


def _determine_hazard(formula: str, elements: dict[str, int] | None = None) -> str:
    """Determine hazard class for a formula using heuristic rules."""
    if formula in _HAZARD_LOOKUP:
        return _HAZARD_LOOKUP[formula]

    if elements is None:
        return "none"

    # Cyanides, arsenic, mercury, lead, cadmium — toxic (check first, these override corrosive)
    if "CN" in formula and formula not in ("KSCN", "NaSCN"):
        return "toxic"
    if any(e in elements for e in ("As", "Hg", "Pb", "Cd", "Tl", "Be")):
        return "toxic"

    # Strong acids — only true H-acids (check formula is an acid, not a metal compound starting with H)
    _ACID_FORMULAS = {"HF", "HCl", "HBr", "HI", "H2SO4", "HNO3", "H3PO4",
                      "H2CO3", "H2SO3", "H2S", "H2CrO4", "HClO3", "HClO4",
                      "CH3COOH", "HCOOH", "H2C2O4"}
    if formula in _ACID_FORMULAS:
        return "corrosive"
    if "SO4" in formula and formula.startswith("H"):
        return "corrosive"

    # Bases with OH
    if "OH" in formula and any(
        m in elements for m in ("Na", "K", "Li", "Ca", "Ba")
    ):
        return "corrosive"

    # Halogens
    if formula in ("F2", "Cl2", "Br2"):
        return "toxic"

    # Carbon monoxide, hydrogen sulfide
    if formula in ("CO", "H2S", "NO2", "SO2", "PH3", "AsH3", "COCl2", "HCN"):
        return "toxic"

    # Oxidizers: nitrates, perchlorates, permanganates, peroxides, dichromates
    if "NO3" in formula and not formula.startswith("H"):
        return "oxidizer"
    if "ClO3" in formula or "ClO4" in formula:
        return "oxidizer"
    if "MnO4" in formula:
        return "oxidizer"
    if "Cr2O7" in formula or "CrO4" in formula:
        return "oxidizer"
    if "O2" in formula and formula not in ("CO2", "SO2", "NO2"):
        return "oxidizer"

    # Flammable: pure hydrocarbons, alkali metals, metal hydrides
    if "C" in elements and "H" in elements and elements.get("O", 0) == 0:
        return "flammable"
    if formula in ("Na", "K", "Li", "Rb", "Cs"):
        return "reactive"
    if "H" in elements and len(elements) == 2 and any(
        m in elements for m in ("Na", "K", "Li", "Ca", "Al")
    ):
        return "flammable"

    # Alcohols and ethers
    if "C" in elements and "H" in elements and "O" in elements:
        c = elements.get("C", 0)
        h = elements.get("H", 0)
        o = elements.get("O", 0)
        if c <= 4 and o <= 1 and h >= c * 2:
            return "flammable"

    return "none"


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

    phase = _determine_phase(formula, elements)
    color = _determine_color(formula, elements)
    hazard_class = _determine_hazard(formula, elements)

    return {
        "formula": formula,
        "name": name,
        "phase": phase,
        "color": color,
        "molar_mass": round(molar_mass, 2),
        "hazard_class": hazard_class,
    }
