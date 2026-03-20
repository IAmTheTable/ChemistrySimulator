"""Generate elements.json from the mendeleev library.

Run with:
    cd backend && source venv/Scripts/activate && python -m app.scripts.generate_elements
"""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

from mendeleev import get_all_elements

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
OUTPUT_PATH = DATA_DIR / "elements.json"

# Mapping from mendeleev series names to standardised category strings
SERIES_TO_CATEGORY: dict[str, str] = {
    "Nonmetals": "nonmetal",
    "Noble gases": "noble gas",
    "Alkali metals": "alkali metal",
    "Alkaline earth metals": "alkaline earth metal",
    "Metalloids": "metalloid",
    "Halogens": "halogen",
    "Poor metals": "post-transition metal",
    "Transition metals": "transition metal",
    "Lanthanides": "lanthanide",
    "Actinides": "actinide",
    "Unknown": "unknown",
}

# Crystal structure abbreviation to full name
LATTICE_TO_CRYSTAL: dict[str, str] = {
    "BCC": "body-centered cubic",
    "FCC": "face-centered cubic",
    "HEX": "hexagonal",
    "SC": "simple cubic",
    "TET": "tetragonal",
    "RHL": "rhombohedral",
    "ORC": "orthorhombic",
    "MCL": "monoclinic",
    "DIA": "diamond cubic",
}


def _kelvin_to_celsius(temp_k: float | None) -> float | None:
    """Convert a temperature from Kelvin to Celsius, returning None if input is None."""
    if temp_k is None:
        return None
    return round(temp_k - 273.15, 2)


def _phase_at_stp(melting_k: float | None, boiling_k: float | None) -> str:
    """Determine the phase of an element at standard temperature and pressure (25 C / 298.15 K)."""
    stp_temp = 298.15
    if melting_k is not None and melting_k > stp_temp:
        return "Solid"
    if melting_k is not None and melting_k <= stp_temp:
        if boiling_k is not None and boiling_k > stp_temp:
            return "Liquid"
        if boiling_k is not None and boiling_k <= stp_temp:
            return "Gas"
    # If melting_k is None, we cannot determine precisely; assume Gas for noble gases
    # or use a best guess. Most elements with unknown melting points are synthetic and
    # are expected to be solid.
    if melting_k is None:
        return "Solid"
    return "Gas"


def _shells_from_ec(ec) -> list[int]:
    """Compute electrons per shell from an ElectronicConfiguration object."""
    shells_dict: dict[int, int] = defaultdict(int)
    for (n, _l), count in ec.conf.items():
        shells_dict[n] += count
    if not shells_dict:
        return []
    max_n = max(shells_dict.keys())
    return [shells_dict.get(i, 0) for i in range(1, max_n + 1)]


def _build_element_dict(el) -> dict:
    """Build a dictionary matching the Element Pydantic model from a mendeleev element."""
    # Category from series
    series_str = el.series if el.series else "Unknown"
    category = SERIES_TO_CATEGORY.get(series_str, series_str.lower())

    # Temperatures: mendeleev stores in Kelvin
    melting_k = el.melting_point
    boiling_k = el.boiling_point

    # Electron configuration
    full_ec = str(el.ec)
    semantic_ec = el.econf

    # Electronegativity
    en_pauling = el.en_pauling

    # First ionization energy
    first_ie = el.ionenergies.get(1)

    # Radii (in pm in mendeleev)
    atomic_radius = el.atomic_radius
    covalent_radius = el.covalent_radius
    vdw_radius = el.vdw_radius
    # Round vdw_radius if it's a float with floating point noise
    if vdw_radius is not None:
        vdw_radius = round(vdw_radius, 2)

    # Density
    density = el.density

    # Oxidation states
    oxidation_states = sorted(el.oxistates) if el.oxistates else []

    # Group (None for some lanthanides/actinides)
    group = el.group_id

    # Period and block
    period = el.period
    block = el.block

    # Crystal structure
    lattice = el.lattice_structure
    crystal_structure = LATTICE_TO_CRYSTAL.get(lattice, lattice) if lattice else None

    # Magnetic ordering -- mendeleev does not provide this directly
    magnetic_ordering = None

    # CPK color (hex without #)
    cpk_raw = el.cpk_color
    cpk_hex = cpk_raw.lstrip("#") if cpk_raw else None

    # Isotopes
    isotopes = []
    for iso in el.isotopes:
        if iso.mass is not None:
            isotopes.append({
                "mass_number": iso.mass_number,
                "atomic_mass": round(iso.mass, 10),
                "abundance": round(iso.abundance, 6) if iso.abundance is not None else None,
                "stable": iso.is_stable,
            })

    # Shells
    shells = _shells_from_ec(el.ec)

    # Summary / description
    summary = el.description or el.sources or f"{el.name} is element {el.atomic_number}."

    return {
        "atomic_number": el.atomic_number,
        "symbol": el.symbol,
        "name": el.name,
        "atomic_mass": round(el.atomic_weight, 6) if el.atomic_weight else el.mass,
        "category": category,
        "phase_at_stp": _phase_at_stp(melting_k, boiling_k),
        "electron_configuration": full_ec,
        "electron_configuration_semantic": semantic_ec,
        "electronegativity_pauling": round(en_pauling, 2) if en_pauling is not None else None,
        "first_ionization_energy": round(first_ie, 6) if first_ie is not None else None,
        "atomic_radius": atomic_radius,
        "covalent_radius": covalent_radius,
        "van_der_waals_radius": vdw_radius,
        "melting_point": _kelvin_to_celsius(melting_k),
        "boiling_point": _kelvin_to_celsius(boiling_k),
        "density": density,
        "oxidation_states": oxidation_states,
        "group": group,
        "period": period,
        "block": block,
        "crystal_structure": crystal_structure,
        "magnetic_ordering": magnetic_ordering,
        "cpk_hex_color": cpk_hex,
        "isotopes": isotopes,
        "shells": shells,
        "summary": summary,
    }


def main() -> None:
    """Generate elements.json with data for all 118 elements."""
    print("Fetching all elements from mendeleev...")
    elements = get_all_elements()

    # Sort by atomic number
    elements.sort(key=lambda e: e.atomic_number)

    print(f"Processing {len(elements)} elements...")
    data = []
    for el in elements:
        entry = _build_element_dict(el)
        data.append(entry)
        if el.atomic_number % 20 == 0:
            print(f"  Processed up to Z={el.atomic_number} ({el.symbol})")

    # Ensure output directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    OUTPUT_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Wrote {len(data)} elements to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
