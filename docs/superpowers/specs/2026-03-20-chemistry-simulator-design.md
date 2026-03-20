# Chemistry Simulator - Design Specification

## Overview

A comprehensive, realistic virtual chemistry laboratory as a web application. Users interact with a 3D tabletop lab environment to perform experiments, run reactions, analyze compounds with professional-grade instruments, and explore atomic/molecular structure down to the quantum level. All 118 elements are included with full property data.

**Target audience:** Advanced / professional level — quantum-level accuracy, spectroscopy simulation, computational chemistry.

## Architecture

### Frontend (React + React Three Fiber)

- **3D Lab Scene (R3F/Three.js):** Tabletop-view 3D environment with realistic lab equipment. Users drag and drop chemicals and equipment. Particle effects for reactions, dynamic liquid rendering, flame simulation.
- **UI Panels (React):** Interactive periodic table, element/compound inspector, reaction log with balanced equations, environment controls (temperature, pressure, atmosphere), station navigation tabs.
- **Structure Viewer:** Dedicated 3D panel for molecular inspection — ball-and-stick, space-filling, wireframe, orbital, electron density surface, and electrostatic potential map rendering modes.
- **State Management (Zustand):** Lab inventory, bench state, selected items, reaction history, UI panel visibility, environment settings.

### Backend (Python / FastAPI)

- **REST API + WebSocket:** REST for request/response queries, WebSocket for streaming real-time reaction progress and simulation updates to the 3D scene.
- **Reaction Engine:** Product prediction, equation balancing, reaction type classification, thermodynamics (delta H/S/G, Hess's Law), kinetics (rate laws, Arrhenius, equilibrium constants, Le Chatelier).
- **Quantum Chemistry (PySCF):** Hartree-Fock and DFT calculations, molecular orbital computation, geometry optimization, vibrational frequency analysis, electron density maps, electrostatic potential surfaces.
- **Spectroscopy Simulation:** UV-Vis, FTIR, NMR (1H, 13C, 2D COSY/HSQC), Mass Spec, Raman spectra generation with peak labeling, integration, and splitting patterns.
- **Molecular Informatics (RDKit):** SMILES/InChI parsing, 3D conformer generation, Lewis structure generation, IUPAC naming, valence validation, property calculation, stereochemistry.
- **Element Database:** All 118 elements — atomic properties, electron configurations, orbital diagrams, isotope data, thermodynamic data, emission/absorption spectra lines. Sourced from PubChem/NIST/CRC Handbook data.

## Lab Stations

The lab uses a multi-station layout. Users switch between stations via tabs. Each station is its own 3D scene with relevant equipment.

### Station 1: Main Bench

**Equipment:** Beakers, Erlenmeyer flasks, round-bottom flasks, test tubes + rack, Bunsen burner, hot plate + magnetic stirrer, analytical balance (0.0001g), graduated cylinders, volumetric flasks, mortar & pestle, stirring rods, watch glasses, petri dishes, thermometers.

**Operations:** Mixing & dissolving, heating & boiling, weighing & measuring, basic reactions (acid-base, redox, precipitation), gravity filtration, crystallization, solution preparation.

### Station 2: Fume Hood

**Equipment:** Enclosed fume hood with sash control, distillation apparatus (simple + fractional), rotary evaporator, vacuum filtration (Buchner funnel), separating funnels, heating mantles, reflux condensers.

**Operations:** Hazardous/volatile reactions, distillation & reflux, vacuum filtration, liquid-liquid extraction, solvent evaporation, gas-producing reactions, acid digestion.

### Station 3: Instrument Room

**Equipment:** UV-Vis spectrophotometer, FTIR spectrometer, NMR spectrometer, mass spectrometer, Raman spectrometer, HPLC system, gas chromatograph (GC), atomic absorption spectrometer, optical & polarizing microscope.

**Operations:** Sample analysis & identification, spectrum generation (UV-Vis, IR, NMR, MS), chromatographic separation & analysis, concentration determination, molecular structure confirmation, purity assessment, crystal structure analysis.

### Station 4: Electrochemistry Lab

**Equipment:** Potentiostat/galvanostat, electrodes (reference, working, counter), electrolysis cell, pH meter, conductivity meter, burette + clamp stand, autotitrator, indicator solutions.

**Operations:** Galvanic cell construction, electrolysis experiments, cyclic voltammetry, acid-base titration with endpoint detection, redox titration, pH measurement & buffer preparation, conductometric analysis.

### Station 5: Glove Box (Inert Atmosphere)

**Equipment:** Sealed glove box (N2/Ar atmosphere), Schlenk line (vacuum/inert gas manifold), vacuum pump, gas lines (N2, Ar, O2), airlock/antechamber, internal balance & stirrer.

**Operations:** Air-sensitive reactions, alkali metal handling, organometallic synthesis, moisture-sensitive work, cannula transfers, controlled atmosphere experiments.

### Station 6: Thermal Analysis & Calorimetry

**Equipment:** Bomb calorimeter, differential scanning calorimeter (DSC), thermogravimetric analyzer (TGA), ice bath, dry ice bath, liquid N2 dewar, oil bath, water bath, crucibles, sample pans.

**Operations:** Heat of combustion measurement, phase transition analysis, decomposition studies, heat capacity determination, melting/boiling point measurement, thermal stability testing.

### Station 7: Chemical Storage & Safety

**Equipment:** Chemical cabinets (organized by hazard class), refrigerator & freezer, desiccator, safety goggles, lab coats, gloves, fire extinguisher, eye wash station, emergency shower, chemical waste containers (segregated), SDS/MSDS reference terminal.

**Operations:** Browse full chemical inventory, SDS lookup for any chemical, equip safety gear (required for hazardous work), proper waste disposal, chemical compatibility checking, emergency procedures.

## 3D Visualization & Interaction

### Molecular Viewing Modes

- **Ball-and-stick:** Atoms as spheres, bonds as cylinders, bond lengths visible.
- **Space-filling (CPK):** Atoms rendered at van der Waals radii.
- **Wireframe:** Bonds only, minimal rendering.
- **Orbital/Surface:** Electron density isosurfaces, molecular orbitals, electrostatic potential maps.
- **Lewis dot structure:** 2D overlay showing electron pairs and formal charges.

### Lab Interaction Controls

- **Left click:** Select item.
- **Double click:** Open/use equipment.
- **Right click:** Context menu (pour, heat, measure, etc.).
- **Drag:** Move items on bench / pour between containers.
- **Scroll:** Zoom in/out.
- **Middle drag:** Rotate camera angle.
- **Shift+drag:** Pan camera.
- **Hover:** Tooltip with item name and quick info.

### Visual Effects

**Substance behaviors:** Visible liquid fill levels in glassware, real color changes during reactions, gas production (bubbles, vapor, fume particles), temperature glow on heated containers, precipitates settling to bottom, phase change visuals (freezing, melting, boiling), exothermic heat shimmer/steam/sparks, flame colors matching metal ions (flame tests).

**Reaction effects:** Particle systems for gas/smoke/steam, dynamic liquid color blending, fire & flame simulation, explosion effects, crystal growth animation, effervescence (bubbles), emission glow (fluorescence).

**Instrument outputs:** Live spectrum plots (Chart.js), digital readouts (pH, temperature, mass), titration curve real-time plotting, chromatogram display, voltammogram plots, microscope viewport, TGA/DSC curves.

**Safety feedback:** Warning flash for dangerous combinations, fume hood alert if toxic gas produced outside hood, PPE reminder before hazardous operations, spill visualization, fire alarm trigger, chemical burn indicators, GHS hazard symbols on all containers.

### Structure Viewer Panel

A dedicated 3D viewer panel (right side or pop-out window) for deep molecular inspection, separate from the lab scene:

- Viewing modes: ball-and-stick, space-filling, wireframe, orbital, electron density, electrostatic potential, HOMO/LUMO, unit cell (crystals).
- Interactive: rotate/zoom/pan the molecule, click atom for properties, click bond for length/angle/type, toggle labels (element, charge, hybridization), measure distances & angles, animate IR vibrational modes, compare structures side-by-side.

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| React Three Fiber | 3D lab scene rendering |
| Three.js | Underlying 3D engine |
| @react-three/drei | 3D helpers (controls, loaders) |
| @react-three/postprocessing | Visual effects (glow, bloom) |
| Zustand | State management |
| TanStack Query | API data fetching & caching |
| Chart.js + react-chartjs-2 | Spectra & instrument plots |
| Tailwind CSS | UI styling |
| Radix UI | Accessible UI primitives |
| react-dnd | Drag-and-drop system |
| Vitest | Unit testing |

### Backend

| Technology | Purpose |
|---|---|
| Python 3.12+ | Language |
| FastAPI | REST API framework |
| WebSockets | Real-time reaction streaming |
| Uvicorn | ASGI server |
| Pydantic | Data validation & schemas |
| SQLite + SQLAlchemy | Element/compound database |
| Pytest | Testing |
| RDKit | Molecular informatics & structure |
| PySCF | Quantum chemistry (HF, DFT) |
| ASE | Atomic simulation environment |
| NumPy / SciPy | Numerical computation |
| Mendeleev | Periodic table data |
| Open Babel (pybel) | Format conversion |
| cclib | Computational chemistry output parsing |

## Project Structure

```
ChemistrySimulator/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── lab/
│   │   │   │   ├── stations/        — MainBench, FumeHood, InstrumentRoom, etc.
│   │   │   │   ├── equipment/       — Beaker, BunsenBurner, Flask, etc.
│   │   │   │   ├── effects/         — Fire, Smoke, Bubbles, Glow, etc.
│   │   │   │   └── LabScene.tsx     — Main 3D scene orchestrator
│   │   │   ├── ui/
│   │   │   │   ├── PeriodicTable.tsx
│   │   │   │   ├── ElementInspector.tsx
│   │   │   │   ├── ReactionLog.tsx
│   │   │   │   ├── StationTabs.tsx
│   │   │   │   └── EnvironmentBar.tsx
│   │   │   └── viewer/
│   │   │       ├── MoleculeViewer.tsx
│   │   │       ├── OrbitalViewer.tsx
│   │   │       └── SpectrumChart.tsx
│   │   ├── stores/                  — Zustand state stores
│   │   ├── hooks/                   — Custom React hooks
│   │   ├── api/                     — Backend API client (TanStack Query)
│   │   ├── types/                   — TypeScript type definitions
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/
│   ├── app/
│   │   ├── main.py                  — FastAPI app entry
│   │   ├── api/
│   │   │   ├── elements.py          — Element data endpoints
│   │   │   ├── reactions.py         — Reaction prediction & simulation
│   │   │   ├── structures.py        — Molecular structure generation
│   │   │   ├── quantum.py           — Quantum chemistry calculations
│   │   │   └── spectroscopy.py      — Spectrum generation
│   │   ├── engine/
│   │   │   ├── reaction_engine.py   — Reaction prediction & balancing
│   │   │   ├── thermodynamics.py    — Energy calculations
│   │   │   ├── kinetics.py          — Rate & equilibrium
│   │   │   ├── quantum_chem.py      — PySCF wrapper
│   │   │   └── spectroscopy.py      — Spectrum computation
│   │   ├── data/
│   │   │   ├── elements.json        — All 118 elements
│   │   │   ├── reactions.json       — Known reaction rules
│   │   │   └── spectral_data/       — Reference spectra
│   │   ├── models/                  — Pydantic schemas
│   │   └── db/                      — Database setup & queries
│   ├── requirements.txt
│   └── pyproject.toml
│
├── docs/
└── README.md
```

## Build Phases

Each phase delivers a working, usable slice of the system.

### Phase 1: Foundation

Project scaffolding, element database (all 118 elements with full properties), basic FastAPI backend with element endpoints, interactive periodic table UI, basic 3D scene with Main Bench station, simple container interactions (place, move, select).

### Phase 2: Reactions

Reaction engine (product prediction, equation balancing, thermodynamics), visual effects in 3D scene (color changes, gas production, heat glow, flames), reaction log panel, drag chemicals onto bench and combine them.

### Phase 3: Structure & Visualization

Molecule viewer with all rendering modes (ball-and-stick, CPK, wireframe), orbital visualization (s, p, d, f shapes, HOMO/LUMO), RDKit integration for 3D conformer and Lewis structure generation, structure viewer panel with interactive features.

### Phase 4: More Stations

Fume Hood, Electrochemistry Lab, Glove Box, Thermal Analysis, Chemical Storage & Safety — each with their full equipment sets and operations.

### Phase 5: Instruments

Instrument Room station, spectroscopy simulation (UV-Vis, IR, NMR, Mass Spec, Raman), chromatography (TLC, HPLC, GC), live spectrum/chromatogram plots, microscopy viewport.

### Phase 6: Quantum & Advanced

PySCF quantum chemistry calculations (Hartree-Fock, DFT), molecular geometry optimization, electron density maps, electrostatic potential surfaces, kinetics simulation over time, advanced reaction mechanisms, vibrational frequency analysis.
