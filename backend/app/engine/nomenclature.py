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
    "H2O": "Water",
    "NH3": "Ammonia",
    "CH4": "Methane",
    "C2H5OH": "Ethanol",
    "CH3OH": "Methanol",
    "H2O2": "Hydrogen Peroxide",
    "C6H12O6": "Glucose",
    "C12H22O11": "Sucrose",
    "NaHCO3": "Sodium Bicarbonate",
    "CaCO3": "Calcium Carbonate",
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


def _name_covalent(
    elements: list[tuple[str, int]],
    counts: dict[str, int],
    ordered_symbols: list[str],
) -> str:
    """Name a binary covalent compound using Greek prefix system."""
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
    """Fallback naming: just use element names."""
    parts = []
    for sym in ordered_symbols:
        parts.append(_element_name(sym))
    return " ".join(parts)
