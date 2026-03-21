"""Generate precomputed 3D structures for common molecules.

Usage:
    cd backend && source venv/Scripts/activate
    python -m app.scripts.generate_structures
"""

import json
from pathlib import Path

from app.engine.structure_generator import StructureGenerator

COMMON_MOLECULES = {
    "H2O": "O", "CO2": "O=C=O", "NH3": "N", "CH4": "C",
    "C2H5OH": "CCO", "H2O2": "OO", "HCl": "Cl", "HF": "F",
    "H2SO4": "OS(=O)(=O)O", "HNO3": "O[N+](=O)[O-]",
    "CH3COOH": "CC(=O)O", "C6H6": "c1ccccc1",
    "C2H4": "C=C", "C2H2": "C#C", "CH3OH": "CO",
    "C3H8": "CCC", "CH2O": "C=O", "HCOOH": "O=CO",
    "N2": "N#N", "O2": "O=O", "Cl2": "ClCl", "H2": "[H][H]",
}

OUTPUT_PATH = Path(__file__).parent.parent / "data" / "common_structures.json"


def main() -> None:
    gen = StructureGenerator()
    results: dict[str, dict] = {}

    for formula, smiles in COMMON_MOLECULES.items():
        mol_data = gen.generate(smiles, "smiles")
        if mol_data is None:
            print(f"WARNING: Could not generate structure for {formula} ({smiles})")
            continue
        # Override formula with the canonical one from our mapping
        mol_data.formula = formula
        results[formula] = mol_data.model_dump()
        print(f"  OK  {formula}")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(results, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"\nWrote {len(results)} molecules to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
