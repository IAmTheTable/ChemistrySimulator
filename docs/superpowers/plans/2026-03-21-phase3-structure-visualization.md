# Phase 3: Structure & Visualization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3D molecular structure visualization — users can view any molecule in ball-and-stick, CPK, wireframe, or orbital mode via a dedicated structure viewer panel powered by RDKit on the backend.

**Architecture:** Backend uses RDKit to generate 3D conformers (atom positions + bonds) and serves them via REST API. A precomputed cache handles common molecules. Orbital data is computed from quantum numbers. Frontend renders molecules using custom R3F components (spheres for atoms, cylinders for bonds, parametric meshes for orbitals) in a new Structure tab.

**Tech Stack:** RDKit (rdkit-pypi), FastAPI, R3F sphereGeometry/cylinderGeometry, @react-three/drei (Html, Text, OrbitControls)

---

## File Structure

### Backend (New)

```
backend/app/
├── models/
│   └── structure.py              — AtomData, BondData, MoleculeData, OrbitalData Pydantic models
├── engine/
│   ├── structure_generator.py    — RDKit wrapper: SMILES/formula → 3D atom positions + bonds
│   └── orbital_calculator.py     — Quantum number → orbital shape parameters
├── api/
│   └── structures.py             — POST /generate, GET /common/{formula}, GET /orbitals/{number}
└── data/
    └── common_structures.json    — Precomputed 3D data for ~50 molecules
```

### Frontend (New/Modified)

```
frontend/src/
├── types/
│   └── structure.ts              — MoleculeData, AtomData, BondData, OrbitalData interfaces
├── api/
│   └── structures.ts             — useStructure(), useCommonStructure(), useOrbitals() hooks
├── stores/
│   └── labStore.ts               — MODIFIED: add structureViewer state
├── components/
│   ├── ui/
│   │   └── StructurePanel.tsx    — Structure tab: mode toggles + info display
│   └── viewer/
│       ├── MoleculeViewer.tsx    — R3F canvas: renders molecule in active mode
│       ├── AtomSphere.tsx        — Single atom: colored sphere + click tooltip
│       ├── BondCylinder.tsx      — Bond between atoms: cylinder(s) for single/double/triple
│       ├── OrbitalMesh.tsx       — Orbital shape: s/p/d parametric translucent mesh
│       └── MoleculeLabels.tsx    — Element symbol text labels on atoms
```

---

## Task 1: Structure Pydantic Models

**Files:**
- Create: `backend/app/models/structure.py`
- Create: `backend/tests/test_structure_models.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_structure_models.py`:
```python
from app.models.structure import AtomData, BondData, MoleculeData, OrbitalInfo, OrbitalData


def test_atom_data():
    atom = AtomData(index=0, symbol="O", x=0.0, y=0.0, z=0.0, color="#FF0000", radius=0.73)
    assert atom.symbol == "O"
    assert atom.color == "#FF0000"


def test_bond_data():
    bond = BondData(atom1=0, atom2=1, order=2)
    assert bond.order == 2


def test_molecule_data():
    mol = MoleculeData(
        formula="H2O",
        name="Water",
        atoms=[
            AtomData(index=0, symbol="O", x=0.0, y=0.0, z=0.0, color="#FF0000", radius=0.73),
            AtomData(index=1, symbol="H", x=0.96, y=0.0, z=0.0, color="#FFFFFF", radius=0.31),
            AtomData(index=2, symbol="H", x=-0.24, y=0.93, z=0.0, color="#FFFFFF", radius=0.31),
        ],
        bonds=[
            BondData(atom1=0, atom2=1, order=1),
            BondData(atom1=0, atom2=2, order=1),
        ],
        properties={"molecular_weight": 18.015, "geometry": "bent", "polar": True},
    )
    assert mol.formula == "H2O"
    assert len(mol.atoms) == 3
    assert len(mol.bonds) == 2


def test_orbital_data():
    orb = OrbitalInfo(n=2, l=1, label="2p", electrons=2, shape="dumbbell", radius=1.5,
                      orientations=["x", "y", "z"])
    assert orb.shape == "dumbbell"
    data = OrbitalData(element="Carbon", atomic_number=6,
                       electron_configuration="1s2 2s2 2p2", orbitals=[orb])
    assert len(data.orbitals) == 1
```

- [ ] **Step 2: Run tests — expect fail**

- [ ] **Step 3: Implement models**

Create `backend/app/models/structure.py`:
```python
from pydantic import BaseModel


class AtomData(BaseModel):
    index: int
    symbol: str
    x: float
    y: float
    z: float
    color: str
    radius: float


class BondData(BaseModel):
    atom1: int
    atom2: int
    order: int  # 1=single, 2=double, 3=triple


class MoleculeData(BaseModel):
    formula: str
    name: str
    atoms: list[AtomData]
    bonds: list[BondData]
    properties: dict = {}


class OrbitalInfo(BaseModel):
    n: int
    l: int
    label: str
    electrons: int
    shape: str  # "sphere", "dumbbell", "cloverleaf", "complex"
    radius: float
    orientations: list[str] = []


class OrbitalData(BaseModel):
    element: str
    atomic_number: int
    electron_configuration: str
    orbitals: list[OrbitalInfo]
```

- [ ] **Step 4: Run tests — expect pass**

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/structure.py backend/tests/test_structure_models.py
git commit -m "feat: add MoleculeData and OrbitalData Pydantic models"
```

---

## Task 2: Install RDKit & Structure Generator

**Files:**
- Modify: `backend/pyproject.toml` — add rdkit-pypi
- Create: `backend/app/engine/structure_generator.py`
- Create: `backend/tests/test_structure_generator.py`

- [ ] **Step 1: Add RDKit dependency**

Add `"rdkit-pypi>=2024.3.0"` to the dependencies in `backend/pyproject.toml`. Then:
```bash
cd backend && source venv/Scripts/activate && pip install -e ".[dev]"
```

Verify: `python -c "from rdkit import Chem; print('RDKit OK')"`

NOTE: If `rdkit-pypi` fails to install on Windows, try `pip install rdkit` instead. The package name varies by platform.

- [ ] **Step 2: Write failing tests**

Create `backend/tests/test_structure_generator.py`:
```python
from app.engine.structure_generator import StructureGenerator
from app.models.structure import MoleculeData


def test_generate_from_smiles():
    gen = StructureGenerator()
    mol = gen.generate(input_str="O", input_type="smiles")  # Water
    assert isinstance(mol, MoleculeData)
    assert mol.formula == "H2O"
    assert len(mol.atoms) == 3  # O + 2H
    assert len(mol.bonds) == 2


def test_generate_ethanol():
    gen = StructureGenerator()
    mol = gen.generate(input_str="CCO", input_type="smiles")
    assert isinstance(mol, MoleculeData)
    assert any(a.symbol == "O" for a in mol.atoms)
    assert any(a.symbol == "C" for a in mol.atoms)


def test_generate_co2():
    gen = StructureGenerator()
    mol = gen.generate(input_str="O=C=O", input_type="smiles")
    assert isinstance(mol, MoleculeData)
    assert any(b.order == 2 for b in mol.bonds)


def test_atoms_have_3d_coordinates():
    gen = StructureGenerator()
    mol = gen.generate(input_str="CCO", input_type="smiles")
    for atom in mol.atoms:
        assert isinstance(atom.x, float)
        assert isinstance(atom.y, float)
        assert isinstance(atom.z, float)


def test_atoms_have_cpk_colors():
    gen = StructureGenerator()
    mol = gen.generate(input_str="O", input_type="smiles")
    o_atom = next(a for a in mol.atoms if a.symbol == "O")
    assert o_atom.color == "#FF0000"


def test_unknown_smiles_raises():
    gen = StructureGenerator()
    try:
        mol = gen.generate(input_str="INVALID", input_type="smiles")
        assert mol is None or len(mol.atoms) == 0
    except ValueError:
        pass  # Also acceptable
```

- [ ] **Step 3: Implement StructureGenerator**

Create `backend/app/engine/structure_generator.py`:

```python
from rdkit import Chem
from rdkit.Chem import AllChem, Descriptors
from app.models.structure import AtomData, BondData, MoleculeData
from app.engine.nomenclature import name_compound

# CPK colors by element symbol
CPK_COLORS = {
    "H": "#FFFFFF", "C": "#909090", "N": "#3050F8", "O": "#FF0000",
    "F": "#90E050", "Cl": "#1FF01F", "Br": "#A62929", "I": "#940094",
    "S": "#FFFF30", "P": "#FF8000", "Na": "#AB5CF2", "K": "#8F40D4",
    "Ca": "#3DFF00", "Mg": "#8AFF00", "Fe": "#E06633", "Cu": "#C88033",
    "Zn": "#7D80B0", "Ag": "#C0C0C0", "Au": "#FFD123", "Al": "#BFA6A6",
    "Si": "#F0C8A0", "B": "#FFB5B5", "Li": "#CC80FF", "Ba": "#00C900",
    "Mn": "#9C7AC7", "Cr": "#8A99C7", "Co": "#F090A0", "Ni": "#50D050",
    "Sn": "#668080", "Pb": "#575961", "Ti": "#BFC2C7", "V": "#A6A6AB",
}

# Covalent radii (Angstroms) for common elements
COVALENT_RADII = {
    "H": 0.31, "C": 0.77, "N": 0.75, "O": 0.73, "F": 0.72,
    "Cl": 0.99, "Br": 1.14, "I": 1.33, "S": 1.02, "P": 1.06,
    "Na": 1.66, "K": 2.03, "Ca": 1.76, "Mg": 1.41, "Fe": 1.25,
    "Cu": 1.32, "Zn": 1.22, "Ag": 1.45, "Au": 1.36, "Al": 1.21,
}


class StructureGenerator:
    def generate(self, input_str: str, input_type: str = "smiles") -> MoleculeData | None:
        if input_type == "smiles":
            mol = Chem.MolFromSmiles(input_str)
        elif input_type == "formula":
            # Try common formula-to-SMILES mappings, fallback to RDKit
            smiles = self._formula_to_smiles(input_str)
            if smiles:
                mol = Chem.MolFromSmiles(smiles)
            else:
                return None
        else:
            return None

        if mol is None:
            return None

        # Add hydrogens and generate 3D coordinates
        mol = Chem.AddHs(mol)
        result = AllChem.EmbedMolecule(mol, AllChem.ETKDGv3())
        if result == -1:
            # Fallback: try without distance geometry
            AllChem.EmbedMolecule(mol, randomSeed=42)

        try:
            AllChem.MMFFOptimizeMolecule(mol)
        except Exception:
            pass  # Optimization may fail for some molecules

        conf = mol.GetConformer()
        formula = Chem.rdMolDescriptors.CalcMolFormula(mol)

        atoms = []
        for i, atom in enumerate(mol.GetAtoms()):
            pos = conf.GetAtomPosition(i)
            symbol = atom.GetSymbol()
            atoms.append(AtomData(
                index=i,
                symbol=symbol,
                x=round(pos.x, 4),
                y=round(pos.y, 4),
                z=round(pos.z, 4),
                color=CPK_COLORS.get(symbol, "#FF69B4"),
                radius=COVALENT_RADII.get(symbol, 0.75),
            ))

        bonds = []
        for bond in mol.GetBonds():
            bond_type = bond.GetBondType()
            order = 1
            if bond_type == Chem.BondType.DOUBLE:
                order = 2
            elif bond_type == Chem.BondType.TRIPLE:
                order = 3
            elif bond_type == Chem.BondType.AROMATIC:
                order = 2  # Simplified
            bonds.append(BondData(
                atom1=bond.GetBeginAtomIdx(),
                atom2=bond.GetEndAtomIdx(),
                order=order,
            ))

        name = name_compound(formula)
        mw = round(Descriptors.MolWt(mol), 3)

        return MoleculeData(
            formula=formula,
            name=name,
            atoms=atoms,
            bonds=bonds,
            properties={"molecular_weight": mw},
        )

    def _formula_to_smiles(self, formula: str) -> str | None:
        """Map common formulas to SMILES since RDKit needs SMILES input."""
        mapping = {
            "H2O": "O", "CO2": "O=C=O", "NH3": "N", "CH4": "C",
            "C2H5OH": "CCO", "CH3OH": "CO", "H2O2": "OO",
            "HCl": "Cl", "HF": "F", "HBr": "Br", "HI": "I",
            "H2SO4": "OS(=O)(=O)O", "HNO3": "O[N+](=O)[O-]",
            "CH3COOH": "CC(=O)O", "HCOOH": "O=CO",
            "C6H6": "c1ccccc1", "C2H4": "C=C", "C2H2": "C#C",
            "CH2O": "C=O", "C3H8": "CCC", "C6H12O6": "OC[C@@H](O1)[C@@H](O)[C@H](O)[C@@H](O)[C@@H]1O",
        }
        return mapping.get(formula)
```

**Note for implementer:** The `_formula_to_smiles` mapping handles the most common formulas. For formulas not in the mapping, the generator returns None and the API should return a 404. This can be expanded over time.

- [ ] **Step 4: Run tests — expect pass**

- [ ] **Step 5: Run all backend tests**

Run: `cd backend && source venv/Scripts/activate && python -m pytest tests/ -v`

- [ ] **Step 6: Commit**

```bash
git add backend/pyproject.toml backend/app/engine/structure_generator.py backend/tests/test_structure_generator.py
git commit -m "feat: add RDKit-based StructureGenerator for 3D molecular data"
```

---

## Task 3: Orbital Calculator

**Files:**
- Create: `backend/app/engine/orbital_calculator.py`
- Create: `backend/tests/test_orbital_calculator.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_orbital_calculator.py`:
```python
from app.engine.orbital_calculator import OrbitalCalculator
from app.models.structure import OrbitalData


def test_hydrogen_orbitals():
    calc = OrbitalCalculator()
    data = calc.get_orbitals(1)  # Hydrogen
    assert isinstance(data, OrbitalData)
    assert data.element == "Hydrogen"
    assert len(data.orbitals) == 1  # 1s only
    assert data.orbitals[0].label == "1s"
    assert data.orbitals[0].shape == "sphere"


def test_carbon_orbitals():
    calc = OrbitalCalculator()
    data = calc.get_orbitals(6)  # Carbon: 1s2 2s2 2p2
    assert data.element == "Carbon"
    assert len(data.orbitals) == 3  # 1s, 2s, 2p
    p_orbital = next(o for o in data.orbitals if o.label == "2p")
    assert p_orbital.shape == "dumbbell"
    assert p_orbital.electrons == 2
    assert set(p_orbital.orientations) == {"x", "y", "z"}


def test_iron_orbitals():
    calc = OrbitalCalculator()
    data = calc.get_orbitals(26)  # Iron: [Ar] 3d6 4s2
    assert data.element == "Iron"
    d_orbital = next(o for o in data.orbitals if "3d" in o.label)
    assert d_orbital.shape == "cloverleaf"
    assert d_orbital.electrons == 6


def test_orbital_radius_increases_with_n():
    calc = OrbitalCalculator()
    data = calc.get_orbitals(11)  # Sodium: 1s2 2s2 2p6 3s1
    radii = {o.label: o.radius for o in data.orbitals}
    assert radii["1s"] < radii["2s"] < radii["3s"]
```

- [ ] **Step 2: Run tests — expect fail**

- [ ] **Step 3: Implement OrbitalCalculator**

Create `backend/app/engine/orbital_calculator.py`:

The calculator:
1. Loads element data from `elements.json` to get electron configuration and element name
2. Parses the electron configuration string (e.g., "1s2 2s2 2p6 3s2 3p6 3d6 4s2") into subshells
3. For each occupied subshell, creates an `OrbitalInfo`:
   - n = principal quantum number
   - l = angular quantum number (s=0, p=1, d=2, f=3)
   - shape: l=0 → "sphere", l=1 → "dumbbell", l=2 → "cloverleaf", l=3 → "complex"
   - radius: n × 0.6 Angstroms (scaled Bohr model approximation)
   - orientations: p→["x","y","z"], d→["xy","xz","yz","x2y2","z2"], f→["xyz",...] (7 orientations)
   - electrons: the electron count from the config

The electron configuration comes from `elements.json` field `electron_configuration`. Parse it by splitting on spaces, then extracting n, l-letter, and electron count from each token (e.g., "2p6" → n=2, l=1, electrons=6).

NOTE: The electron configuration in `elements.json` may use noble gas core notation like "[Ar] 3d6 4s2". The calculator needs to expand this. Use a lookup of noble gas configs: He=[1s2], Ne=[He 2s2 2p6], Ar=[Ne 3s2 3p6], Kr=[Ar 3d10 4s2 4p6], Xe=[Kr 4d10 5s2 5p6], Rn=[Xe 4f14 5d10 6s2 6p6].

- [ ] **Step 4: Run tests — expect pass**

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/orbital_calculator.py backend/tests/test_orbital_calculator.py
git commit -m "feat: add OrbitalCalculator for quantum-number-based orbital data"
```

---

## Task 4: Precomputed Common Structures

**Files:**
- Create: `backend/app/scripts/generate_structures.py`
- Create: `backend/app/data/common_structures.json`
- Create: `backend/tests/test_common_structures.py`

- [ ] **Step 1: Write data validation tests**

Create `backend/tests/test_common_structures.py`:
```python
import json
from pathlib import Path
from app.models.structure import MoleculeData

DATA_PATH = Path(__file__).parent.parent / "app" / "data" / "common_structures.json"


def test_file_exists():
    assert DATA_PATH.exists()


def test_has_enough_molecules():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    assert len(data) >= 20


def test_entries_are_valid():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    for key, entry in data.items():
        mol = MoleculeData(**entry)
        assert len(mol.atoms) > 0
        assert mol.formula != ""


def test_water_present():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    assert "H2O" in data
    water = MoleculeData(**data["H2O"])
    assert len(water.atoms) == 3
    assert len(water.bonds) == 2
```

- [ ] **Step 2: Create generation script**

Create `backend/app/scripts/generate_structures.py`:

This script uses `StructureGenerator` to generate 3D data for ~30-50 common molecules and writes the results to `common_structures.json` keyed by formula.

```python
"""Generate common_structures.json from StructureGenerator.

Usage: cd backend && source venv/Scripts/activate && python -m app.scripts.generate_structures
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
    "NaCl": "[Na+].[Cl-]", "KCl": "[K+].[Cl-]",
    "CaCl2": "[Ca+2].[Cl-].[Cl-]",
}

def generate():
    output_path = Path(__file__).parent.parent / "data" / "common_structures.json"
    gen = StructureGenerator()
    results = {}

    for formula, smiles in COMMON_MOLECULES.items():
        mol = gen.generate(smiles, "smiles")
        if mol:
            mol.formula = formula  # Override with canonical formula
            results[formula] = mol.model_dump()
            print(f"  Generated {formula}")
        else:
            print(f"  FAILED {formula}")

    output_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"\nGenerated {len(results)} molecules to {output_path}")

if __name__ == "__main__":
    generate()
```

- [ ] **Step 3: Run the script**

Run: `cd backend && source venv/Scripts/activate && python -m app.scripts.generate_structures`

- [ ] **Step 4: Run tests — expect pass**

- [ ] **Step 5: Commit**

```bash
git add backend/app/scripts/generate_structures.py backend/app/data/common_structures.json backend/tests/test_common_structures.py
git commit -m "feat: generate precomputed 3D data for common molecules"
```

---

## Task 5: Structure API Endpoints

**Files:**
- Create: `backend/app/api/structures.py`
- Create: `backend/tests/test_structures_api.py`
- Modify: `backend/app/main.py` — mount router

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_structures_api.py`:
```python
def test_generate_structure(client):
    response = client.post("/api/structures/generate", json={
        "input": "O",
        "input_type": "smiles",
    })
    assert response.status_code == 200
    data = response.json()
    assert "atoms" in data
    assert "bonds" in data
    assert len(data["atoms"]) == 3  # H2O


def test_get_common_structure(client):
    response = client.get("/api/structures/common/H2O")
    assert response.status_code == 200
    data = response.json()
    assert data["formula"] == "H2O"
    assert len(data["atoms"]) == 3


def test_common_structure_not_found(client):
    response = client.get("/api/structures/common/XYZ999")
    assert response.status_code == 404


def test_get_orbitals(client):
    response = client.get("/api/structures/orbitals/6")
    assert response.status_code == 200
    data = response.json()
    assert data["element"] == "Carbon"
    assert len(data["orbitals"]) >= 3


def test_orbitals_not_found(client):
    response = client.get("/api/structures/orbitals/999")
    assert response.status_code == 404
```

- [ ] **Step 2: Implement API**

Create `backend/app/api/structures.py`:
```python
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.engine.structure_generator import StructureGenerator
from app.engine.orbital_calculator import OrbitalCalculator
from app.models.structure import MoleculeData, OrbitalData

router = APIRouter(prefix="/api/structures", tags=["structures"])
_generator = StructureGenerator()
_orbital_calc = OrbitalCalculator()

_COMMON_PATH = Path(__file__).parent.parent / "data" / "common_structures.json"
_common: dict[str, dict] = json.loads(_COMMON_PATH.read_text(encoding="utf-8"))


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
        raise HTTPException(status_code=404, detail=f"No precomputed structure for '{formula}'")
    return data


@router.get("/orbitals/{atomic_number}", response_model=OrbitalData)
def get_orbitals(atomic_number: int):
    try:
        return _orbital_calc.get_orbitals(atomic_number)
    except (ValueError, IndexError, KeyError):
        raise HTTPException(status_code=404, detail=f"No orbital data for atomic number {atomic_number}")
```

Mount in `backend/app/main.py`:
```python
from app.api.structures import router as structures_router
app.include_router(structures_router)
```

- [ ] **Step 3: Run tests — expect pass**

- [ ] **Step 4: Run all backend tests**

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/structures.py backend/app/main.py backend/tests/test_structures_api.py
git commit -m "feat: add structure API endpoints for molecule and orbital data"
```

---

## Task 6: Frontend Types & API Hooks

**Files:**
- Create: `frontend/src/types/structure.ts`
- Create: `frontend/src/api/structures.ts`
- Modify: `frontend/src/stores/labStore.ts` — add structureViewer state

- [ ] **Step 1: Create TypeScript types**

Create `frontend/src/types/structure.ts`:
```typescript
export interface AtomData {
  index: number;
  symbol: string;
  x: number;
  y: number;
  z: number;
  color: string;
  radius: number;
}

export interface BondData {
  atom1: number;
  atom2: number;
  order: number;
}

export interface MoleculeData {
  formula: string;
  name: string;
  atoms: AtomData[];
  bonds: BondData[];
  properties: Record<string, unknown>;
}

export interface OrbitalInfo {
  n: number;
  l: number;
  label: string;
  electrons: number;
  shape: string;
  radius: number;
  orientations: string[];
}

export interface OrbitalData {
  element: string;
  atomic_number: number;
  electron_configuration: string;
  orbitals: OrbitalInfo[];
}
```

- [ ] **Step 2: Create API hooks**

Create `frontend/src/api/structures.ts`:
```typescript
import { useQuery } from "@tanstack/react-query";
import type { MoleculeData, OrbitalData } from "../types/structure";

async function generateStructure(input: string, inputType: string = "smiles"): Promise<MoleculeData> {
  const response = await fetch("/api/structures/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, input_type: inputType }),
  });
  if (!response.ok) throw new Error("Failed to generate structure");
  return response.json();
}

async function fetchCommonStructure(formula: string): Promise<MoleculeData> {
  const response = await fetch(`/api/structures/common/${encodeURIComponent(formula)}`);
  if (!response.ok) throw new Error(`No structure for ${formula}`);
  return response.json();
}

async function fetchOrbitals(atomicNumber: number): Promise<OrbitalData> {
  const response = await fetch(`/api/structures/orbitals/${atomicNumber}`);
  if (!response.ok) throw new Error("Failed to fetch orbitals");
  return response.json();
}

export function useCommonStructure(formula: string | null) {
  return useQuery({
    queryKey: ["structure", formula],
    queryFn: () => fetchCommonStructure(formula!),
    enabled: formula !== null,
    staleTime: Infinity,
  });
}

export function useOrbitals(atomicNumber: number | null) {
  return useQuery({
    queryKey: ["orbitals", atomicNumber],
    queryFn: () => fetchOrbitals(atomicNumber!),
    enabled: atomicNumber !== null,
    staleTime: Infinity,
  });
}

export { generateStructure };
```

- [ ] **Step 3: Extend labStore**

Read `frontend/src/stores/labStore.ts` first. Add:

```typescript
// Add to state interface:
structureViewer: {
  formula: string | null;
  atomicNumber: number | null;
  mode: "ball-and-stick" | "space-filling" | "wireframe" | "orbital";
  showLabels: boolean;
};

// Add actions:
openStructureViewer: (formula: string) => void;
openOrbitalViewer: (atomicNumber: number) => void;
setStructureMode: (mode: "ball-and-stick" | "space-filling" | "wireframe" | "orbital") => void;
toggleStructureLabels: () => void;
closeStructureViewer: () => void;

// Add defaults:
structureViewer: { formula: null, atomicNumber: null, mode: "ball-and-stick", showLabels: false },

// Add implementations:
openStructureViewer: (formula) => set({ structureViewer: { formula, atomicNumber: null, mode: "ball-and-stick", showLabels: false } }),
openOrbitalViewer: (atomicNumber) => set({ structureViewer: { formula: null, atomicNumber, mode: "orbital", showLabels: false } }),
setStructureMode: (mode) => set((state) => ({ structureViewer: { ...state.structureViewer, mode } })),
toggleStructureLabels: () => set((state) => ({ structureViewer: { ...state.structureViewer, showLabels: !state.structureViewer.showLabels } })),
closeStructureViewer: () => set({ structureViewer: { formula: null, atomicNumber: null, mode: "ball-and-stick", showLabels: false } }),
```

- [ ] **Step 4: Verify build**

Run: `cd frontend && npm run build`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/structure.ts frontend/src/api/structures.ts frontend/src/stores/labStore.ts
git commit -m "feat: add structure types, API hooks, and viewer state to store"
```

---

## Task 7: Molecule Viewer Components (AtomSphere, BondCylinder, MoleculeViewer)

**Files:**
- Create: `frontend/src/components/viewer/AtomSphere.tsx`
- Create: `frontend/src/components/viewer/BondCylinder.tsx`
- Create: `frontend/src/components/viewer/MoleculeLabels.tsx`
- Create: `frontend/src/components/viewer/MoleculeViewer.tsx`

- [ ] **Step 1: Create AtomSphere**

Props: `atom: AtomData`, `mode: string`, `onClick: () => void`

- Ball-and-stick mode: small sphere (radius × 0.4)
- Space-filling mode: large sphere (radius × 1.5 for vdW approximation)
- Wireframe mode: tiny sphere (radius × 0.15)
- Color from atom.color (CPK)
- On click, show atom info (symbol, position)

- [ ] **Step 2: Create BondCylinder**

Props: `atom1: AtomData`, `atom2: AtomData`, `order: number`, `mode: string`

- Calculate midpoint and direction between two atoms
- Single bond: one cylinder
- Double bond: two thinner cylinders offset perpendicular to bond axis
- Triple bond: three thinner cylinders
- Wireframe mode: very thin cylinders or lines
- Space-filling mode: not rendered
- Color: split coloring — first half atom1.color, second half atom2.color

- [ ] **Step 3: Create MoleculeLabels**

Props: `atoms: AtomData[]`, `visible: boolean`

Uses drei's `Html` or `Text` component to render element symbol text labels floating above each atom. Only visible when `showLabels` is true.

- [ ] **Step 4: Create MoleculeViewer**

The main R3F scene for molecule rendering.

Props: `molecule: MoleculeData`, `mode: string`, `showLabels: boolean`

- Centers the molecule (subtract center of mass from all atom positions)
- Renders all atoms via AtomSphere
- Renders all bonds via BondCylinder (skip in space-filling mode)
- Renders labels via MoleculeLabels
- Includes its own OrbitControls, ambientLight, directionalLight
- Auto-fits camera to molecule bounds

- [ ] **Step 5: Verify build**

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/viewer/
git commit -m "feat: add molecule renderer components — AtomSphere, BondCylinder, MoleculeViewer"
```

---

## Task 8: Orbital Mesh Component

**Files:**
- Create: `frontend/src/components/viewer/OrbitalMesh.tsx`

- [ ] **Step 1: Create OrbitalMesh**

Props: `orbital: OrbitalInfo`, `position: [number, number, number]`

Renders orbital shapes based on `orbital.shape`:

- **"sphere" (s orbital):** `<sphereGeometry>` with translucent blue material, radius from orbital.radius
- **"dumbbell" (p orbital):** Two elongated spheres (ellipsoids) on opposite sides of the atom along the specified orientation axis. Positive lobe blue (#3b82f680), negative lobe red (#ef444480). Use `<sphereGeometry>` with non-uniform scale (e.g., scale=[0.5, 1.2, 0.5] then rotate to correct axis).
  - orientation "x": lobes along X axis
  - orientation "y": lobes along Y axis
  - orientation "z": lobes along Z axis
- **"cloverleaf" (d orbital):** Four lobes. Can simplify as 4 small spheres positioned in the orbital's plane. Alternating blue/red.
- **"complex" (f orbital):** Multi-lobed. Simplify as 6-8 small spheres. Alternating blue/red.

All orbitals use `meshStandardMaterial` with `transparent`, `opacity: 0.3`, `depthWrite: false`.

- [ ] **Step 2: Integrate into MoleculeViewer**

When mode is "orbital", the MoleculeViewer should also accept `orbitalData: OrbitalData` and render OrbitalMesh for each occupied orbital at each atom position (or at the origin for single-atom orbital view).

- [ ] **Step 3: Verify build**

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/viewer/OrbitalMesh.tsx frontend/src/components/viewer/MoleculeViewer.tsx
git commit -m "feat: add OrbitalMesh for s/p/d/f orbital visualization"
```

---

## Task 9: Structure Panel & App Integration

**Files:**
- Create: `frontend/src/components/ui/StructurePanel.tsx`
- Modify: `frontend/src/App.tsx` — add Structure tab
- Modify: `frontend/src/components/ui/ElementInspector.tsx` — add "View Orbitals" button

- [ ] **Step 1: Create StructurePanel**

The Structure tab panel contains:
- Top bar: molecule name + formula, mode toggle buttons (Ball-and-Stick, CPK, Wireframe, Orbital), labels toggle
- Center: R3F Canvas with MoleculeViewer
- Bottom: property summary (molecular weight, etc.)

Reads `structureViewer` from store. If `formula` is set, fetches structure via `useCommonStructure`. If `atomicNumber` is set, fetches orbitals via `useOrbitals`. If neither, shows "Select a substance or element to view its structure."

- [ ] **Step 2: Add Structure tab to App.tsx**

Read `frontend/src/App.tsx`. Add a third tab "Structure" to the right panel Tabs component that renders `<StructurePanel />`.

- [ ] **Step 3: Add "View Orbitals" button to ElementInspector**

Read `frontend/src/components/ui/ElementInspector.tsx`. Add a button below the element header that calls `openOrbitalViewer(element.atomic_number)` and switches the right panel to the Structure tab.

- [ ] **Step 4: Verify build**

Run: `cd frontend && npm run build`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: add StructurePanel with molecule viewer and orbital tabs"
```

---

## Task 10: Integration Verification

**Files:**
- Various fixes

- [ ] **Step 1: Run all backend tests**

Run: `cd backend && source venv/Scripts/activate && python -m pytest tests/ -v`

- [ ] **Step 2: Run all frontend tests**

Run: `cd frontend && npx vitest run`

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`

- [ ] **Step 4: Manual integration test**

Start both servers and verify:
1. Click an element in periodic table → Inspector shows "View Orbitals" button
2. Click "View Orbitals" → Structure tab opens showing orbital shapes for that element
3. Mode toggle switches between ball-and-stick, CPK, wireframe, orbital
4. Labels toggle shows/hides element symbols on atoms
5. Molecule rotates/zooms with mouse
6. Structure API returns valid 3D data

- [ ] **Step 5: Fix any issues**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: Phase 3 integration verification and cleanup"
```
