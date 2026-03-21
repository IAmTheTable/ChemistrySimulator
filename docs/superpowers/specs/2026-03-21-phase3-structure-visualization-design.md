# Phase 3: Structure & Visualization — Design Specification

## Overview

Add 3D molecular structure visualization to the Chemistry Simulator. Users can view any molecule in ball-and-stick, space-filling, wireframe, or orbital mode. The backend uses RDKit to generate 3D conformers and serves atom positions, bond data, and orbital parameters. The frontend renders molecules using custom R3F components in a dedicated structure viewer panel.

## Dependencies

**Backend:** Add `rdkit-pypi>=2024.3.0` to `backend/pyproject.toml` dependencies. RDKit provides molecular parsing, 3D conformer generation, and geometry optimization.

## Backend: Structure Generation Service

### RDKit Integration

Install RDKit (`rdkit-pypi`) in the backend. Use it to:
1. Parse molecular formulas and SMILES strings
2. Generate 3D conformers via `AllChem.EmbedMolecule()` + `AllChem.MMFFOptimizeMolecule()`
3. Extract atom positions, bond connectivity, and molecular properties

### API Endpoints

#### POST /api/structures/generate

Request:
```json
{
  "input": "CCO",
  "input_type": "smiles"
}
```
`input_type` can be `"smiles"`, `"formula"`, or `"name"`.

Response:
```json
{
  "formula": "C2H5OH",
  "name": "Ethanol",
  "atoms": [
    {"index": 0, "symbol": "C", "x": 0.0, "y": 0.0, "z": 0.0, "color": "#909090", "radius": 0.77},
    {"index": 1, "symbol": "C", "x": 1.54, "y": 0.0, "z": 0.0, "color": "#909090", "radius": 0.77},
    {"index": 2, "symbol": "O", "x": 2.31, "y": 1.26, "z": 0.0, "color": "#FF0000", "radius": 0.73}
  ],
  "bonds": [
    {"atom1": 0, "atom2": 1, "order": 1},
    {"atom1": 1, "atom2": 2, "order": 1}
  ],
  "properties": {
    "molecular_weight": 46.07,
    "geometry": "tetrahedral",
    "polar": true
  }
}
```

Hydrogen atoms are included explicitly (RDKit's `AddHs()`).

#### GET /api/structures/common/{formula}

Returns precomputed 3D data for ~50 common molecules. Same response format as POST. Avoids RDKit computation for frequently viewed molecules.

Precomputed molecules include: H2, O2, N2, H2O, CO2, NaCl, HCl, NaOH, CH4, NH3, C2H5OH, H2SO4, HNO3, C6H6 (benzene), CH3COOH, H2O2, CaCO3, KMnO4, AgNO3, Na2SO4, and ~30 more covering the substances in the simulator.

#### GET /api/structures/orbitals/{atomic_number}

Returns orbital data for an element:
```json
{
  "element": "Carbon",
  "atomic_number": 6,
  "electron_configuration": "1s2 2s2 2p2",
  "orbitals": [
    {"n": 1, "l": 0, "label": "1s", "electrons": 2, "shape": "sphere", "radius": 0.5},
    {"n": 2, "l": 0, "label": "2s", "electrons": 2, "shape": "sphere", "radius": 1.2},
    {"n": 2, "l": 1, "label": "2p", "electrons": 2, "shape": "dumbbell", "radius": 1.5, "orientations": ["x", "y", "z"]}
  ]
}
```

Orbital shapes are derived from quantum numbers:
- l=0 (s): sphere
- l=1 (p): dumbbell (two lobes), 3 orientations (px, py, pz)
- l=2 (d): cloverleaf (four lobes), 5 orientations
- l=3 (f): complex multilobed, 7 orientations

### Backend File Structure

```
backend/app/
├── api/
│   └── structures.py          — Structure generation endpoints
├── engine/
│   ├── structure_generator.py — RDKit wrapper for 3D conformer generation
│   └── orbital_calculator.py  — Orbital shape parameters from quantum numbers
├── data/
│   └── common_structures.json — Precomputed 3D data for ~50 molecules
└── models/
    └── structure.py           — MoleculeData, AtomData, BondData, OrbitalData Pydantic models
```

## Frontend: Structure Viewer

### Structure Viewer Panel

A new tab in the right panel: **Inspector | Reactions | Structure**

Contains:
- An R3F Canvas with its own OrbitControls (independent from the lab scene)
- Mode toggle buttons above the canvas: Ball-and-Stick, Space-Filling, Wireframe, Orbital
- Molecule name and formula displayed at the top
- Property summary below the viewer (molecular weight, geometry, polarity)

### How Users Access It

1. Click an element in the periodic table → Inspector shows element details → "View Orbitals" button → Structure tab opens with orbital visualization for that element
2. Click a container on the bench with contents → Inspector shows substance info → "View Structure" button → Structure tab opens with 3D molecule
3. Click a product in the Reaction Log → "View Structure" link → Structure tab opens

### Rendering Modes

#### Ball-and-Stick (default)
- Atoms: `<sphereGeometry>` with CPK coloring (C=gray, H=white, O=red, N=blue, S=yellow, Cl=green, etc.)
- Atom radius: covalent radius scaled down (typically 0.3-0.5 units)
- Bonds: `<cylinderGeometry>` connecting atom centers
  - Single bond: one cylinder
  - Double bond: two parallel thinner cylinders
  - Triple bond: three parallel cylinders
- Bond color: gradient from atom1 color to atom2 color, or split coloring at midpoint

#### Space-Filling (CPK)
- Atoms: `<sphereGeometry>` at van der Waals radii (much larger than ball-and-stick)
- No bonds rendered
- Atoms may overlap (realistic molecular surface representation)

#### Wireframe
- Bonds: thin lines (Three.js `Line` or thin cylinders)
- Atoms: tiny spheres at each atom position (radius ~0.1)
- Minimal rendering, good for large molecules

#### Orbital
- Atomic orbitals rendered as translucent parametric meshes around each atom
- s orbitals: `<sphereGeometry>` with transparency
- p orbitals: two `<sphereGeometry>` lobes offset along the axis, or custom geometry from parametric equations
- d orbitals: four-lobed shapes using parametric geometry
- Color: positive lobe in blue (#3b82f6), negative lobe in red (#ef4444), both translucent (opacity ~0.3)
- Only occupied orbitals shown by default
- Orbital data fetched from `/api/structures/orbitals/{atomic_number}`

### Interactive Features

- **Rotate/zoom/pan**: OrbitControls on the structure viewer canvas
- **Click atom**: Shows tooltip with element symbol, formal charge (if any), hybridization
- **Click bond**: Shows tooltip with bond length (Angstroms), bond type, bond angle
- **Labels toggle**: Button to show/hide element symbol labels on each atom (using drei's `Html` or `Text` component)
- **Compound name**: Displayed via the nomenclature engine (already built)

### Frontend File Structure

```
frontend/src/
├── api/
│   └── structures.ts               — useStructure(), useCommonStructure(), useOrbitals() hooks
├── types/
│   └── structure.ts                — MoleculeData, AtomData, BondData, OrbitalData interfaces
├── components/
│   ├── ui/
│   │   └── StructurePanel.tsx       — Structure tab panel with mode toggles + R3F canvas
│   └── viewer/
│       ├── MoleculeViewer.tsx       — R3F scene: renders molecule based on active mode
│       ├── AtomSphere.tsx           — Single atom sphere with click handler + tooltip
│       ├── BondCylinder.tsx         — Bond between two atoms (single/double/triple)
│       ├── OrbitalMesh.tsx          — Orbital shape renderer (s, p, d parametric meshes)
│       └── MoleculeLabels.tsx       — Element symbol labels on atoms
```

### Modifications to Existing Files

- `App.tsx` — Add "Structure" tab to the right panel Tabs component
- `ElementInspector.tsx` — Add "View Orbitals" button that sets the structure viewer to orbital mode for the selected element
- `ReactionLog.tsx` — Add "View" link on product formulas
- `labStore.ts` — Add `structureViewerState: { formula: string | null, mode: string, showLabels: boolean }`
