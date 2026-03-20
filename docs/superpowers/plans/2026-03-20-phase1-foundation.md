# Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a working chemistry simulator foundation — backend serving all 118 elements via API, interactive periodic table UI, basic 3D Main Bench scene with placeable containers.

**Architecture:** React + TypeScript + Vite frontend with React Three Fiber for 3D, Zustand for state, TanStack Query for API calls. Python + FastAPI backend with element data generated from the `mendeleev` library and served via REST endpoints. Frontend and backend run as separate dev servers with Vite proxying API requests.

**Tech Stack:** React 18, TypeScript, Vite, React Three Fiber, @react-three/drei, Zustand, TanStack Query, Tailwind CSS, Radix UI, react-dnd, Vitest (frontend) | Python 3.12+, FastAPI, Uvicorn, Pydantic, mendeleev, Pytest (backend)

---

## File Structure

### Backend

```
backend/
├── pyproject.toml                    — Project metadata, dependencies
├── app/
│   ├── __init__.py
│   ├── main.py                       — FastAPI app, CORS, router mounting
│   ├── models/
│   │   ├── __init__.py
│   │   └── element.py                — Element Pydantic schema
│   ├── data/
│   │   └── elements.json             — All 118 elements (generated)
│   ├── api/
│   │   ├── __init__.py
│   │   └── elements.py               — GET /api/elements, GET /api/elements/{number}
│   └── scripts/
│       └── generate_elements.py      — Script to generate elements.json from mendeleev
└── tests/
    ├── __init__.py
    ├── conftest.py                    — FastAPI test client fixture
    └── test_elements.py              — Element API endpoint tests
```

### Frontend

```
frontend/
├── index.html
├── package.json
├── vite.config.ts                    — Dev server config, API proxy
├── tsconfig.json
├── tsconfig.node.json
├── src/
│   ├── main.tsx                      — React entry point
│   ├── App.tsx                       — Root layout: station tabs + panels + 3D scene
│   ├── types/
│   │   └── element.ts                — Element TypeScript interface
│   ├── api/
│   │   └── elements.ts               — TanStack Query hooks for element API
│   ├── stores/
│   │   └── labStore.ts               — Zustand store: selected element, bench items, station
│   ├── components/
│   │   ├── ui/
│   │   │   ├── PeriodicTable.tsx      — Interactive 118-element periodic table grid
│   │   │   ├── ElementInspector.tsx   — Selected element detail panel
│   │   │   ├── StationTabs.tsx        — Tab bar for station switching
│   │   │   └── EnvironmentBar.tsx     — Temperature, pressure, atmosphere readouts
│   │   └── lab/
│   │       ├── LabScene.tsx           — R3F Canvas wrapper, camera, lights
│   │       ├── stations/
│   │       │   └── MainBench.tsx      — 3D bench surface + equipment slots
│   │       └── equipment/
│   │           ├── Beaker.tsx         — 3D beaker (parametric geometry)
│   │           ├── TestTube.tsx       — 3D test tube
│   │           └── ErlenmeyerFlask.tsx — 3D Erlenmeyer flask
│   └── test/
│       ├── setup.ts                   — Vitest setup (jsdom, mocks)
│       ├── labStore.test.ts           — Store unit tests
│       └── PeriodicTable.test.tsx     — Periodic table rendering tests
```

---

## Task 1: Backend Scaffolding

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Create pyproject.toml**

```toml
[project]
name = "chemistry-simulator-backend"
version = "0.1.0"
description = "Chemistry Simulator backend API"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "pydantic>=2.10.0",
    "mendeleev>=0.18.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "httpx>=0.28.0",
    "pytest-asyncio>=0.25.0",
]
```

- [ ] **Step 2: Create virtual environment and install dependencies**

Run:
```bash
cd backend && python -m venv venv && source venv/Scripts/activate && pip install -e ".[dev]"
```
Expected: All packages install successfully.

- [ ] **Step 3: Create FastAPI app skeleton**

Create `backend/app/__init__.py` (empty file).

Create `backend/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Chemistry Simulator API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
```

- [ ] **Step 4: Create test fixtures**

Create `backend/tests/__init__.py` (empty file).

Create `backend/tests/conftest.py`:
```python
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)
```

- [ ] **Step 5: Verify server starts and health check works**

Run:
```bash
cd backend && source venv/Scripts/activate && python -m pytest tests/ -v --tb=short -q
```

Also manually verify:
```bash
cd backend && source venv/Scripts/activate && uvicorn app.main:app --reload --port 8000 &
curl http://localhost:8000/api/health
```
Expected: `{"status":"ok"}`

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "$(cat <<'EOF'
feat: scaffold backend with FastAPI, health check endpoint

Python 3.12+, FastAPI, Pydantic, pytest with test client fixture.
CORS configured for frontend dev server on port 5173.
EOF
)"
```

---

## Task 2: Element Data Model

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/element.py`
- Create: `backend/tests/test_element_model.py`

- [ ] **Step 1: Write the failing test for Element model**

Create `backend/tests/test_element_model.py`:
```python
from app.models.element import Element


def test_element_creation():
    hydrogen = Element(
        atomic_number=1,
        symbol="H",
        name="Hydrogen",
        atomic_mass=1.008,
        category="nonmetal",
        phase_at_stp="gas",
        electron_configuration="1s1",
        electron_configuration_semantic="1s1",
        electronegativity_pauling=2.20,
        first_ionization_energy=1312.0,
        atomic_radius=25.0,
        covalent_radius=31.0,
        van_der_waals_radius=120.0,
        melting_point=-259.16,
        boiling_point=-252.87,
        density=0.00008988,
        oxidation_states=[-1, 1],
        group=1,
        period=1,
        block="s",
        crystal_structure="hexagonal",
        magnetic_ordering="diamagnetic",
        cpk_hex_color="FFFFFF",
        isotopes=[
            {"mass_number": 1, "atomic_mass": 1.00783, "abundance": 0.999885, "stable": True},
            {"mass_number": 2, "atomic_mass": 2.01410, "abundance": 0.000115, "stable": True},
            {"mass_number": 3, "atomic_mass": 3.01605, "abundance": None, "stable": False},
        ],
        shells=[1],
        summary="Hydrogen is the lightest element.",
    )
    assert hydrogen.atomic_number == 1
    assert hydrogen.symbol == "H"
    assert hydrogen.oxidation_states == [-1, 1]
    assert len(hydrogen.isotopes) == 3


def test_element_optional_fields():
    """Elements with missing data should still be valid."""
    oganesson = Element(
        atomic_number=118,
        symbol="Og",
        name="Oganesson",
        atomic_mass=294.0,
        category="unknown",
        phase_at_stp="unknown",
        electron_configuration="[Rn] 5f14 6d10 7s2 7p6",
        electron_configuration_semantic="[Rn] 5f14 6d10 7s2 7p6",
        electronegativity_pauling=None,
        first_ionization_energy=None,
        atomic_radius=None,
        covalent_radius=None,
        van_der_waals_radius=None,
        melting_point=None,
        boiling_point=None,
        density=None,
        oxidation_states=[],
        group=18,
        period=7,
        block="p",
        crystal_structure=None,
        magnetic_ordering=None,
        cpk_hex_color=None,
        isotopes=[],
        shells=[2, 8, 18, 32, 32, 18, 8],
        summary="Oganesson is a synthetic element.",
    )
    assert oganesson.electronegativity_pauling is None
    assert oganesson.melting_point is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && source venv/Scripts/activate && python -m pytest tests/test_element_model.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.models.element'`

- [ ] **Step 3: Implement Element model**

Create `backend/app/models/__init__.py` (empty file).

Create `backend/app/models/element.py`:
```python
from pydantic import BaseModel


class Isotope(BaseModel):
    mass_number: int
    atomic_mass: float
    abundance: float | None
    stable: bool


class Element(BaseModel):
    atomic_number: int
    symbol: str
    name: str
    atomic_mass: float
    category: str
    phase_at_stp: str
    electron_configuration: str
    electron_configuration_semantic: str
    electronegativity_pauling: float | None
    first_ionization_energy: float | None
    atomic_radius: float | None
    covalent_radius: float | None
    van_der_waals_radius: float | None
    melting_point: float | None
    boiling_point: float | None
    density: float | None
    oxidation_states: list[int]
    group: int | None
    period: int
    block: str
    crystal_structure: str | None
    magnetic_ordering: str | None
    cpk_hex_color: str | None
    isotopes: list[Isotope]
    shells: list[int]
    summary: str
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && source venv/Scripts/activate && python -m pytest tests/test_element_model.py -v`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/ backend/tests/test_element_model.py
git commit -m "$(cat <<'EOF'
feat: add Element Pydantic model with isotope data

Covers all 118 elements with optional fields for synthetic/poorly-characterized
elements. Includes isotope sub-model with mass, abundance, and stability.
EOF
)"
```

---

## Task 3: Generate Element Database

**Files:**
- Create: `backend/app/scripts/generate_elements.py`
- Create: `backend/app/data/elements.json`
- Create: `backend/tests/test_elements_data.py`

- [ ] **Step 1: Write test for generated data integrity**

Create `backend/tests/test_elements_data.py`:
```python
import json
from pathlib import Path

from app.models.element import Element


DATA_PATH = Path(__file__).parent.parent / "app" / "data" / "elements.json"


def test_elements_json_exists():
    assert DATA_PATH.exists(), "elements.json must exist"


def test_all_118_elements_present():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    assert len(data) == 118


def test_elements_are_valid_models():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    for entry in data:
        element = Element(**entry)
        assert 1 <= element.atomic_number <= 118


def test_elements_ordered_by_atomic_number():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    numbers = [e["atomic_number"] for e in data]
    assert numbers == list(range(1, 119))


def test_hydrogen_data_spot_check():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    h = data[0]
    assert h["symbol"] == "H"
    assert h["name"] == "Hydrogen"
    assert h["group"] == 1
    assert h["period"] == 1
    assert h["block"] == "s"


def test_gold_data_spot_check():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    au = next(e for e in data if e["symbol"] == "Au")
    assert au["atomic_number"] == 79
    assert au["name"] == "Gold"
    assert au["group"] == 11
    assert au["period"] == 6
    assert au["block"] == "d"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && source venv/Scripts/activate && python -m pytest tests/test_elements_data.py -v`
Expected: FAIL — `elements.json` does not exist yet.

- [ ] **Step 3: Create the element data generation script**

Create `backend/app/scripts/generate_elements.py`:
```python
"""Generate elements.json from the mendeleev library.

Usage: python -m app.scripts.generate_elements
"""

import json
from pathlib import Path

from mendeleev import get_all_elements


PHASE_MAP = {
    "gas": "gas",
    "liquid": "liquid",
    "solid": "solid",
}

CATEGORY_MAP = {
    "Nonmetal": "nonmetal",
    "Noble gas": "noble gas",
    "Alkali metal": "alkali metal",
    "Alkaline earth metal": "alkaline earth metal",
    "Metalloid": "metalloid",
    "Halogen": "halogen",
    "Post-transition metal": "post-transition metal",
    "Transition metal": "transition metal",
    "Lanthanide": "lanthanide",
    "Actinide": "actinide",
}


def get_isotopes(element) -> list[dict]:
    isotopes = []
    for iso in element.isotopes:
        isotopes.append({
            "mass_number": iso.mass_number,
            "atomic_mass": round(iso.atomic_mass, 5) if iso.atomic_mass else 0.0,
            "abundance": round(iso.abundance, 6) if iso.abundance else None,
            "stable": iso.is_stable if hasattr(iso, "is_stable") else (iso.half_life is None),
        })
    return isotopes


def get_oxidation_states(element) -> list[int]:
    if element.oxidation_states:
        return sorted(set(element.oxidation_states))
    return []


def generate():
    output_path = Path(__file__).parent.parent / "data" / "elements.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    elements_data = []

    for el in get_all_elements():
        # Determine category
        category = CATEGORY_MAP.get(el.series, "unknown")

        # Determine phase at STP (approximate for elements without data)
        phase = "unknown"
        if el.boiling_point and el.melting_point:
            if el.melting_point > 298.15:
                phase = "solid"
            elif el.boiling_point < 298.15:
                phase = "gas"
            else:
                phase = "liquid"
        elif el.atomic_number <= 109:
            phase = "solid"  # most elements are solid at STP

        entry = {
            "atomic_number": el.atomic_number,
            "symbol": el.symbol,
            "name": el.name,
            "atomic_mass": round(el.atomic_weight, 4) if el.atomic_weight else el.mass_number,
            "category": category,
            "phase_at_stp": phase,
            "electron_configuration": el.econf or "",
            "electron_configuration_semantic": el.econf or "",
            "electronegativity_pauling": round(el.electronegativity("pauling"), 2) if el.electronegativity("pauling") else None,
            "first_ionization_energy": round(el.ionenergies.get(1, 0), 2) if el.ionenergies.get(1) else None,
            "atomic_radius": el.atomic_radius,
            "covalent_radius": el.covalent_radius_pyykko,
            "van_der_waals_radius": el.vdw_radius,
            "melting_point": round(el.melting_point - 273.15, 2) if el.melting_point else None,
            "boiling_point": round(el.boiling_point - 273.15, 2) if el.boiling_point else None,
            "density": el.density,
            "oxidation_states": get_oxidation_states(el),
            "group": el.group_id,
            "period": el.period,
            "block": el.block,
            "crystal_structure": el.lattice_structure,
            "magnetic_ordering": None,  # mendeleev doesn't provide this directly
            "cpk_hex_color": el.cpk_color if hasattr(el, "cpk_color") else None,
            "isotopes": get_isotopes(el),
            "shells": el.electrons_per_shell() if hasattr(el, "electrons_per_shell") else [],
            "summary": el.description or f"{el.name} is element {el.atomic_number}.",
        }
        elements_data.append(entry)

    # Sort by atomic number
    elements_data.sort(key=lambda e: e["atomic_number"])

    output_path.write_text(
        json.dumps(elements_data, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Generated {len(elements_data)} elements to {output_path}")


if __name__ == "__main__":
    generate()
```

**Note for implementer:** The `mendeleev` library API may differ slightly between versions. If attributes like `electrons_per_shell`, `cpk_color`, or `is_stable` on isotopes don't exist, check `dir(element)` and `dir(isotope)` and adapt the script accordingly. The key goal is to extract all available data for each element. Run the script interactively first to verify field access works, then adjust before committing.

- [ ] **Step 4: Run the generation script**

Run:
```bash
cd backend && source venv/Scripts/activate && python -m app.scripts.generate_elements
```
Expected: `Generated 118 elements to backend/app/data/elements.json`

- [ ] **Step 5: Run data integrity tests**

Run: `cd backend && source venv/Scripts/activate && python -m pytest tests/test_elements_data.py -v`
Expected: All 6 tests pass.

- [ ] **Step 6: Commit**

```bash
git add backend/app/scripts/ backend/app/data/elements.json backend/tests/test_elements_data.py
git commit -m "$(cat <<'EOF'
feat: generate element database with all 118 elements

Script uses mendeleev library to produce elements.json with atomic properties,
electron configurations, isotope data, oxidation states, and physical properties.
EOF
)"
```

---

## Task 4: Element API Endpoints

**Files:**
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/elements.py`
- Create: `backend/tests/test_elements_api.py`
- Modify: `backend/app/main.py` — mount router

- [ ] **Step 1: Write failing tests for element endpoints**

Create `backend/tests/test_elements_api.py`:
```python
def test_get_all_elements(client):
    response = client.get("/api/elements")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 118
    assert data[0]["symbol"] == "H"
    assert data[117]["symbol"] == "Og"


def test_get_element_by_number(client):
    response = client.get("/api/elements/6")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "C"
    assert data["name"] == "Carbon"
    assert data["atomic_number"] == 6


def test_get_element_not_found(client):
    response = client.get("/api/elements/999")
    assert response.status_code == 404


def test_get_element_by_symbol(client):
    response = client.get("/api/elements/search", params={"symbol": "Fe"})
    assert response.status_code == 200
    data = response.json()
    assert data["atomic_number"] == 26
    assert data["name"] == "Iron"


def test_search_element_not_found(client):
    response = client.get("/api/elements/search", params={"symbol": "Xx"})
    assert response.status_code == 404
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && source venv/Scripts/activate && python -m pytest tests/test_elements_api.py -v`
Expected: FAIL — 404 on all routes (not yet mounted).

- [ ] **Step 3: Implement element API router**

Create `backend/app/api/__init__.py` (empty file).

Create `backend/app/api/elements.py`:
```python
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

from app.models.element import Element

router = APIRouter(prefix="/api/elements", tags=["elements"])

_DATA_PATH = Path(__file__).parent.parent / "data" / "elements.json"
_elements: list[dict] = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
_by_number: dict[int, dict] = {e["atomic_number"]: e for e in _elements}
_by_symbol: dict[str, dict] = {e["symbol"]: e for e in _elements}


@router.get("", response_model=list[Element])
def get_all_elements():
    return _elements


@router.get("/search", response_model=Element)
def search_element(symbol: str = Query(..., min_length=1, max_length=3)):
    element = _by_symbol.get(symbol)
    if not element:
        raise HTTPException(status_code=404, detail=f"Element with symbol '{symbol}' not found")
    return element


@router.get("/{atomic_number}", response_model=Element)
def get_element(atomic_number: int):
    element = _by_number.get(atomic_number)
    if not element:
        raise HTTPException(status_code=404, detail=f"Element {atomic_number} not found")
    return element
```

- [ ] **Step 4: Mount router in main.py**

Update `backend/app/main.py` — add after CORS middleware:
```python
from app.api.elements import router as elements_router

app.include_router(elements_router)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && source venv/Scripts/activate && python -m pytest tests/test_elements_api.py -v`
Expected: 5 passed

- [ ] **Step 6: Run all backend tests**

Run: `cd backend && source venv/Scripts/activate && python -m pytest tests/ -v`
Expected: All tests pass (model tests + data tests + API tests).

- [ ] **Step 7: Commit**

```bash
git add backend/app/api/ backend/app/main.py backend/tests/test_elements_api.py
git commit -m "$(cat <<'EOF'
feat: add element API endpoints

GET /api/elements — list all 118 elements
GET /api/elements/{number} — get by atomic number
GET /api/elements/search?symbol=Fe — search by symbol
EOF
)"
```

---

## Task 5: Frontend Scaffolding

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/postcss.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/index.css`

- [ ] **Step 1: Scaffold Vite React TypeScript project**

Run:
```bash
cd "D:/CodeProjects/ChemistrySimulator" && npm create vite@latest frontend -- --template react-ts
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
cd frontend && npm install @react-three/fiber @react-three/drei @react-three/postprocessing three zustand @tanstack/react-query chart.js react-chartjs-2 @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-context-menu react-dnd react-dnd-html5-backend tailwindcss @tailwindcss/vite
```

Run:
```bash
cd frontend && npm install -D @types/three vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

- [ ] **Step 3: Configure Tailwind CSS**

Replace `frontend/src/index.css` with:
```css
@import "tailwindcss";
```

Update `frontend/vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 4: Configure Vitest**

Add to `frontend/vite.config.ts` (merge with existing config):
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

Create `frontend/src/test/setup.ts`:
```typescript
import "@testing-library/jest-dom/vitest";
```

Add to `frontend/tsconfig.json` under `compilerOptions`:
```json
"types": ["vitest/globals"]
```

- [ ] **Step 5: Create minimal App component**

Replace `frontend/src/App.tsx`:
```tsx
export default function App() {
  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex items-center justify-center">
      <h1 className="text-2xl font-bold">Chemistry Simulator</h1>
    </div>
  );
}
```

Replace `frontend/src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
```

- [ ] **Step 6: Verify frontend starts**

Run:
```bash
cd frontend && npm run dev
```
Expected: Vite dev server starts on http://localhost:5173, shows "Chemistry Simulator" centered on a dark background.

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "$(cat <<'EOF'
feat: scaffold frontend with React, TypeScript, Vite, Tailwind

Includes R3F, Zustand, TanStack Query, Tailwind CSS, Radix UI, react-dnd.
Vite proxies /api to backend on port 8000. Vitest configured with jsdom.
EOF
)"
```

---

## Task 6: TypeScript Types & API Client

**Files:**
- Create: `frontend/src/types/element.ts`
- Create: `frontend/src/api/elements.ts`

- [ ] **Step 1: Define Element TypeScript types**

Create `frontend/src/types/element.ts`:
```typescript
export interface Isotope {
  mass_number: number;
  atomic_mass: number;
  abundance: number | null;
  stable: boolean;
}

export interface Element {
  atomic_number: number;
  symbol: string;
  name: string;
  atomic_mass: number;
  category: string;
  phase_at_stp: string;
  electron_configuration: string;
  electron_configuration_semantic: string;
  electronegativity_pauling: number | null;
  first_ionization_energy: number | null;
  atomic_radius: number | null;
  covalent_radius: number | null;
  van_der_waals_radius: number | null;
  melting_point: number | null;
  boiling_point: number | null;
  density: number | null;
  oxidation_states: number[];
  group: number | null;
  period: number;
  block: string;
  crystal_structure: string | null;
  magnetic_ordering: string | null;
  cpk_hex_color: string | null;
  isotopes: Isotope[];
  shells: number[];
  summary: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  "nonmetal": "#22c55e",
  "noble gas": "#a78bfa",
  "alkali metal": "#ef4444",
  "alkaline earth metal": "#f59e0b",
  "metalloid": "#06b6d4",
  "halogen": "#34d399",
  "post-transition metal": "#60a5fa",
  "transition metal": "#f472b6",
  "lanthanide": "#fb923c",
  "actinide": "#e879f9",
  "unknown": "#64748b",
};
```

- [ ] **Step 2: Create TanStack Query hooks**

Create `frontend/src/api/elements.ts`:
```typescript
import { useQuery } from "@tanstack/react-query";
import type { Element } from "../types/element";

async function fetchElements(): Promise<Element[]> {
  const response = await fetch("/api/elements");
  if (!response.ok) throw new Error("Failed to fetch elements");
  return response.json();
}

async function fetchElement(atomicNumber: number): Promise<Element> {
  const response = await fetch(`/api/elements/${atomicNumber}`);
  if (!response.ok) throw new Error(`Failed to fetch element ${atomicNumber}`);
  return response.json();
}

export function useElements() {
  return useQuery({
    queryKey: ["elements"],
    queryFn: fetchElements,
    staleTime: Infinity,
  });
}

export function useElement(atomicNumber: number | null) {
  return useQuery({
    queryKey: ["elements", atomicNumber],
    queryFn: () => fetchElement(atomicNumber!),
    enabled: atomicNumber !== null,
    staleTime: Infinity,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/ frontend/src/api/
git commit -m "$(cat <<'EOF'
feat: add Element types and TanStack Query API hooks

TypeScript interfaces mirror backend Pydantic models. Category color map for
periodic table rendering. Query hooks with infinite stale time (element data is static).
EOF
)"
```

---

## Task 7: Zustand Store

**Files:**
- Create: `frontend/src/stores/labStore.ts`
- Create: `frontend/src/test/labStore.test.ts`

- [ ] **Step 1: Write failing store tests**

Create `frontend/src/test/labStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useLabStore } from "../stores/labStore";

describe("labStore", () => {
  beforeEach(() => {
    useLabStore.setState(useLabStore.getInitialState());
  });

  it("starts with no selected element", () => {
    expect(useLabStore.getState().selectedElement).toBeNull();
  });

  it("selects an element", () => {
    useLabStore.getState().selectElement(6);
    expect(useLabStore.getState().selectedElement).toBe(6);
  });

  it("clears selected element", () => {
    useLabStore.getState().selectElement(6);
    useLabStore.getState().selectElement(null);
    expect(useLabStore.getState().selectedElement).toBeNull();
  });

  it("starts on main-bench station", () => {
    expect(useLabStore.getState().activeStation).toBe("main-bench");
  });

  it("switches stations", () => {
    useLabStore.getState().setStation("fume-hood");
    expect(useLabStore.getState().activeStation).toBe("fume-hood");
  });

  it("tracks bench items", () => {
    useLabStore.getState().addBenchItem({
      id: "beaker-1",
      type: "beaker",
      position: [0, 0, 0],
      contents: [],
    });
    expect(useLabStore.getState().benchItems).toHaveLength(1);
    expect(useLabStore.getState().benchItems[0].id).toBe("beaker-1");
  });

  it("moves a bench item", () => {
    useLabStore.getState().addBenchItem({
      id: "beaker-1",
      type: "beaker",
      position: [0, 0, 0],
      contents: [],
    });
    useLabStore.getState().moveBenchItem("beaker-1", [1, 0, 2]);
    expect(useLabStore.getState().benchItems[0].position).toEqual([1, 0, 2]);
  });

  it("removes a bench item", () => {
    useLabStore.getState().addBenchItem({
      id: "beaker-1",
      type: "beaker",
      position: [0, 0, 0],
      contents: [],
    });
    useLabStore.getState().removeBenchItem("beaker-1");
    expect(useLabStore.getState().benchItems).toHaveLength(0);
  });

  it("selects a bench item", () => {
    useLabStore.getState().selectBenchItem("beaker-1");
    expect(useLabStore.getState().selectedBenchItem).toBe("beaker-1");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run src/test/labStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the store**

Create `frontend/src/stores/labStore.ts`:
```typescript
import { create } from "zustand";

export type StationId =
  | "main-bench"
  | "fume-hood"
  | "instrument-room"
  | "electrochemistry"
  | "glove-box"
  | "thermal-analysis"
  | "storage-safety";

export interface BenchItem {
  id: string;
  type: string;
  position: [number, number, number];
  contents: string[];
}

interface LabState {
  selectedElement: number | null;
  activeStation: StationId;
  benchItems: BenchItem[];
  selectedBenchItem: string | null;
  environment: {
    temperature: number;
    pressure: number;
    atmosphere: string;
  };

  selectElement: (atomicNumber: number | null) => void;
  setStation: (station: StationId) => void;
  addBenchItem: (item: BenchItem) => void;
  removeBenchItem: (id: string) => void;
  moveBenchItem: (id: string, position: [number, number, number]) => void;
  selectBenchItem: (id: string | null) => void;
}

export const useLabStore = create<LabState>()((set) => ({
  selectedElement: null,
  activeStation: "main-bench",
  benchItems: [],
  selectedBenchItem: null,
  environment: {
    temperature: 25,
    pressure: 1,
    atmosphere: "air",
  },

  selectElement: (atomicNumber) => set({ selectedElement: atomicNumber }),
  setStation: (station) => set({ activeStation: station }),
  addBenchItem: (item) =>
    set((state) => ({ benchItems: [...state.benchItems, item] })),
  removeBenchItem: (id) =>
    set((state) => ({
      benchItems: state.benchItems.filter((item) => item.id !== id),
      selectedBenchItem:
        state.selectedBenchItem === id ? null : state.selectedBenchItem,
    })),
  moveBenchItem: (id, position) =>
    set((state) => ({
      benchItems: state.benchItems.map((item) =>
        item.id === id ? { ...item, position } : item
      ),
    })),
  selectBenchItem: (id) => set({ selectedBenchItem: id }),
}));
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/test/labStore.test.ts`
Expected: 8 passed

- [ ] **Step 5: Commit**

```bash
git add frontend/src/stores/ frontend/src/test/labStore.test.ts
git commit -m "$(cat <<'EOF'
feat: add Zustand lab store for app state

Tracks selected element, active station, bench items with positions,
selected bench item, and environment settings (temp, pressure, atmosphere).
EOF
)"
```

---

## Task 8: App Layout Shell

**Files:**
- Create: `frontend/src/components/ui/StationTabs.tsx`
- Create: `frontend/src/components/ui/EnvironmentBar.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create StationTabs component**

Create `frontend/src/components/ui/StationTabs.tsx`:
```tsx
import * as Tabs from "@radix-ui/react-tabs";
import { useLabStore, type StationId } from "../../stores/labStore";

const STATIONS: { id: StationId; label: string }[] = [
  { id: "main-bench", label: "Main Bench" },
  { id: "fume-hood", label: "Fume Hood" },
  { id: "instrument-room", label: "Instruments" },
  { id: "electrochemistry", label: "Electrochemistry" },
  { id: "glove-box", label: "Glove Box" },
  { id: "thermal-analysis", label: "Thermal Analysis" },
  { id: "storage-safety", label: "Storage & Safety" },
];

export default function StationTabs() {
  const activeStation = useLabStore((s) => s.activeStation);
  const setStation = useLabStore((s) => s.setStation);

  return (
    <Tabs.Root value={activeStation} onValueChange={(v) => setStation(v as StationId)}>
      <Tabs.List className="flex gap-1 bg-gray-900 px-2 pt-2">
        {STATIONS.map((station) => (
          <Tabs.Trigger
            key={station.id}
            value={station.id}
            className="px-3 py-1.5 text-sm rounded-t-md transition-colors
              data-[state=active]:bg-gray-800 data-[state=active]:text-white
              data-[state=inactive]:bg-gray-900 data-[state=inactive]:text-gray-500
              hover:text-gray-300"
          >
            {station.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
```

- [ ] **Step 2: Create EnvironmentBar component**

Create `frontend/src/components/ui/EnvironmentBar.tsx`:
```tsx
import { useLabStore } from "../../stores/labStore";

export default function EnvironmentBar() {
  const env = useLabStore((s) => s.environment);

  return (
    <div className="flex items-center gap-4 bg-gray-900 px-4 py-2 text-xs border-t border-gray-800">
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Temp:</span>
        <span className="text-emerald-400">{env.temperature}°C</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Pressure:</span>
        <span className="text-emerald-400">{env.pressure} atm</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Atmosphere:</span>
        <span className="text-blue-400">{env.atmosphere}</span>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="text-gray-500">Safety:</span>
        <span className="text-green-400">All Clear</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build the App layout**

Update `frontend/src/App.tsx`:
```tsx
import StationTabs from "./components/ui/StationTabs";
import EnvironmentBar from "./components/ui/EnvironmentBar";

export default function App() {
  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Station tabs */}
      <StationTabs />

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel: will hold periodic table / inventory */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 p-3 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">Periodic Table</h2>
          <p className="text-xs text-gray-600">Coming next...</p>
        </div>

        {/* Center: 3D lab scene */}
        <div className="flex-1 bg-gray-950 flex items-center justify-center">
          <p className="text-gray-600">3D Lab Scene</p>
        </div>

        {/* Right panel: element inspector */}
        <div className="w-72 bg-gray-900 border-l border-gray-800 p-3 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">Inspector</h2>
          <p className="text-xs text-gray-600">Select an element...</p>
        </div>
      </div>

      {/* Bottom: environment bar */}
      <EnvironmentBar />
    </div>
  );
}
```

- [ ] **Step 4: Verify layout renders**

Run: `cd frontend && npm run dev`
Expected: Full layout visible — tabs across top, left panel placeholder, center area, right panel placeholder, environment bar at bottom. Clicking station tabs updates the active tab.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/
git commit -m "$(cat <<'EOF'
feat: add app layout shell with station tabs and environment bar

Three-panel layout: left (inventory), center (3D scene), right (inspector).
Station tabs switch between 7 lab stations. Environment bar shows temp/pressure/atmosphere.
EOF
)"
```

---

## Task 9: Interactive Periodic Table

**Files:**
- Create: `frontend/src/components/ui/PeriodicTable.tsx`
- Create: `frontend/src/test/PeriodicTable.test.tsx`
- Modify: `frontend/src/App.tsx` — integrate periodic table

- [ ] **Step 1: Write failing periodic table test**

Create `frontend/src/test/PeriodicTable.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PeriodicTable from "../components/ui/PeriodicTable";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("PeriodicTable", () => {
  it("renders loading state initially", () => {
    renderWithProviders(<PeriodicTable />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/test/PeriodicTable.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement PeriodicTable component**

Create `frontend/src/components/ui/PeriodicTable.tsx`:
```tsx
import { useElements } from "../../api/elements";
import { useLabStore } from "../../stores/labStore";
import { CATEGORY_COLORS } from "../../types/element";

// Standard periodic table layout: [row, col] for each atomic number.
// Lanthanides (57-71) go in row 8, Actinides (89-103) go in row 9.
const LAYOUT: Record<number, [number, number]> = {};

// Row 1
LAYOUT[1] = [0, 0]; LAYOUT[2] = [0, 17];
// Row 2
LAYOUT[3] = [1, 0]; LAYOUT[4] = [1, 1];
for (let i = 5; i <= 10; i++) LAYOUT[i] = [1, i + 7];
// Row 3
LAYOUT[11] = [2, 0]; LAYOUT[12] = [2, 1];
for (let i = 13; i <= 18; i++) LAYOUT[i] = [2, i - 1];
// Row 4
for (let i = 19; i <= 36; i++) LAYOUT[i] = [3, i - 19];
// Row 5
for (let i = 37; i <= 54; i++) LAYOUT[i] = [4, i - 37];
// Row 6
LAYOUT[55] = [5, 0]; LAYOUT[56] = [5, 1];
// La-Lu go to row 8
for (let i = 57; i <= 71; i++) LAYOUT[i] = [8, i - 57 + 2];
for (let i = 72; i <= 86; i++) LAYOUT[i] = [5, i - 72 + 3];
// Row 7
LAYOUT[87] = [6, 0]; LAYOUT[88] = [6, 1];
// Ac-Lr go to row 9
for (let i = 89; i <= 103; i++) LAYOUT[i] = [9, i - 89 + 2];
for (let i = 104; i <= 118; i++) LAYOUT[i] = [6, i - 104 + 3];

export default function PeriodicTable() {
  const { data: elements, isLoading, error } = useElements();
  const selectedElement = useLabStore((s) => s.selectedElement);
  const selectElement = useLabStore((s) => s.selectElement);

  if (isLoading) return <p className="text-xs text-gray-500">Loading elements...</p>;
  if (error) return <p className="text-xs text-red-500">Failed to load elements</p>;
  if (!elements) return null;

  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(18, 1fr)", gridTemplateRows: "repeat(10, 1fr)" }}>
      {elements.map((el) => {
        const pos = LAYOUT[el.atomic_number];
        if (!pos) return null;
        const [row, col] = pos;
        const color = CATEGORY_COLORS[el.category] || CATEGORY_COLORS.unknown;
        const isSelected = selectedElement === el.atomic_number;

        return (
          <button
            key={el.atomic_number}
            onClick={() => selectElement(isSelected ? null : el.atomic_number)}
            className="flex flex-col items-center justify-center p-0.5 rounded-sm transition-all hover:scale-110 hover:z-10 cursor-pointer border"
            style={{
              gridRow: row + 1,
              gridColumn: col + 1,
              backgroundColor: isSelected ? color : `${color}22`,
              borderColor: isSelected ? color : `${color}44`,
              color: isSelected ? "#000" : color,
            }}
            title={`${el.name} (${el.symbol}) — ${el.atomic_number}`}
          >
            <span className="text-[7px] leading-none opacity-60">{el.atomic_number}</span>
            <span className="text-[10px] font-bold leading-tight">{el.symbol}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/test/PeriodicTable.test.tsx`
Expected: PASS

- [ ] **Step 5: Integrate into App.tsx**

Update the left panel in `frontend/src/App.tsx`:
```tsx
import PeriodicTable from "./components/ui/PeriodicTable";
```

Replace the left panel content:
```tsx
<div className="w-80 bg-gray-900 border-r border-gray-800 p-3 overflow-y-auto">
  <h2 className="text-sm font-semibold text-gray-400 mb-2">Periodic Table</h2>
  <PeriodicTable />
</div>
```

- [ ] **Step 6: Verify visually with backend running**

Run backend: `cd backend && source venv/Scripts/activate && uvicorn app.main:app --reload --port 8000`
Run frontend: `cd frontend && npm run dev`

Expected: Periodic table renders in left panel with all 118 elements in correct layout. Clicking an element highlights it. Clicking again deselects.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/
git commit -m "$(cat <<'EOF'
feat: add interactive periodic table with element selection

Standard 18-column layout with lanthanides/actinides in separate rows.
Color-coded by category. Click to select/deselect elements.
EOF
)"
```

---

## Task 10: Element Inspector Panel

**Files:**
- Create: `frontend/src/components/ui/ElementInspector.tsx`
- Modify: `frontend/src/App.tsx` — integrate inspector

- [ ] **Step 1: Implement ElementInspector component**

Create `frontend/src/components/ui/ElementInspector.tsx`:
```tsx
import { useLabStore } from "../../stores/labStore";
import { useElement } from "../../api/elements";
import { CATEGORY_COLORS } from "../../types/element";

export default function ElementInspector() {
  const selectedElement = useLabStore((s) => s.selectedElement);
  const { data: element, isLoading } = useElement(selectedElement);

  if (!selectedElement) {
    return <p className="text-xs text-gray-600">Select an element from the periodic table</p>;
  }

  if (isLoading || !element) {
    return <p className="text-xs text-gray-500">Loading...</p>;
  }

  const color = CATEGORY_COLORS[element.category] || CATEGORY_COLORS.unknown;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="text-5xl font-bold" style={{ color }}>{element.symbol}</div>
        <div className="text-lg font-semibold">{element.name}</div>
        <div className="text-xs text-gray-400">
          #{element.atomic_number} &middot; {element.category}
        </div>
      </div>

      {/* Basic Properties */}
      <Section title="Properties">
        <Row label="Atomic Mass" value={`${element.atomic_mass} u`} />
        <Row label="Phase (STP)" value={element.phase_at_stp} />
        <Row label="Block" value={element.block.toUpperCase()} />
        <Row label="Group" value={element.group ?? "N/A"} />
        <Row label="Period" value={element.period} />
        {element.density && <Row label="Density" value={`${element.density} g/cm³`} />}
      </Section>

      {/* Electron Configuration */}
      <Section title="Electron Configuration">
        <p className="text-xs text-gray-300 font-mono">{element.electron_configuration}</p>
        {element.shells.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">Shells: {element.shells.join(", ")}</p>
        )}
      </Section>

      {/* Atomic Properties */}
      <Section title="Atomic Properties">
        {element.electronegativity_pauling && (
          <Row label="Electronegativity" value={element.electronegativity_pauling} />
        )}
        {element.first_ionization_energy && (
          <Row label="1st Ionization" value={`${element.first_ionization_energy} kJ/mol`} />
        )}
        {element.atomic_radius && <Row label="Atomic Radius" value={`${element.atomic_radius} pm`} />}
        {element.covalent_radius && <Row label="Covalent Radius" value={`${element.covalent_radius} pm`} />}
        {element.van_der_waals_radius && (
          <Row label="Van der Waals" value={`${element.van_der_waals_radius} pm`} />
        )}
      </Section>

      {/* Thermal Properties */}
      <Section title="Thermal Properties">
        {element.melting_point != null && <Row label="Melting Point" value={`${element.melting_point}°C`} />}
        {element.boiling_point != null && <Row label="Boiling Point" value={`${element.boiling_point}°C`} />}
      </Section>

      {/* Oxidation States */}
      {element.oxidation_states.length > 0 && (
        <Section title="Oxidation States">
          <div className="flex flex-wrap gap-1">
            {element.oxidation_states.map((os) => (
              <span
                key={os}
                className="px-1.5 py-0.5 text-xs rounded bg-gray-800 text-gray-300"
              >
                {os > 0 ? `+${os}` : os}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Isotopes */}
      {element.isotopes.length > 0 && (
        <Section title={`Isotopes (${element.isotopes.length})`}>
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {element.isotopes
              .filter((iso) => iso.stable || (iso.abundance && iso.abundance > 0.001))
              .map((iso) => (
                <div key={iso.mass_number} className="flex justify-between text-xs">
                  <span className="text-gray-400">
                    <sup>{iso.mass_number}</sup>{element.symbol}
                    {iso.stable && <span className="text-green-500 ml-1">stable</span>}
                  </span>
                  {iso.abundance && (
                    <span className="text-gray-500">{(iso.abundance * 100).toFixed(2)}%</span>
                  )}
                </div>
              ))}
          </div>
        </Section>
      )}

      {/* Summary */}
      <Section title="About">
        <p className="text-xs text-gray-400 leading-relaxed">{element.summary}</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300">{value}</span>
    </div>
  );
}
```

- [ ] **Step 2: Integrate into App.tsx**

Add import:
```tsx
import ElementInspector from "./components/ui/ElementInspector";
```

Replace the right panel content:
```tsx
<div className="w-72 bg-gray-900 border-l border-gray-800 p-3 overflow-y-auto">
  <h2 className="text-sm font-semibold text-gray-400 mb-2">Inspector</h2>
  <ElementInspector />
</div>
```

- [ ] **Step 3: Verify visually**

With both servers running, click an element in the periodic table. Right panel should show full element details: symbol, name, properties, electron config, thermal data, oxidation states, isotopes, and summary.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "$(cat <<'EOF'
feat: add element inspector panel with full property display

Shows all element data: properties, electron configuration, atomic radii,
thermal data, oxidation states, isotopes with abundances, and summary text.
EOF
)"
```

---

## Task 11: 3D Lab Scene Setup

**Files:**
- Create: `frontend/src/components/lab/LabScene.tsx`
- Modify: `frontend/src/App.tsx` — embed scene

- [ ] **Step 1: Create LabScene with R3F canvas**

Create `frontend/src/components/lab/LabScene.tsx`:
```tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";

export default function LabScene() {
  return (
    <Canvas
      camera={{
        position: [0, 5, 5],
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      shadows
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-3, 4, -3]} intensity={0.3} color="#b4d4ff" />

      {/* Camera controls — orbit around bench center */}
      <OrbitControls
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={2}
        maxDistance={12}
        enablePan
      />

      {/* Ground grid for spatial reference */}
      <Grid
        position={[0, -0.01, 0]}
        args={[10, 10]}
        cellSize={0.5}
        cellColor="#1e293b"
        sectionSize={2}
        sectionColor="#334155"
        fadeDistance={15}
        infiniteGrid
      />

      {/* Lab bench surface */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[4, 0.1, 2.5]} />
        <meshStandardMaterial color="#44403c" roughness={0.8} />
      </mesh>

      {/* Bench legs */}
      {[[-1.8, -0.45, -1.1], [1.8, -0.45, -1.1], [-1.8, -0.45, 1.1], [1.8, -0.45, 1.1]].map(
        (pos, i) => (
          <mesh key={i} position={pos as [number, number, number]} castShadow>
            <boxGeometry args={[0.08, 0.8, 0.08]} />
            <meshStandardMaterial color="#292524" />
          </mesh>
        )
      )}

      {/* Soft environment for reflections */}
      <Environment preset="apartment" />
    </Canvas>
  );
}
```

- [ ] **Step 2: Integrate into App.tsx**

Add import:
```tsx
import LabScene from "./components/lab/LabScene";
```

Replace the center placeholder:
```tsx
{/* Center: 3D lab scene */}
<div className="flex-1 bg-gray-950">
  <LabScene />
</div>
```

- [ ] **Step 3: Verify visually**

Run frontend. Expected: A 3D lab bench appears in the center. You can orbit (middle/left drag), zoom (scroll), and pan (shift+drag). The bench has a dark stone-colored surface, 4 legs, and a subtle grid beneath it. Soft lighting from multiple sources.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "$(cat <<'EOF'
feat: add 3D lab scene with bench, lighting, and orbit controls

R3F canvas with directional + ambient + point lights, shadow mapping,
orbit controls constrained to tabletop view, grid floor, and lab bench mesh.
EOF
)"
```

---

## Task 12: Main Bench Station

**Files:**
- Create: `frontend/src/components/lab/stations/MainBench.tsx`
- Modify: `frontend/src/components/lab/LabScene.tsx` — render station based on active tab

- [ ] **Step 1: Create MainBench component**

Create `frontend/src/components/lab/stations/MainBench.tsx`:
```tsx
import { useLabStore } from "../../../stores/labStore";

export default function MainBench() {
  const benchItems = useLabStore((s) => s.benchItems);
  const selectBenchItem = useLabStore((s) => s.selectBenchItem);
  const selectedBenchItem = useLabStore((s) => s.selectedBenchItem);

  return (
    <group>
      {/* Bench back wall / shelf */}
      <mesh position={[0, 0.6, -1.25]} castShadow>
        <boxGeometry args={[4, 1.1, 0.05]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.9} />
      </mesh>

      {/* Shelf */}
      <mesh position={[0, 0.35, -1.1]} castShadow>
        <boxGeometry args={[3.8, 0.04, 0.3]} />
        <meshStandardMaterial color="#44403c" roughness={0.8} />
      </mesh>

      {/* Test tube rack on shelf */}
      <mesh position={[-1.2, 0.42, -1.05]}>
        <boxGeometry args={[0.4, 0.1, 0.15]} />
        <meshStandardMaterial color="#78716c" />
      </mesh>

      {/* Bunsen burner spot (placeholder cylinder) */}
      <mesh position={[1.5, 0.12, 0.5]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.15, 16]} />
        <meshStandardMaterial color="#52525b" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Analytics balance area marker */}
      <mesh position={[-1.5, 0.06, 0.8]} receiveShadow>
        <boxGeometry args={[0.5, 0.02, 0.4]} />
        <meshStandardMaterial color="#1c1917" roughness={0.5} />
      </mesh>

      {/* Render placed bench items */}
      {benchItems.map((item) => (
        <mesh
          key={item.id}
          position={item.position}
          onClick={(e) => {
            e.stopPropagation();
            selectBenchItem(selectedBenchItem === item.id ? null : item.id);
          }}
        >
          <boxGeometry args={[0.15, 0.2, 0.15]} />
          <meshStandardMaterial
            color={selectedBenchItem === item.id ? "#60a5fa" : "#a8a29e"}
            wireframe={selectedBenchItem === item.id}
          />
        </mesh>
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Integrate into LabScene**

Update `frontend/src/components/lab/LabScene.tsx` — add import and render inside Canvas (after the bench legs, before Environment):

```tsx
import { useLabStore } from "../../stores/labStore";
import MainBench from "./stations/MainBench";
```

Add inside the Canvas, before `<Environment>`:
```tsx
{/* Active station content */}
<StationContent />
```

Add a new component below the LabScene function (in the same file):
```tsx
function StationContent() {
  const activeStation = useLabStore((s) => s.activeStation);

  switch (activeStation) {
    case "main-bench":
      return <MainBench />;
    default:
      return null; // Other stations will be added in Phase 4
  }
}
```

- [ ] **Step 3: Verify visually**

Run frontend. Expected: Main Bench tab shows the bench with a back wall/shelf, test tube rack placeholder, Bunsen burner cylinder, and balance area. Switching to other tabs shows just the empty bench (stations not yet implemented).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "$(cat <<'EOF'
feat: add Main Bench station with shelf, rack, and equipment placeholders

Back wall with shelf, test tube rack, Bunsen burner spot, balance area.
Station switching renders content based on active tab.
EOF
)"
```

---

## Task 13: 3D Equipment Components

**Files:**
- Create: `frontend/src/components/lab/equipment/Beaker.tsx`
- Create: `frontend/src/components/lab/equipment/TestTube.tsx`
- Create: `frontend/src/components/lab/equipment/ErlenmeyerFlask.tsx`
- Modify: `frontend/src/components/lab/stations/MainBench.tsx` — render actual equipment

- [ ] **Step 1: Create Beaker component**

Create `frontend/src/components/lab/equipment/Beaker.tsx`:
```tsx
import { useRef } from "react";
import { Cylinder } from "@react-three/drei";
import type { Mesh } from "three";

interface BeakerProps {
  position: [number, number, number];
  selected?: boolean;
  onClick?: () => void;
  fillLevel?: number; // 0 to 1
  fillColor?: string;
}

export default function Beaker({ position, selected, onClick, fillLevel = 0, fillColor = "#60a5fa" }: BeakerProps) {
  const meshRef = useRef<Mesh>(null);
  const height = 0.3;
  const radiusBottom = 0.08;
  const radiusTop = 0.1;

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      {/* Glass body */}
      <Cylinder
        ref={meshRef}
        args={[radiusTop, radiusBottom, height, 32, 1, true]}
        position={[0, height / 2 + 0.05, 0]}
        castShadow
      >
        <meshPhysicalMaterial
          color="#e2e8f0"
          transparent
          opacity={0.25}
          roughness={0.05}
          metalness={0.0}
          transmission={0.9}
          thickness={0.5}
        />
      </Cylinder>

      {/* Bottom disk */}
      <Cylinder args={[radiusBottom, radiusBottom, 0.01, 32]} position={[0, 0.055, 0]}>
        <meshPhysicalMaterial color="#e2e8f0" transparent opacity={0.3} transmission={0.8} />
      </Cylinder>

      {/* Liquid fill */}
      {fillLevel > 0 && (
        <Cylinder
          args={[
            radiusBottom + (radiusTop - radiusBottom) * fillLevel * 0.95,
            radiusBottom * 0.95,
            height * fillLevel * 0.9,
            32,
          ]}
          position={[0, 0.06 + (height * fillLevel * 0.9) / 2, 0]}
        >
          <meshStandardMaterial color={fillColor} transparent opacity={0.7} />
        </Cylinder>
      )}

      {/* Selection highlight */}
      {selected && (
        <Cylinder
          args={[radiusTop + 0.02, radiusBottom + 0.02, height + 0.02, 32, 1, true]}
          position={[0, height / 2 + 0.05, 0]}
        >
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} wireframe />
        </Cylinder>
      )}
    </group>
  );
}
```

- [ ] **Step 2: Create TestTube component**

Create `frontend/src/components/lab/equipment/TestTube.tsx`:
```tsx
import { Cylinder, Sphere } from "@react-three/drei";

interface TestTubeProps {
  position: [number, number, number];
  selected?: boolean;
  onClick?: () => void;
  fillLevel?: number;
  fillColor?: string;
}

export default function TestTube({ position, selected, onClick, fillLevel = 0, fillColor = "#22c55e" }: TestTubeProps) {
  const height = 0.25;
  const radius = 0.025;

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      {/* Glass tube */}
      <Cylinder args={[radius, radius, height, 16, 1, true]} position={[0, height / 2 + 0.05, 0]} castShadow>
        <meshPhysicalMaterial color="#e2e8f0" transparent opacity={0.2} transmission={0.9} roughness={0.05} />
      </Cylinder>

      {/* Rounded bottom */}
      <Sphere args={[radius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, 0.05, 0]} rotation={[Math.PI, 0, 0]}>
        <meshPhysicalMaterial color="#e2e8f0" transparent opacity={0.2} transmission={0.9} roughness={0.05} />
      </Sphere>

      {/* Liquid fill */}
      {fillLevel > 0 && (
        <Cylinder
          args={[radius * 0.9, radius * 0.9, height * fillLevel * 0.8, 16]}
          position={[0, 0.06 + (height * fillLevel * 0.8) / 2, 0]}
        >
          <meshStandardMaterial color={fillColor} transparent opacity={0.7} />
        </Cylinder>
      )}

      {/* Selection highlight */}
      {selected && (
        <Cylinder args={[radius + 0.01, radius + 0.01, height + 0.04, 16, 1, true]} position={[0, height / 2 + 0.05, 0]}>
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} wireframe />
        </Cylinder>
      )}
    </group>
  );
}
```

- [ ] **Step 3: Create ErlenmeyerFlask component**

Create `frontend/src/components/lab/equipment/ErlenmeyerFlask.tsx`:
```tsx
import { Cylinder, Cone } from "@react-three/drei";

interface ErlenmeyerFlaskProps {
  position: [number, number, number];
  selected?: boolean;
  onClick?: () => void;
  fillLevel?: number;
  fillColor?: string;
}

export default function ErlenmeyerFlask({ position, selected, onClick, fillLevel = 0, fillColor = "#f59e0b" }: ErlenmeyerFlaskProps) {
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      {/* Conical body */}
      <Cone args={[0.12, 0.22, 32, 1, true]} position={[0, 0.16, 0]} castShadow>
        <meshPhysicalMaterial color="#e2e8f0" transparent opacity={0.2} transmission={0.9} roughness={0.05} />
      </Cone>

      {/* Neck */}
      <Cylinder args={[0.02, 0.02, 0.12, 16, 1, true]} position={[0, 0.33, 0]}>
        <meshPhysicalMaterial color="#e2e8f0" transparent opacity={0.25} transmission={0.9} roughness={0.05} />
      </Cylinder>

      {/* Bottom disk */}
      <Cylinder args={[0.12, 0.12, 0.005, 32]} position={[0, 0.05, 0]}>
        <meshPhysicalMaterial color="#e2e8f0" transparent opacity={0.3} transmission={0.8} />
      </Cylinder>

      {/* Liquid fill */}
      {fillLevel > 0 && (
        <Cone
          args={[0.11 * fillLevel, 0.2 * fillLevel, 32]}
          position={[0, 0.06 + (0.2 * fillLevel) / 2, 0]}
        >
          <meshStandardMaterial color={fillColor} transparent opacity={0.7} />
        </Cone>
      )}

      {/* Selection highlight */}
      {selected && (
        <Cone args={[0.14, 0.24, 32, 1, true]} position={[0, 0.16, 0]}>
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} wireframe />
        </Cone>
      )}
    </group>
  );
}
```

- [ ] **Step 4: Add starter equipment to MainBench**

Update `frontend/src/components/lab/stations/MainBench.tsx` — add imports and render some default equipment:

```tsx
import Beaker from "../equipment/Beaker";
import TestTube from "../equipment/TestTube";
import ErlenmeyerFlask from "../equipment/ErlenmeyerFlask";
import { useLabStore } from "../../../stores/labStore";

export default function MainBench() {
  const selectedBenchItem = useLabStore((s) => s.selectedBenchItem);
  const selectBenchItem = useLabStore((s) => s.selectBenchItem);

  return (
    <group>
      {/* Bench back wall / shelf */}
      <mesh position={[0, 0.6, -1.25]} castShadow>
        <boxGeometry args={[4, 1.1, 0.05]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.9} />
      </mesh>

      {/* Shelf */}
      <mesh position={[0, 0.35, -1.1]} castShadow>
        <boxGeometry args={[3.8, 0.04, 0.3]} />
        <meshStandardMaterial color="#44403c" roughness={0.8} />
      </mesh>

      {/* Bunsen burner placeholder */}
      <mesh position={[1.5, 0.12, 0.5]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.15, 16]} />
        <meshStandardMaterial color="#52525b" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Balance area */}
      <mesh position={[-1.5, 0.06, 0.8]} receiveShadow>
        <boxGeometry args={[0.5, 0.02, 0.4]} />
        <meshStandardMaterial color="#1c1917" roughness={0.5} />
      </mesh>

      {/* Starter equipment on bench */}
      <Beaker
        position={[-0.5, 0.05, 0.3]}
        selected={selectedBenchItem === "beaker-1"}
        onClick={() => selectBenchItem(selectedBenchItem === "beaker-1" ? null : "beaker-1")}
        fillLevel={0.4}
        fillColor="#3b82f6"
      />
      <Beaker
        position={[0.3, 0.05, -0.2]}
        selected={selectedBenchItem === "beaker-2"}
        onClick={() => selectBenchItem(selectedBenchItem === "beaker-2" ? null : "beaker-2")}
      />
      <ErlenmeyerFlask
        position={[0.8, 0.0, 0.4]}
        selected={selectedBenchItem === "flask-1"}
        onClick={() => selectBenchItem(selectedBenchItem === "flask-1" ? null : "flask-1")}
        fillLevel={0.6}
        fillColor="#f59e0b"
      />

      {/* Test tubes on shelf rack */}
      {[0, 1, 2, 3, 4].map((i) => (
        <TestTube
          key={`tube-${i}`}
          position={[-1.35 + i * 0.07, 0.37, -1.05]}
          selected={selectedBenchItem === `tube-${i}`}
          onClick={() => selectBenchItem(selectedBenchItem === `tube-${i}` ? null : `tube-${i}`)}
          fillLevel={i === 1 ? 0.3 : i === 3 ? 0.5 : 0}
          fillColor={i === 1 ? "#22c55e" : "#a855f7"}
        />
      ))}
    </group>
  );
}
```

- [ ] **Step 5: Verify visually**

Run frontend. Expected: Main Bench shows transparent glass beakers, test tubes on the shelf with colored liquid fills, and an Erlenmeyer flask. Clicking equipment highlights with blue wireframe. Glass has realistic transparency.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/lab/
git commit -m "$(cat <<'EOF'
feat: add 3D glassware components — Beaker, TestTube, ErlenmeyerFlask

Parametric glass geometry with physical materials (transparency, transmission).
Liquid fill rendering with configurable level and color. Selection highlight wireframe.
Main Bench renders starter equipment on bench and shelf.
EOF
)"
```

---

## Task 14: Click-to-Place Equipment from Inventory

**Files:**
- Create: `frontend/src/components/ui/EquipmentPalette.tsx`
- Modify: `frontend/src/stores/labStore.ts` — add placement mode
- Modify: `frontend/src/components/lab/LabScene.tsx` — handle bench click for placement
- Modify: `frontend/src/App.tsx` — add equipment palette below periodic table

- [ ] **Step 1: Extend labStore with placement mode**

Add to `frontend/src/stores/labStore.ts`:

Add to the interface:
```typescript
placingEquipment: string | null;
setPlacingEquipment: (type: string | null) => void;
```

Add to the store state:
```typescript
placingEquipment: null,
setPlacingEquipment: (type) => set({ placingEquipment: type }),
```

Update `addBenchItem` to also clear placement mode:
```typescript
addBenchItem: (item) =>
  set((state) => ({
    benchItems: [...state.benchItems, item],
    placingEquipment: null,
  })),
```

- [ ] **Step 2: Update store tests**

Add to `frontend/src/test/labStore.test.ts`:
```typescript
it("sets placing equipment mode", () => {
  useLabStore.getState().setPlacingEquipment("beaker");
  expect(useLabStore.getState().placingEquipment).toBe("beaker");
});

it("clears placing mode when item is added", () => {
  useLabStore.getState().setPlacingEquipment("beaker");
  useLabStore.getState().addBenchItem({
    id: "b-1",
    type: "beaker",
    position: [0, 0, 0],
    contents: [],
  });
  expect(useLabStore.getState().placingEquipment).toBeNull();
});
```

- [ ] **Step 3: Run store tests**

Run: `cd frontend && npx vitest run src/test/labStore.test.ts`
Expected: All tests pass (10 total).

- [ ] **Step 4: Create EquipmentPalette component**

Create `frontend/src/components/ui/EquipmentPalette.tsx`:
```tsx
import { useLabStore } from "../../stores/labStore";

const EQUIPMENT = [
  { type: "beaker", label: "Beaker" },
  { type: "erlenmeyer", label: "Erlenmeyer Flask" },
  { type: "test-tube", label: "Test Tube" },
];

export default function EquipmentPalette() {
  const placingEquipment = useLabStore((s) => s.placingEquipment);
  const setPlacingEquipment = useLabStore((s) => s.setPlacingEquipment);

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-gray-500 uppercase">Equipment</h3>
      <p className="text-[10px] text-gray-600 mb-2">Click to place on bench</p>
      {EQUIPMENT.map((eq) => (
        <button
          key={eq.type}
          onClick={() =>
            setPlacingEquipment(placingEquipment === eq.type ? null : eq.type)
          }
          className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
            placingEquipment === eq.type
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          {eq.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Add bench click handler to LabScene for placement**

Update `frontend/src/components/lab/LabScene.tsx` — modify the bench surface mesh to handle clicks:

Add import:
```tsx
import { type ThreeEvent } from "@react-three/fiber";
```

Replace the bench surface mesh with a component that handles clicks:
```tsx
{/* Lab bench surface — clickable for equipment placement */}
<BenchSurface />
```

Add component in the same file:
```tsx
function BenchSurface() {
  const placingEquipment = useLabStore((s) => s.placingEquipment);
  const addBenchItem = useLabStore((s) => s.addBenchItem);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!placingEquipment) return;
    e.stopPropagation();

    const point = e.point;
    // Snap to bench surface
    const position: [number, number, number] = [
      Math.round(point.x * 10) / 10,
      0.05,
      Math.round(point.z * 10) / 10,
    ];

    addBenchItem({
      id: `${placingEquipment}-${Date.now()}`,
      type: placingEquipment,
      position,
      contents: [],
    });
  };

  return (
    <mesh
      position={[0, 0, 0]}
      receiveShadow
      onClick={handleClick}
      onPointerOver={() => { if (placingEquipment) document.body.style.cursor = "crosshair"; }}
      onPointerOut={() => { document.body.style.cursor = "default"; }}
    >
      <boxGeometry args={[4, 0.1, 2.5]} />
      <meshStandardMaterial
        color={placingEquipment ? "#4a4540" : "#44403c"}
        roughness={0.8}
      />
    </mesh>
  );
}
```

- [ ] **Step 6: Render dynamically placed items in MainBench**

Update `frontend/src/components/lab/stations/MainBench.tsx` — add dynamic items rendering after the static starter equipment:

Add imports:
```tsx
import Beaker from "../equipment/Beaker";
import TestTube from "../equipment/TestTube";
import ErlenmeyerFlask from "../equipment/ErlenmeyerFlask";
```

Add inside the `<group>`, at the end:
```tsx
{/* Dynamically placed items */}
{benchItems.map((item) => {
  const isSelected = selectedBenchItem === item.id;
  const toggleSelect = () => selectBenchItem(isSelected ? null : item.id);

  switch (item.type) {
    case "beaker":
      return <Beaker key={item.id} position={item.position} selected={isSelected} onClick={toggleSelect} />;
    case "erlenmeyer":
      return <ErlenmeyerFlask key={item.id} position={item.position} selected={isSelected} onClick={toggleSelect} />;
    case "test-tube":
      return <TestTube key={item.id} position={item.position} selected={isSelected} onClick={toggleSelect} />;
    default:
      return null;
  }
})}
```

Add the benchItems selector:
```tsx
const benchItems = useLabStore((s) => s.benchItems);
```

- [ ] **Step 7: Add equipment palette to App.tsx**

Add import:
```tsx
import EquipmentPalette from "./components/ui/EquipmentPalette";
```

Add below the PeriodicTable in the left panel:
```tsx
<div className="mt-4">
  <EquipmentPalette />
</div>
```

- [ ] **Step 8: Verify the full interaction flow**

Run both servers. Expected:
1. Click "Beaker" in the equipment palette — button highlights blue
2. Click on the bench surface in the 3D scene — a new beaker appears at the clicked position
3. Placement mode clears after placing
4. Click the placed beaker — it shows selection wireframe
5. Repeat with other equipment types

- [ ] **Step 9: Commit**

```bash
git add frontend/src/
git commit -m "$(cat <<'EOF'
feat: add click-to-place equipment interaction

Equipment palette in left panel. Select equipment type, click on bench to place.
Dynamically placed items render as 3D components and are selectable.
EOF
)"
```

---

## Task 15: Integration Verification & Cleanup

**Files:**
- Modify: Various — fix any issues found during integration testing

- [ ] **Step 1: Run all backend tests**

Run: `cd backend && source venv/Scripts/activate && python -m pytest tests/ -v`
Expected: All tests pass.

- [ ] **Step 2: Run all frontend tests**

Run: `cd frontend && npx vitest run`
Expected: All tests pass.

- [ ] **Step 3: Full integration test**

Start both servers and verify the complete flow:
1. Periodic table loads all 118 elements from API
2. Clicking an element shows full details in inspector
3. Station tabs switch (only Main Bench has 3D content)
4. Environment bar shows temp/pressure/atmosphere
5. Equipment palette allows placing beakers, flasks, test tubes on bench
6. Placed equipment is selectable
7. Camera orbit, zoom, pan work correctly

- [ ] **Step 4: Fix any issues found**

Address any bugs discovered during integration testing.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: Phase 1 integration verification and cleanup

All 118 elements served via API, interactive periodic table, element inspector,
3D Main Bench with glassware components, click-to-place equipment interaction.
EOF
)"
```
