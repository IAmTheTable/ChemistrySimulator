"""Chemical nomenclature engine for IUPAC compound naming.

Generates systematic names for chemical formulas including elements,
binary ionic compounds, polyatomic ion compounds, acids, binary
covalent compounds, bases, and common compounds.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from app.engine.equation_balancer import parse_formula


# ---------------------------------------------------------------------------
# Data tables
# ---------------------------------------------------------------------------

def _load_element_data() -> dict[str, dict]:
    """Load element data from elements.json keyed by symbol."""
    data_path = Path(__file__).resolve().parent.parent / "data" / "elements.json"
    with open(data_path, encoding="utf-8") as f:
        elements_list = json.load(f)
    return {e["symbol"]: e for e in elements_list}


_ELEMENTS = _load_element_data()

# Metal categories in elements.json
_METAL_CATEGORIES = {
    "alkali metal",
    "alkaline earth metal",
    "transition metal",
    "post-transition metal",
    "lanthanide",
    "actinide",
}

# Nonmetal -ide suffixes for binary compounds
_NONMETAL_IDE: dict[str, str] = {
    "F": "Fluoride",
    "Cl": "Chloride",
    "Br": "Bromide",
    "I": "Iodide",
    "O": "Oxide",
    "S": "Sulfide",
    "N": "Nitride",
    "P": "Phosphide",
    "H": "Hydride",
    "Se": "Selenide",
    "Te": "Telluride",
}

# Nonmetal base names for covalent prefix naming
_NONMETAL_BASE_NAME: dict[str, str] = {
    "F": "Fluorine",
    "Cl": "Chlorine",
    "Br": "Bromine",
    "I": "Iodine",
    "O": "Oxygen",
    "S": "Sulfur",
    "N": "Nitrogen",
    "P": "Phosphorus",
    "H": "Hydrogen",
    "C": "Carbon",
    "Se": "Selenium",
    "Si": "Silicon",
    "B": "Boron",
}

# Nonmetal -ide root for covalent naming (e.g., "Chlor" + "ide")
_NONMETAL_IDE_ROOT: dict[str, str] = {
    "F": "Fluor",
    "Cl": "Chlor",
    "Br": "Brom",
    "I": "Iod",
    "O": "Ox",
    "S": "Sulf",
    "N": "Nitr",
    "P": "Phosph",
    "H": "Hydr",
    "C": "Carb",
    "Se": "Selen",
    "Si": "Silic",
    "B": "Bor",
}

# Greek prefixes for covalent compound naming
_GREEK_PREFIXES: dict[int, str] = {
    1: "mono",
    2: "di",
    3: "tri",
    4: "tetra",
    5: "penta",
    6: "hexa",
    7: "hepta",
    8: "octa",
    9: "nona",
    10: "deca",
}

# Polyatomic ions: formula -> (name, charge)
_POLYATOMIC_IONS: dict[str, tuple[str, int]] = {
    "OH": ("Hydroxide", -1),
    "NO3": ("Nitrate", -1),
    "NO2": ("Nitrite", -1),
    "SO4": ("Sulfate", -2),
    "SO3": ("Sulfite", -2),
    "CO3": ("Carbonate", -2),
    "PO4": ("Phosphate", -3),
    "ClO3": ("Chlorate", -1),
    "ClO4": ("Perchlorate", -1),
    "ClO2": ("Chlorite", -1),
    "ClO": ("Hypochlorite", -1),
    "MnO4": ("Permanganate", -1),
    "CrO4": ("Chromate", -2),
    "Cr2O7": ("Dichromate", -2),
    "CH3COO": ("Acetate", -1),
    "C2O4": ("Oxalate", -2),
    "CN": ("Cyanide", -1),
    "NH4": ("Ammonium", 1),
    "C2H3O2": ("Acetate", -1),
    "HCO3": ("Bicarbonate", -1),
    "HSO4": ("Bisulfate", -1),
    "HPO4": ("Hydrogen Phosphate", -2),
    "H2PO4": ("Dihydrogen Phosphate", -1),
    "SCN": ("Thiocyanate", -1),
    "SiO3": ("Silicate", -2),
}

# Acid name overrides (full formula -> name)
_ACID_NAMES: dict[str, str] = {
    "HF": "Hydrofluoric Acid",
    "HCl": "Hydrochloric Acid",
    "HBr": "Hydrobromic Acid",
    "HI": "Hydroiodic Acid",
    "H2S": "Hydrosulfuric Acid",
    "HCN": "Hydrocyanic Acid",
    "H2SO4": "Sulfuric Acid",
    "H2SO3": "Sulfurous Acid",
    "HNO3": "Nitric Acid",
    "HNO2": "Nitrous Acid",
    "H3PO4": "Phosphoric Acid",
    "H2CO3": "Carbonic Acid",
    "HClO4": "Perchloric Acid",
    "HClO3": "Chloric Acid",
    "HClO2": "Chlorous Acid",
    "HClO": "Hypochlorous Acid",
    "CH3COOH": "Acetic Acid",
    "HC2H3O2": "Acetic Acid",
}

# Common name overrides (full formula -> name)
_COMMON_NAMES: dict[str, str] = {
    # Water and simple inorganics
    "H2O": "Water",
    "H2O2": "Hydrogen Peroxide",
    "NH3": "Ammonia",
    "NO": "Nitric Oxide",
    "NO2": "Nitrogen Dioxide",
    "N2O": "Nitrous Oxide",
    "N2O4": "Dinitrogen Tetroxide",
    "N2O5": "Dinitrogen Pentoxide",
    "CO": "Carbon Monoxide",
    "CO2": "Carbon Dioxide",
    "SO2": "Sulfur Dioxide",
    "SO3": "Sulfur Trioxide",
    "O3": "Ozone",
    "PH3": "Phosphine",
    "AsH3": "Arsine",
    "HCN": "Hydrogen Cyanide",
    "H2S": "Hydrogen Sulfide",
    # Common salts and minerals
    "NaCl": "Sodium Chloride (Table Salt)",
    "KCl": "Potassium Chloride",
    "NaHCO3": "Sodium Bicarbonate (Baking Soda)",
    "Na2CO3": "Sodium Carbonate (Washing Soda)",
    "CaCO3": "Calcium Carbonate (Limestone)",
    "CaSO4": "Calcium Sulfate (Gypsum)",
    "MgSO4": "Magnesium Sulfate (Epsom Salt)",
    "NaNO3": "Sodium Nitrate",
    "KNO3": "Potassium Nitrate (Saltpeter)",
    "NH4NO3": "Ammonium Nitrate",
    "NH4Cl": "Ammonium Chloride",
    "(NH4)2SO4": "Ammonium Sulfate",
    "KMnO4": "Potassium Permanganate",
    "K2Cr2O7": "Potassium Dichromate",
    "Na2S2O3": "Sodium Thiosulfate",
    "AgNO3": "Silver Nitrate",
    "BaSO4": "Barium Sulfate",
    "PbI2": "Lead(II) Iodide",
    # Oxides
    "Fe2O3": "Iron(III) Oxide (Rust)",
    "Fe3O4": "Iron(II,III) Oxide (Magnetite)",
    "FeO": "Iron(II) Oxide",
    "Al2O3": "Aluminum Oxide (Alumina)",
    "SiO2": "Silicon Dioxide (Silica)",
    "TiO2": "Titanium Dioxide",
    "CaO": "Calcium Oxide (Quicklime)",
    "MgO": "Magnesium Oxide",
    "ZnO": "Zinc Oxide",
    "CuO": "Copper(II) Oxide",
    "Cu2O": "Copper(I) Oxide",
    "MnO2": "Manganese Dioxide",
    "Na2O": "Sodium Oxide",
    "K2O": "Potassium Oxide",
    "P2O5": "Phosphorus Pentoxide",
    "Cr2O3": "Chromium(III) Oxide",
    # Hydroxides
    "NaOH": "Sodium Hydroxide (Lye)",
    "KOH": "Potassium Hydroxide",
    "Ca(OH)2": "Calcium Hydroxide (Slaked Lime)",
    "MgCl2": "Magnesium Chloride",
    "Mg(OH)2": "Magnesium Hydroxide (Milk of Magnesia)",
    "Al(OH)3": "Aluminum Hydroxide",
    "Fe(OH)3": "Iron(III) Hydroxide",
    "Fe(OH)2": "Iron(II) Hydroxide",
    "Cu(OH)2": "Copper(II) Hydroxide",
    "Ba(OH)2": "Barium Hydroxide",
    # Acids
    "HCl": "Hydrochloric Acid",
    "HF": "Hydrofluoric Acid",
    "HBr": "Hydrobromic Acid",
    "HI": "Hydroiodic Acid",
    "H2SO4": "Sulfuric Acid",
    "H2SO3": "Sulfurous Acid",
    "HNO3": "Nitric Acid",
    "HNO2": "Nitrous Acid",
    "H3PO4": "Phosphoric Acid",
    "H2CO3": "Carbonic Acid",
    "HClO4": "Perchloric Acid",
    "HClO3": "Chloric Acid",
    "HClO": "Hypochlorous Acid",
    "CH3COOH": "Acetic Acid (Vinegar)",
    "HCOOH": "Formic Acid",
    "C6H8O7": "Citric Acid",
    "C4H6O6": "Tartaric Acid",
    "H2C2O4": "Oxalic Acid",
    "C9H8O4": "Aspirin (Acetylsalicylic Acid)",
    "H2SO5": "Peroxymonosulfuric Acid (Caro's Acid)",
    # Special compounds
    "NaClO": "Sodium Hypochlorite (Bleach)",
    "N2H4": "Hydrazine",
    "CH3COONa": "Sodium Acetate",
    # Simple hydrocarbons
    "CH4": "Methane",
    "C2H6": "Ethane",
    "C3H8": "Propane",
    "C4H10": "Butane",
    "C5H12": "Pentane",
    "C6H14": "Hexane",
    "C7H16": "Heptane",
    "C8H18": "Octane",
    "C2H4": "Ethylene (Ethene)",
    "C3H6": "Propylene (Propene)",
    "C2H2": "Acetylene (Ethyne)",
    "C6H6": "Benzene",
    "C7H8": "Toluene",
    "C8H10": "Xylene",
    "C10H8": "Naphthalene",
    "C14H10": "Anthracene",
    # Alcohols
    "CH3OH": "Methanol",
    "C2H5OH": "Ethanol",
    "C3H7OH": "Propanol",
    "C4H9OH": "Butanol",
    "C3H8O3": "Glycerol",
    "C2H6O2": "Ethylene Glycol",
    "C6H5OH": "Phenol",
    # Aldehydes and ketones
    "CH2O": "Formaldehyde",
    "C2H4O": "Acetaldehyde",
    "C3H6O": "Acetone",
    # Carboxylic acids and esters
    "C2H4O2": "Acetic Acid",
    "C3H6O2": "Methyl Acetate",
    "C4H8O2": "Ethyl Acetate",
    # Sugars and biological molecules
    "C6H12O6": "Glucose",
    "C12H22O11": "Sucrose (Table Sugar)",
    "C6H10O5": "Starch (monomer)",
    "C27H46O": "Cholesterol",
    "C8H10N4O2": "Caffeine",
    "C10H14N2": "Nicotine",
    "C17H21NO4": "Cocaine",
    "C21H30O2": "THC (Tetrahydrocannabinol)",
    "C20H25N3O": "LSD (Lysergic Acid Diethylamide)",
    "C12H16N2": "N,N-Dimethyltryptamine (DMT)",
    "C10H15N": "Methamphetamine",
    "C9H13NO3": "Epinephrine (Adrenaline)",
    "C8H11NO2": "Dopamine",
    "C10H12N2O": "Serotonin",
    "C11H12N2O2": "Tryptophan",
    "C9H11NO2": "Phenylalanine",
    "C6H13NO2": "Leucine",
    "C5H9NO2": "Proline",
    "C3H7NO2": "Alanine",
    "C2H5NO2": "Glycine",
    "C5H9NO4": "Glutamic Acid",
    # Polymers and materials
    "C2H3Cl": "Vinyl Chloride (PVC monomer)",
    "C3H3N": "Acrylonitrile",
    "C8H8": "Styrene",
    "C2H4O": "Ethylene Oxide",
    # Solvents and industrial
    "CCl4": "Carbon Tetrachloride",
    "CHCl3": "Chloroform",
    "CH2Cl2": "Dichloromethane",
    "C2HCl3": "Trichloroethylene",
    "CS2": "Carbon Disulfide",
    "(CH3)2SO": "Dimethyl Sulfoxide (DMSO)",
    "C4H8O": "Tetrahydrofuran (THF)",
    "C5H5N": "Pyridine",
    "C4H4O": "Furan",
    # Pharmaceuticals
    "C13H18O2": "Ibuprofen",
    "C8H9NO2": "Acetaminophen (Tylenol)",
    "C16H13ClN2O": "Diazepam (Valium)",
    "C17H19NO3": "Morphine",
    "C21H23NO5": "Heroin (Diacetylmorphine)",
    "C22H26N2O4S": "Penicillin V",
    "C10H13N5O4": "Adenosine",
    # Vitamins
    "C6H8O6": "Vitamin C (Ascorbic Acid)",
    "C20H30O": "Vitamin A (Retinol)",
    "C31H46O2": "Vitamin E (alpha-Tocopherol)",
    # Explosives and energetics
    "C3H5N3O9": "Nitroglycerin",
    "C7H5N3O6": "TNT (Trinitrotoluene)",
    "C4H8N8O8": "HMX",
    "CH4N2O": "Urea",
    # Dyes and indicators
    "C20H14O4": "Phenolphthalein",
    "C14H14N3NaO3S": "Methyl Orange",
    # Metal complexes and coordination compounds
    "CuSO4": "Copper(II) Sulfate",
    "FeSO4": "Iron(II) Sulfate",
    "ZnSO4": "Zinc Sulfate",
    "CuCl2": "Copper(II) Chloride",
    "FeCl3": "Iron(III) Chloride",
    "FeCl2": "Iron(II) Chloride",
    "ZnCl2": "Zinc Chloride",
    "SnCl2": "Tin(II) Chloride",
    "PbCl2": "Lead(II) Chloride",
    "HgCl2": "Mercury(II) Chloride",
    "NiCl2": "Nickel(II) Chloride",
    "CoCl2": "Cobalt(II) Chloride",
    "MnCl2": "Manganese(II) Chloride",
    "CrCl3": "Chromium(III) Chloride",
    "AlCl3": "Aluminum Chloride",
    "Pb(NO3)2": "Lead(II) Nitrate",
    "Cu(NO3)2": "Copper(II) Nitrate",
    "Zn(NO3)2": "Zinc Nitrate",
    "Fe(NO3)3": "Iron(III) Nitrate",
    "Na2SO4": "Sodium Sulfate",
    "K2SO4": "Potassium Sulfate",
    "BaCl2": "Barium Chloride",
    "CaCl2": "Calcium Chloride",
    "Na2S": "Sodium Sulfide",
    "FeS": "Iron(II) Sulfide",
    "ZnS": "Zinc Sulfide",
    "PbS": "Lead(II) Sulfide (Galena)",
    "CuS": "Copper(II) Sulfide",
    "Ag2S": "Silver Sulfide (Tarnish)",
    "HgS": "Mercury(II) Sulfide (Cinnabar)",
}

# Transition metals and other metals that need Roman numerals
# (metals with multiple common oxidation states)
_VARIABLE_OXIDATION_METALS: set[str] = {
    "Fe", "Cu", "Co", "Ni", "Mn", "Cr", "V", "Ti",
    "Sn", "Pb", "Au", "Hg", "Pt", "W", "Mo",
}

# Roman numeral lookup
_ROMAN_NUMERALS: dict[int, str] = {
    1: "I", 2: "II", 3: "III", 4: "IV", 5: "V",
    6: "VI", 7: "VII", 8: "VIII",
}

# Diatomic elements (exist as X2 in elemental form)
_DIATOMIC_ELEMENTS: set[str] = {"H", "N", "O", "F", "Cl", "Br", "I"}


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def _is_metal(symbol: str) -> bool:
    """Check if an element is a metal based on its category."""
    elem = _ELEMENTS.get(symbol)
    if elem is None:
        return False
    return elem.get("category", "") in _METAL_CATEGORIES


def _element_name(symbol: str) -> str:
    """Get the name of an element by symbol."""
    elem = _ELEMENTS.get(symbol)
    if elem is None:
        return symbol
    return elem["name"]


def _get_default_anion_charge(symbol: str) -> int:
    """Get the typical charge of a nonmetal anion."""
    charges: dict[str, int] = {
        "F": -1, "Cl": -1, "Br": -1, "I": -1,
        "O": -2, "S": -2, "Se": -2, "Te": -2,
        "N": -3, "P": -3,
        "H": -1,
    }
    return charges.get(symbol, -1)


def _parse_formula_to_elements(formula: str) -> list[tuple[str, int]]:
    """Parse a formula into an ordered list of (element, count) pairs.

    Unlike parse_formula from equation_balancer which returns a dict,
    this preserves element order (important for nomenclature).
    """
    tokens = _tokenize_formula(formula)
    result, _ = _parse_token_list(tokens, 0)
    return result


def _tokenize_formula(formula: str) -> list[str]:
    """Tokenize a chemical formula into elements, numbers, and parens."""
    tokens: list[str] = []
    i = 0
    while i < len(formula):
        if formula[i] == "(":
            tokens.append("(")
            i += 1
        elif formula[i] == ")":
            tokens.append(")")
            i += 1
        elif formula[i].isupper():
            symbol = formula[i]
            i += 1
            while i < len(formula) and formula[i].islower():
                symbol += formula[i]
                i += 1
            tokens.append(symbol)
        elif formula[i].isdigit():
            num_str = ""
            while i < len(formula) and formula[i].isdigit():
                num_str += formula[i]
                i += 1
            tokens.append(num_str)
        else:
            i += 1
    return tokens


def _parse_token_list(
    tokens: list[str], pos: int
) -> tuple[list[tuple[str, int]], int]:
    """Parse tokens into an ordered list of (element, count) tuples."""
    result: list[tuple[str, int]] = []
    i = pos
    while i < len(tokens):
        token = tokens[i]
        if token == "(":
            sub, i = _parse_token_list(tokens, i + 1)
            if i < len(tokens) and tokens[i].isdigit():
                mult = int(tokens[i])
                i += 1
            else:
                mult = 1
            for elem, count in sub:
                result.append((elem, count * mult))
        elif token == ")":
            return result, i + 1
        elif token[0].isupper():
            elem = token
            if i + 1 < len(tokens) and tokens[i + 1].isdigit():
                num = int(tokens[i + 1])
                i += 2
            else:
                num = 1
                i += 1
            result.append((elem, num))
        else:
            i += 1
    return result, i


def _merge_element_counts(
    elements: list[tuple[str, int]],
) -> dict[str, int]:
    """Merge ordered element list into a dict of total counts."""
    counts: dict[str, int] = {}
    for elem, count in elements:
        counts[elem] = counts.get(elem, 0) + count
    return counts


def _try_match_polyatomic(
    formula: str, cation_symbol: str, cation_count: int
) -> str | None:
    """Try to identify the formula as a metal + polyatomic ion compound.

    Returns the compound name if a polyatomic ion match is found, else None.
    """
    # Remove the cation portion from the formula to get the anion portion
    # Parse the full formula
    full_counts = parse_formula(formula)

    # Subtract the cation
    remaining = dict(full_counts)
    remaining[cation_symbol] = remaining.get(cation_symbol, 0) - cation_count
    if remaining[cation_symbol] <= 0:
        del remaining[cation_symbol]

    # Try each polyatomic ion
    for ion_formula, (ion_name, ion_charge) in _POLYATOMIC_IONS.items():
        if ion_charge > 0:
            continue  # skip cations like NH4+
        ion_counts = parse_formula(ion_formula)

        # Determine how many of this polyatomic ion fit into the remaining
        # All elements in the ion must be present in remaining
        if not all(elem in remaining for elem in ion_counts):
            continue

        # Find the multiplier (how many polyatomic ions)
        ratios = []
        for elem, count in ion_counts.items():
            if remaining.get(elem, 0) == 0:
                break
            ratios.append(remaining[elem] / count)
        else:
            if len(ratios) > 0 and all(
                abs(r - ratios[0]) < 0.01 for r in ratios
            ):
                n_ions = int(round(ratios[0]))
                # Verify this accounts for all remaining atoms
                test_remaining = dict(remaining)
                for elem, count in ion_counts.items():
                    test_remaining[elem] = test_remaining.get(elem, 0) - count * n_ions
                # All should be zero
                if all(v == 0 for v in test_remaining.values()):
                    # Calculate cation charge
                    total_anion_charge = ion_charge * n_ions
                    cation_charge = -total_anion_charge // cation_count

                    metal_name = _element_name(cation_symbol)
                    if cation_symbol in _VARIABLE_OXIDATION_METALS:
                        roman = _ROMAN_NUMERALS.get(cation_charge, str(cation_charge))
                        return f"{metal_name}({roman}) {ion_name}"
                    return f"{metal_name} {ion_name}"

    return None


# ---------------------------------------------------------------------------
# Main public function
# ---------------------------------------------------------------------------

def name_compound(formula: str) -> str:
    """Generate an IUPAC-style name for a chemical formula.

    Args:
        formula: A chemical formula string (e.g., "NaCl", "H2O", "FeCl3").

    Returns:
        The systematic name of the compound (e.g., "Sodium Chloride").
    """
    # 1. Check common name overrides first
    if formula in _COMMON_NAMES:
        return _COMMON_NAMES[formula]

    # 2. Check acid overrides
    if formula in _ACID_NAMES:
        return _ACID_NAMES[formula]

    # 3. Parse the formula
    elements = _parse_formula_to_elements(formula)
    counts = _merge_element_counts(elements)

    # 4. Check if it's a pure element
    if len(counts) == 1:
        symbol = next(iter(counts))
        return _element_name(symbol)

    # 5. Get the ordered unique elements
    ordered_symbols = []
    for sym, _ in elements:
        if sym not in ordered_symbols:
            ordered_symbols.append(sym)

    first_symbol = ordered_symbols[0]

    # 6. Check if it's an acid (starts with H, not already caught by overrides)
    if first_symbol == "H" and len(counts) >= 2 and formula not in _COMMON_NAMES:
        acid_name = _try_name_acid(formula, counts)
        if acid_name:
            return acid_name

    # 7. Check if first element is a metal -> ionic compound
    if _is_metal(first_symbol):
        return _name_ionic(formula, elements, counts, ordered_symbols)

    # 8. Otherwise -> covalent compound
    return _name_covalent(elements, counts, ordered_symbols)


def _try_name_acid(formula: str, counts: dict[str, int]) -> str | None:
    """Try to name the formula as an acid."""
    # Already checked _ACID_NAMES in the main function; this handles
    # any remaining acids by analyzing the anion
    # Remove H from the formula to find the anion
    remaining = dict(counts)
    h_count = remaining.pop("H", 0)
    if h_count == 0:
        return None

    # Check if remaining matches a polyatomic ion
    for ion_formula, (ion_name, _) in _POLYATOMIC_IONS.items():
        ion_counts = parse_formula(ion_formula)
        if ion_counts == remaining:
            # Convert polyatomic ion name to acid name
            # -ate -> -ic acid, -ite -> -ous acid
            if ion_name.endswith("ate"):
                acid_root = ion_name[:-3]
                return f"{acid_root}ic Acid"
            elif ion_name.endswith("ite"):
                acid_root = ion_name[:-3]
                return f"{acid_root}ous Acid"

    # Check if it's a binary acid (H + nonmetal)
    if len(remaining) == 1:
        anion_symbol = next(iter(remaining))
        if anion_symbol in _NONMETAL_IDE_ROOT:
            root = _NONMETAL_IDE_ROOT[anion_symbol].lower()
            return f"Hydro{root}ic Acid"

    return None


def _name_ionic(
    formula: str,
    elements: list[tuple[str, int]],
    counts: dict[str, int],
    ordered_symbols: list[str],
) -> str:
    """Name an ionic compound (metal + anion)."""
    cation_symbol = ordered_symbols[0]
    cation_count = counts[cation_symbol]

    # Try polyatomic ion match first
    poly_name = _try_match_polyatomic(formula, cation_symbol, cation_count)
    if poly_name:
        return poly_name

    # Binary ionic: metal + single nonmetal
    if len(ordered_symbols) == 2:
        anion_symbol = ordered_symbols[1]
        anion_count = counts[anion_symbol]
        anion_charge = _get_default_anion_charge(anion_symbol)

        # Calculate cation charge
        total_anion_charge = anion_charge * anion_count
        cation_charge = -total_anion_charge // cation_count

        metal_name = _element_name(cation_symbol)
        anion_name = _NONMETAL_IDE.get(anion_symbol, anion_symbol + "ide")

        if cation_symbol in _VARIABLE_OXIDATION_METALS:
            roman = _ROMAN_NUMERALS.get(cation_charge, str(cation_charge))
            return f"{metal_name}({roman}) {anion_name}"
        return f"{metal_name} {anion_name}"

    # Fallback: just list elements
    return _fallback_name(counts, ordered_symbols)


def _name_organic(counts: dict[str, int]) -> str:
    """Name an organic compound based on its molecular formula.

    Classifies compounds by functional group using element ratios
    and degree of unsaturation to produce a systematic name.
    """
    c = counts.get("C", 0)
    h = counts.get("H", 0)
    o = counts.get("O", 0)
    n = counts.get("N", 0)
    s = counts.get("S", 0)
    cl = counts.get("Cl", 0)
    br = counts.get("Br", 0)
    f_count = counts.get("F", 0)

    # Carbon chain prefix
    _CARBON_PREFIX = {
        1: "meth", 2: "eth", 3: "prop", 4: "but",
        5: "pent", 6: "hex", 7: "hept", 8: "oct",
        9: "non", 10: "dec", 11: "undec", 12: "dodec",
        13: "tridec", 14: "tetradec", 15: "pentadec",
        16: "hexadec", 17: "heptadec", 18: "octadec",
        19: "nonadec", 20: "icos",
    }

    prefix = _CARBON_PREFIX.get(c, f"C{c}")

    # Degree of unsaturation = (2C + 2 + N - H - halogen) / 2
    halogens = cl + br + f_count
    dou = (2 * c + 2 + n - h - halogens) / 2

    # Only C and H
    if set(counts.keys()) <= {"C", "H"}:
        if h == 2 * c + 2:
            return f"{prefix.capitalize()}ane"        # Alkane: CnH(2n+2)
        elif h == 2 * c:
            return f"{prefix.capitalize()}ene"        # Alkene: CnH(2n)
        elif h == 2 * c - 2:
            if dou >= 4 and c >= 6:
                return f"{prefix.capitalize()}yl Aromatic"
            return f"{prefix.capitalize()}yne"        # Alkyne: CnH(2n-2)
        elif dou >= 4:
            return f"Aromatic Hydrocarbon (C{c}H{h})"
        else:
            return f"Hydrocarbon (C{c}H{h})"

    # C, H, O compounds
    if set(counts.keys()) <= {"C", "H", "O"}:
        if o == 1 and h == 2 * c + 2:
            return f"{prefix.capitalize()}anol"       # Alcohol: CnH(2n+1)OH
        if o == 1 and h == 2 * c:
            if c == 1:
                return "Formaldehyde"
            return f"{prefix.capitalize()}anal"       # Aldehyde
        if o == 1 and h == 2 * c and c >= 3:
            return f"{prefix.capitalize()}anone"      # Ketone
        if o == 2 and h == 2 * c:
            return f"{prefix.capitalize()}anoic Acid" # Carboxylic acid
        if o == 2 and h == 2 * c + 2 and c >= 2:
            return f"{prefix.capitalize()}yl Ester"
        if o >= 3 and h >= 2 * c:
            return f"Polyhydroxy Compound (C{c}H{h}O{o})"
        return f"Oxygenated Organic Compound (C{c}H{h}O{o})"

    # C, H, N compounds
    if set(counts.keys()) <= {"C", "H", "N"}:
        if n == 1 and h == 2 * c + 3:
            return f"{prefix.capitalize()}amine"      # Primary amine
        if n == 1:
            return f"Nitrogen Heterocycle (C{c}H{h}N)"
        if n == 2:
            return f"Diamine/Diazine (C{c}H{h}N{n})"
        if n >= 3:
            return f"Polynitrogen Compound (C{c}H{h}N{n})"

    # C, H, O, N compounds
    if set(counts.keys()) <= {"C", "H", "O", "N"}:
        if n >= 1 and o >= 1:
            if n == 1 and o == 2:
                return f"Amino Acid or Nitro Compound (C{c}H{h}NO{o})"
            return f"Organic Compound (C{c}H{h}N{n}O{o})"

    # C, H, halogen compounds
    if cl > 0 or br > 0 or f_count > 0:
        halogen_names = []
        if f_count > 0:
            f_prefix = {1: "", 2: "di", 3: "tri", 4: "tetra"}.get(f_count, str(f_count) + "-")
            halogen_names.append(f"{f_prefix}fluoro")
        if cl > 0:
            cl_prefix = {1: "", 2: "di", 3: "tri", 4: "tetra"}.get(cl, str(cl) + "-")
            halogen_names.append(f"{cl_prefix}chloro")
        if br > 0:
            br_prefix = {1: "", 2: "di", 3: "tri", 4: "tetra"}.get(br, str(br) + "-")
            halogen_names.append(f"{br_prefix}bromo")
        halogen_str = ",".join(halogen_names)
        return f"{halogen_str.capitalize()}{prefix}ane"

    # C, H, S compounds
    if s > 0:
        if s == 1 and o == 0:
            return f"{prefix.capitalize()}anethiol"
        return f"Sulfur Organic Compound (C{c}H{h}S{s})"

    # General organic fallback -- still much better than listing element names
    formula_parts = []
    for sym in ["C", "H", "N", "O", "S", "P", "F", "Cl", "Br", "I"]:
        if sym in counts:
            formula_parts.append(f"{sym}{counts[sym]}" if counts[sym] > 1 else sym)
    # Include any remaining elements not in the standard list
    for sym in counts:
        if sym not in {"C", "H", "N", "O", "S", "P", "F", "Cl", "Br", "I"}:
            formula_parts.append(f"{sym}{counts[sym]}" if counts[sym] > 1 else sym)
    return f"Organic Compound ({''.join(formula_parts)})"


def _name_covalent(
    elements: list[tuple[str, int]],
    counts: dict[str, int],
    ordered_symbols: list[str],
) -> str:
    """Name a covalent compound using Greek prefix system or organic naming."""
    # If organic (contains C), use organic naming
    if "C" in counts:
        return _name_organic(counts)

    # Binary covalent (existing logic for non-organic)
    if len(ordered_symbols) != 2:
        return _fallback_name(counts, ordered_symbols)

    first = ordered_symbols[0]
    second = ordered_symbols[1]
    first_count = counts[first]
    second_count = counts[second]

    # First element: use prefix only if count > 1 (no mono- on first element)
    first_name = _NONMETAL_BASE_NAME.get(first, _element_name(first))
    if first_count > 1:
        prefix = _GREEK_PREFIXES.get(first_count, "")
        first_part = prefix.capitalize() + first_name.lower()
    else:
        first_part = first_name

    # Second element: always use prefix, use -ide suffix
    second_root = _NONMETAL_IDE_ROOT.get(second, _element_name(second)[:4].lower())
    prefix2 = _GREEK_PREFIXES.get(second_count, "")

    # Handle vowel elision: drop trailing 'a' or 'o' from prefix before
    # "oxide" or "ide" starting with vowel
    if prefix2.endswith("a") and second_root.startswith(("O", "o")):
        prefix2 = prefix2[:-1]
    if prefix2.endswith("o") and second_root.startswith(("O", "o")):
        prefix2 = prefix2[:-1]

    second_part = prefix2.capitalize() + second_root.lower() + "ide"

    return f"{first_part} {second_part}"


def _fallback_name(counts: dict[str, int], ordered_symbols: list[str]) -> str:
    """Generate a descriptive name for unrecognized compounds.

    Uses Greek prefixes for element counts > 1 to produce a more
    informative name than simply listing element names.
    """
    parts = []
    for sym in ordered_symbols:
        name = _element_name(sym)
        count = counts[sym]
        if count > 1:
            prefix = _GREEK_PREFIXES.get(count, str(count) + "-")
            parts.append(f"{prefix}{name.lower()}")
        else:
            parts.append(name)

    # Join with spaces, capitalize properly
    return " ".join(parts).title()
