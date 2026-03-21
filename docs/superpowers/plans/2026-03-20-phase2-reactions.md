# Phase 2: Reactions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add chemical reaction simulation — users combine chemicals, the backend predicts products and thermodynamics, and the frontend shows the reaction with visual effects and sound.

**Architecture:** Layered backend pipeline (matcher → predictor → balancer → thermo → effects mapper) serving results via REST (instant) and WebSocket (realistic). Frontend extends equipment with dynamic contents, renders particle effects, and plays sounds via Web Audio API.

**Tech Stack:** Python/FastAPI, WebSockets, NumPy/SciPy (balancer), Web Audio API, R3F instanced meshes (particles), @react-three/postprocessing (bloom/shake)

---

## File Structure

### Backend (New)

```
backend/app/
├── models/
│   ├── substance.py            — Substance, SubstanceInput Pydantic models
│   └── reaction.py             — ReactionResult, ReactionEvent, ReactionEffects models
├── engine/
│   ├── __init__.py
│   ├── reaction_engine.py      — Pipeline orchestrator: run(reactants, conditions) → ReactionResult
│   ├── reaction_matcher.py     — Curated database lookup
│   ├── reaction_predictor.py   — Rule-based prediction (activity series, solubility, acid-base)
│   ├── equation_balancer.py    — Matrix-based equation balancing + stoichiometry
│   ├── thermodynamics.py       — ΔH, ΔS, ΔG from formation data
│   └── effects_mapper.py       — Maps reaction → visual/sound effect descriptors
├── api/
│   ├── reactions.py            — POST /api/reactions/run, WS /api/reactions/stream
│   └── substances.py           — GET /api/substances/common
└── data/
    ├── reactions.json           — ~30 curated reactions (expandable)
    ├── substances.json          — Common chemicals list
    ├── activity_series.json     — Metal reactivity order
    ├── solubility_rules.json    — Solubility table
    └── thermodynamic_data.json  — Standard formation enthalpies
```

### Frontend (New/Modified)

```
frontend/src/
├── types/
│   ├── substance.ts            — Substance interface
│   └── reaction.ts             — ReactionResult, ReactionEvent, ReactionEffects
├── api/
│   ├── reactions.ts            — runReaction(), useReactionStream() WebSocket hook
│   └── substances.ts           — useSubstances() hook
├── stores/
│   └── labStore.ts             — MODIFIED: Substance contents, simulation mode, reaction log
├── audio/
│   └── SoundManager.ts         — Web Audio API wrapper (load, play, loop, stop)
├── components/
│   ├── ui/
│   │   ├── SubstanceInventory.tsx  — Draggable chemical list
│   │   ├── SimulationToggle.tsx    — Instant/Realistic switch
│   │   ├── ReactionLog.tsx         — Reaction history panel
│   │   └── ContainerContextMenu.tsx — Right-click actions
│   └── lab/
│       └── effects/
│           ├── BubbleEffect.tsx     — Rising bubble particles
│           ├── SteamEffect.tsx      — Vapor particles
│           ├── FlameEffect.tsx      — Animated flame billboard
│           └── PrecipitateEffect.tsx — Settling particles
```

---

## Task 1: Substance & Reaction Models

**Files:**
- Create: `backend/app/models/substance.py`
- Create: `backend/app/models/reaction.py`
- Create: `backend/tests/test_reaction_models.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_reaction_models.py`:
```python
from app.models.substance import Substance, SubstanceInput
from app.models.reaction import ReactionResult, ReactionEffects


def test_substance_creation():
    s = Substance(
        formula="NaCl",
        name="Sodium Chloride",
        phase="aq",
        color="#f8f8f8",
        amount_ml=50.0,
        concentration=1.0,
    )
    assert s.formula == "NaCl"
    assert s.phase == "aq"


def test_substance_input():
    si = SubstanceInput(formula="Na", amount_g=2.3, amount_ml=None, phase="s")
    assert si.formula == "Na"
    assert si.amount_g == 2.3


def test_reaction_effects():
    eff = ReactionEffects(
        color={"from": "#ccc", "to": "#fff", "speed": "fast"},
        gas={"type": "H2", "rate": "vigorous"},
        heat="exothermic",
        precipitate=None,
        special=["sparks"],
        sounds=["fizz_vigorous"],
        safety=["flammable_gas"],
    )
    assert eff.heat == "exothermic"
    assert "sparks" in eff.special


def test_reaction_result():
    r = ReactionResult(
        equation="2Na + 2H2O -> 2NaOH + H2",
        reaction_type="single_displacement",
        source="curated",
        reactants=[{"formula": "Na", "amount": 2.0, "phase": "s"}],
        products=[{"formula": "NaOH", "amount": 2.0, "phase": "aq", "color": "#f0f0f0"}],
        limiting_reagent="Na",
        yield_percent=100.0,
        delta_h=-184.0,
        delta_s=12.5,
        delta_g=-210.5,
        spontaneous=True,
        temp_change=45.2,
        effects=ReactionEffects(
            color=None, gas=None, heat="exothermic",
            precipitate=None, special=[], sounds=[], safety=[],
        ),
    )
    assert r.source == "curated"
    assert r.spontaneous is True


def test_no_reaction_result():
    r = ReactionResult(
        equation="Au + HCl -> No reaction",
        reaction_type="none",
        source="predicted",
        reactants=[],
        products=[],
        limiting_reagent=None,
        yield_percent=0.0,
        delta_h=None,
        delta_s=None,
        delta_g=None,
        spontaneous=False,
        temp_change=0.0,
        effects=ReactionEffects(
            color=None, gas=None, heat=None,
            precipitate=None, special=[], sounds=[], safety=[],
        ),
    )
    assert r.reaction_type == "none"
```

- [ ] **Step 2: Run tests — expect failure**

Run: `cd backend && source venv/Scripts/activate && python -m pytest tests/test_reaction_models.py -v`

- [ ] **Step 3: Implement models**

Create `backend/app/models/substance.py`:
```python
from pydantic import BaseModel


class Substance(BaseModel):
    formula: str
    name: str
    phase: str  # "s", "l", "g", "aq"
    color: str
    amount_ml: float | None = None
    concentration: float | None = None  # mol/L for solutions
    molar_mass: float | None = None
    hazard_class: str | None = None


class SubstanceInput(BaseModel):
    formula: str
    amount_g: float | None = None
    amount_ml: float | None = None
    phase: str
```

Create `backend/app/models/reaction.py`:
```python
from pydantic import BaseModel


class ReactionEffects(BaseModel):
    color: dict | None = None       # {from, to, speed}
    gas: dict | None = None         # {type, rate}
    heat: str | None = None         # "exothermic" | "endothermic"
    precipitate: dict | None = None # {color, speed}
    special: list[str] = []         # ["sparks", "explosion", "flame_yellow"]
    sounds: list[str] = []          # ["fizz_vigorous", "sizzle"]
    safety: list[str] = []          # ["flammable_gas", "corrosive"]


class ReactionResult(BaseModel):
    equation: str
    reaction_type: str
    source: str  # "curated" | "predicted"
    reactants: list[dict]
    products: list[dict]
    limiting_reagent: str | None = None
    yield_percent: float = 0.0
    delta_h: float | None = None
    delta_s: float | None = None
    delta_g: float | None = None
    spontaneous: bool = False
    temp_change: float = 0.0
    effects: ReactionEffects = ReactionEffects()


class ReactionEvent(BaseModel):
    event: str   # "reaction_started", "color_changing", "gas_producing", etc.
    data: dict = {}
    timestamp: float = 0.0
```

- [ ] **Step 4: Run tests — expect pass**

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/substance.py backend/app/models/reaction.py backend/tests/test_reaction_models.py
git commit -m "$(cat <<'EOF'
feat: add Substance and ReactionResult Pydantic models

Substance with formula/phase/color/amount, SubstanceInput for API requests,
ReactionResult with equation/thermo/effects, ReactionEvent for WebSocket streaming.
EOF
)"
```

---

## Task 2: Chemistry Data Files

**Files:**
- Create: `backend/app/data/substances.json`
- Create: `backend/app/data/reactions.json`
- Create: `backend/app/data/activity_series.json`
- Create: `backend/app/data/solubility_rules.json`
- Create: `backend/app/data/thermodynamic_data.json`
- Create: `backend/tests/test_chemistry_data.py`

- [ ] **Step 1: Write data validation tests**

Create `backend/tests/test_chemistry_data.py`:
```python
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "app" / "data"


def test_substances_json_valid():
    data = json.loads((DATA_DIR / "substances.json").read_text(encoding="utf-8"))
    assert len(data) >= 15
    for s in data:
        assert "formula" in s
        assert "name" in s
        assert "phase" in s
        assert "color" in s


def test_reactions_json_valid():
    data = json.loads((DATA_DIR / "reactions.json").read_text(encoding="utf-8"))
    assert len(data) >= 20
    for r in data:
        assert "reactants" in r
        assert "products" in r
        assert "equation" in r
        assert "reaction_type" in r
        assert "delta_h" in r


def test_activity_series_json_valid():
    data = json.loads((DATA_DIR / "activity_series.json").read_text(encoding="utf-8"))
    assert isinstance(data, list)
    assert len(data) >= 15
    assert "Li" in data
    assert "Au" in data
    # Li should be more reactive (earlier) than Au
    assert data.index("Li") < data.index("Au")


def test_solubility_rules_json_valid():
    data = json.loads((DATA_DIR / "solubility_rules.json").read_text(encoding="utf-8"))
    assert "always_soluble_cations" in data
    assert "Na" in data["always_soluble_cations"]


def test_thermodynamic_data_json_valid():
    data = json.loads((DATA_DIR / "thermodynamic_data.json").read_text(encoding="utf-8"))
    assert "H2O" in data
    assert "delta_hf" in data["H2O"]
```

- [ ] **Step 2: Run tests — expect failure**

- [ ] **Step 3: Create all data files**

Create `backend/app/data/substances.json` — list of ~20 common chemicals with formula, name, phase, color, molar_mass, hazard_class.

Create `backend/app/data/reactions.json` — array of ~30 curated reactions covering each category (acid-base, single displacement, double displacement, combustion, decomposition, synthesis, precipitation). Each entry has: reactants (list of formulas with coefficients), products (list of formulas with coefficients and phases), equation (balanced string), reaction_type, delta_h, conditions, effects (color, gas, heat, precipitate, special, sounds, safety).

Create `backend/app/data/activity_series.json` — ordered array of metal symbols from most reactive to least: `["Li", "K", "Ba", "Ca", "Na", "Mg", "Al", "Zn", "Fe", "Ni", "Sn", "Pb", "H", "Cu", "Hg", "Ag", "Pt", "Au"]`

Create `backend/app/data/solubility_rules.json` — object with: always_soluble_cations (Na, K, NH4), always_soluble_anions (NO3, ClO4, CH3COO), soluble_with_exceptions (Cl, Br, I, SO4 with their insoluble cation exceptions), generally_insoluble (OH, S, CO3, PO4 with their soluble cation exceptions).

Create `backend/app/data/thermodynamic_data.json` — object keyed by formula containing delta_hf (standard enthalpy of formation in kJ/mol) and delta_sf (standard entropy in J/mol·K) for common substances. Include at minimum: H2O, NaOH, HCl, NaCl, H2, O2, N2, CO2, H2SO4, AgCl, Na, Fe, Cu, Zn, CaCO3, CaO, NH3, NO2, Fe2O3.

**Note for implementer:** These data files are the foundation the engine builds on. Get the structure right — exact field names matter because the engine modules will read them. The reactions.json entries should be comprehensive for the reaction types listed. Use real ΔH values from chemistry references where possible.

- [ ] **Step 4: Run tests — expect pass**

- [ ] **Step 5: Commit**

```bash
git add backend/app/data/ backend/tests/test_chemistry_data.py
git commit -m "$(cat <<'EOF'
feat: add chemistry data files

Curated reactions database (~30 reactions), common substances list,
activity series, solubility rules, and thermodynamic formation data.
EOF
)"
```

---

## Task 3: Reaction Matcher

**Files:**
- Create: `backend/app/engine/__init__.py`
- Create: `backend/app/engine/reaction_matcher.py`
- Create: `backend/tests/test_reaction_matcher.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_reaction_matcher.py`:
```python
from app.engine.reaction_matcher import ReactionMatcher


def test_matcher_finds_known_reaction():
    matcher = ReactionMatcher()
    result = matcher.match(["Na", "H2O"])
    assert result is not None
    assert "NaOH" in result["equation"] or "naoh" in result["equation"].lower()
    assert result["reaction_type"] in ("single_displacement", "synthesis")


def test_matcher_finds_acid_base():
    matcher = ReactionMatcher()
    result = matcher.match(["HCl", "NaOH"])
    assert result is not None
    assert result["reaction_type"] == "acid_base"


def test_matcher_returns_none_for_unknown():
    matcher = ReactionMatcher()
    result = matcher.match(["Au", "HCl"])
    assert result is None


def test_matcher_order_independent():
    matcher = ReactionMatcher()
    r1 = matcher.match(["HCl", "NaOH"])
    r2 = matcher.match(["NaOH", "HCl"])
    assert r1 is not None
    assert r2 is not None
    assert r1["equation"] == r2["equation"]
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Implement**

Create `backend/app/engine/__init__.py` (empty).

Create `backend/app/engine/reaction_matcher.py`:
```python
import json
from pathlib import Path

_DATA_PATH = Path(__file__).parent.parent / "data" / "reactions.json"


class ReactionMatcher:
    def __init__(self):
        self._reactions = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
        self._index: dict[frozenset[str], dict] = {}
        for r in self._reactions:
            key = frozenset(r["reactants"])
            self._index[key] = r

    def match(self, reactant_formulas: list[str]) -> dict | None:
        key = frozenset(reactant_formulas)
        return self._index.get(key)
```

**Note:** The `reactants` field in `reactions.json` must be a list of formula strings (e.g., `["Na", "H2O"]`) that serves as the lookup key. The matcher normalizes order via frozenset.

- [ ] **Step 4: Run tests — expect pass**

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/ backend/tests/test_reaction_matcher.py
git commit -m "feat: add ReactionMatcher for curated database lookup"
```

---

## Task 4: Rule-Based Predictor

**Files:**
- Create: `backend/app/engine/reaction_predictor.py`
- Create: `backend/tests/test_reaction_predictor.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_reaction_predictor.py`:
```python
from app.engine.reaction_predictor import ReactionPredictor


def test_metal_acid_displacement():
    predictor = ReactionPredictor()
    result = predictor.predict(["Zn", "HCl"])
    assert result is not None
    assert result["reaction_type"] == "single_displacement"
    assert any("ZnCl2" in p or "ZnCl" in p for p in result["product_formulas"])


def test_metal_below_hydrogen_no_reaction():
    predictor = ReactionPredictor()
    result = predictor.predict(["Cu", "HCl"])
    assert result is None  # Cu is below H in activity series


def test_precipitation_agcl():
    predictor = ReactionPredictor()
    result = predictor.predict(["AgNO3", "NaCl"])
    assert result is not None
    assert result["reaction_type"] == "precipitation"


def test_acid_base_neutralization():
    predictor = ReactionPredictor()
    result = predictor.predict(["HCl", "NaOH"])
    assert result is not None
    assert result["reaction_type"] == "acid_base"


def test_no_reaction():
    predictor = ReactionPredictor()
    result = predictor.predict(["Au", "H2O"])
    assert result is None
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Implement**

Create `backend/app/engine/reaction_predictor.py`. This module loads `activity_series.json` and `solubility_rules.json`, then applies rules in order:

1. Check if reactants match acid + metal pattern → use activity series for single displacement
2. Check if reactants match acid + base pattern → neutralization
3. Check if reactants match two ionic compounds → check solubility rules for precipitation
4. Check if reactants match acid + carbonate → decomposition with CO₂
5. If no rules match → return None

Each prediction returns a dict with `reaction_type`, `product_formulas`, `equation` (unbalanced), and `source: "predicted"`.

**Key implementation detail:** The predictor needs a simple formula parser to identify acids (starts with H, e.g., HCl, H2SO4), bases (ends with OH), metals (single element in activity series), salts (cation + anion), and carbonates (contains CO3). This parser does not need to be comprehensive — it only needs to handle the common patterns.

- [ ] **Step 4: Run tests — expect pass**

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/reaction_predictor.py backend/tests/test_reaction_predictor.py
git commit -m "feat: add rule-based ReactionPredictor with activity series and solubility rules"
```

---

## Task 5: Equation Balancer

**Files:**
- Create: `backend/app/engine/equation_balancer.py`
- Create: `backend/tests/test_equation_balancer.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_equation_balancer.py`:
```python
from app.engine.equation_balancer import balance_equation, parse_formula


def test_parse_formula_simple():
    assert parse_formula("H2O") == {"H": 2, "O": 1}


def test_parse_formula_complex():
    assert parse_formula("Ca(OH)2") == {"Ca": 1, "O": 2, "H": 2}


def test_parse_formula_element():
    assert parse_formula("Na") == {"Na": 1}


def test_balance_simple():
    coeffs = balance_equation(["H2", "O2"], ["H2O"])
    # 2H2 + O2 -> 2H2O
    assert coeffs == [2, 1, 2]


def test_balance_combustion():
    coeffs = balance_equation(["CH4", "O2"], ["CO2", "H2O"])
    # CH4 + 2O2 -> CO2 + 2H2O
    assert coeffs == [1, 2, 1, 2]


def test_balance_sodium_water():
    coeffs = balance_equation(["Na", "H2O"], ["NaOH", "H2"])
    # 2Na + 2H2O -> 2NaOH + H2
    assert coeffs == [2, 2, 2, 1]
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Implement**

Create `backend/app/engine/equation_balancer.py`:

`parse_formula(formula: str) -> dict[str, int]` — parses a chemical formula string into element counts. Handle parentheses (e.g., Ca(OH)2), subscripts, and multi-character element symbols.

`balance_equation(reactants: list[str], products: list[str]) -> list[int]` — returns integer coefficients for all species (reactants first, then products). Uses a matrix approach: build a matrix of element counts per species, find the null space, and convert to smallest integer coefficients. Use `numpy` or `sympy` for the linear algebra.

**Implementation note:** Install `numpy` if not already available (it should be, as it's a dependency of mendeleev). The null space approach: each column is a species, each row is an element. Set up the matrix with reactants as positive and products as negative (or vice versa). Find the null space vector and normalize to smallest positive integers.

- [ ] **Step 4: Run tests — expect pass**

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/equation_balancer.py backend/tests/test_equation_balancer.py
git commit -m "feat: add equation balancer with formula parser and matrix-based balancing"
```

---

## Task 6: Thermodynamics Calculator

**Files:**
- Create: `backend/app/engine/thermodynamics.py`
- Create: `backend/tests/test_thermodynamics.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_thermodynamics.py`:
```python
from app.engine.thermodynamics import ThermodynamicsCalculator


def test_exothermic_reaction():
    calc = ThermodynamicsCalculator()
    result = calc.calculate(
        reactant_formulas=["H2", "O2"],
        product_formulas=["H2O"],
        coefficients=[2, 1, 2],
        total_volume_ml=100.0,
    )
    assert result["delta_h"] is not None
    assert result["delta_h"] < 0  # Formation of water is exothermic


def test_spontaneity():
    calc = ThermodynamicsCalculator()
    result = calc.calculate(
        reactant_formulas=["Na", "H2O"],
        product_formulas=["NaOH", "H2"],
        coefficients=[2, 2, 2, 1],
        total_volume_ml=50.0,
    )
    # Na + water is spontaneous and exothermic
    assert result["spontaneous"] is True


def test_unknown_compound_returns_none():
    calc = ThermodynamicsCalculator()
    result = calc.calculate(
        reactant_formulas=["XYZ123"],
        product_formulas=["ABC456"],
        coefficients=[1, 1],
        total_volume_ml=50.0,
    )
    assert result["delta_h"] is None
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Implement**

Create `backend/app/engine/thermodynamics.py`:

`ThermodynamicsCalculator` loads `thermodynamic_data.json`. The `calculate()` method:
1. Looks up ΔHf° for each reactant and product
2. ΔH_rxn = Σ(n × ΔHf° products) - Σ(n × ΔHf° reactants) (Hess's Law)
3. Similarly for ΔS if data available
4. ΔG = ΔH - TΔS (T in Kelvin, default 298.15)
5. Spontaneous if ΔG < 0
6. temp_change = ΔH × moles / (volume × specific_heat_water) for aqueous reactions
7. Returns None values for compounds not in the database

- [ ] **Step 4: Run tests — expect pass**

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/thermodynamics.py backend/tests/test_thermodynamics.py
git commit -m "feat: add ThermodynamicsCalculator with Hess's Law and spontaneity"
```

---

## Task 7: Effects Mapper

**Files:**
- Create: `backend/app/engine/effects_mapper.py`
- Create: `backend/tests/test_effects_mapper.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_effects_mapper.py`:
```python
from app.engine.effects_mapper import EffectsMapper
from app.models.reaction import ReactionEffects


def test_exothermic_gas_reaction():
    mapper = EffectsMapper()
    effects = mapper.map_effects(
        reaction_type="single_displacement",
        delta_h=-184.0,
        products=[{"formula": "NaOH", "phase": "aq"}, {"formula": "H2", "phase": "g"}],
        source="curated",
        curated_effects=None,
    )
    assert isinstance(effects, ReactionEffects)
    assert effects.heat == "exothermic"
    assert effects.gas is not None
    assert effects.gas["type"] == "H2"


def test_precipitation_effects():
    mapper = EffectsMapper()
    effects = mapper.map_effects(
        reaction_type="precipitation",
        delta_h=-65.0,
        products=[{"formula": "AgCl", "phase": "s"}, {"formula": "NaNO3", "phase": "aq"}],
        source="predicted",
        curated_effects=None,
    )
    assert effects.precipitate is not None


def test_curated_effects_passthrough():
    mapper = EffectsMapper()
    curated = {"color": {"from": "#ccc", "to": "#fff", "speed": "fast"}, "sounds": ["bang"]}
    effects = mapper.map_effects(
        reaction_type="combustion",
        delta_h=-890.0,
        products=[],
        source="curated",
        curated_effects=curated,
    )
    assert effects.color is not None
    assert effects.color["from"] == "#ccc"
    assert "bang" in effects.sounds
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Implement**

Create `backend/app/engine/effects_mapper.py`:

`EffectsMapper.map_effects()`:
- If curated_effects provided, use those as base and fill in missing fields
- Otherwise, derive effects from reaction properties:
  - Gas product (phase "g") → gas effect with rate based on |ΔH|
  - Solid product (phase "s") in solution → precipitate effect
  - ΔH < -100 → heat "exothermic" + vigorous sounds
  - ΔH < 0 → heat "exothermic" + gentle sounds
  - ΔH > 0 → heat "endothermic"
  - reaction_type "combustion" → flame + special effects
  - Safety warnings based on known hazardous products (H2 → flammable_gas, Cl2 → toxic_gas, etc.)

- [ ] **Step 4: Run tests — expect pass**

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/effects_mapper.py backend/tests/test_effects_mapper.py
git commit -m "feat: add EffectsMapper for visual/sound effect derivation"
```

---

## Task 8: Reaction Engine (Pipeline Orchestrator)

**Files:**
- Create: `backend/app/engine/reaction_engine.py`
- Create: `backend/tests/test_reaction_engine.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_reaction_engine.py`:
```python
from app.engine.reaction_engine import ReactionEngine
from app.models.reaction import ReactionResult


def test_curated_reaction():
    engine = ReactionEngine()
    result = engine.run(
        reactants=[{"formula": "Na", "amount_g": 2.3, "phase": "s"},
                   {"formula": "H2O", "amount_ml": 50.0, "phase": "l"}],
        conditions={"temperature": 25, "pressure": 1, "catalyst": None},
    )
    assert isinstance(result, ReactionResult)
    assert result.source == "curated"
    assert result.equation != ""
    assert result.effects is not None


def test_predicted_reaction():
    engine = ReactionEngine()
    result = engine.run(
        reactants=[{"formula": "Zn", "amount_g": 6.5, "phase": "s"},
                   {"formula": "HCl", "amount_ml": 50.0, "phase": "aq"}],
        conditions={"temperature": 25, "pressure": 1, "catalyst": None},
    )
    assert isinstance(result, ReactionResult)
    # May be curated or predicted depending on database
    assert result.reaction_type in ("single_displacement",)


def test_no_reaction():
    engine = ReactionEngine()
    result = engine.run(
        reactants=[{"formula": "Au", "amount_g": 1.0, "phase": "s"},
                   {"formula": "H2O", "amount_ml": 50.0, "phase": "l"}],
        conditions={"temperature": 25, "pressure": 1, "catalyst": None},
    )
    assert result.reaction_type == "none"
    assert result.equation.endswith("No reaction") or "no reaction" in result.equation.lower()
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Implement**

Create `backend/app/engine/reaction_engine.py`:
```python
from app.engine.reaction_matcher import ReactionMatcher
from app.engine.reaction_predictor import ReactionPredictor
from app.engine.equation_balancer import balance_equation, parse_formula
from app.engine.thermodynamics import ThermodynamicsCalculator
from app.engine.effects_mapper import EffectsMapper
from app.models.reaction import ReactionResult


class ReactionEngine:
    def __init__(self):
        self._matcher = ReactionMatcher()
        self._predictor = ReactionPredictor()
        self._thermo = ThermodynamicsCalculator()
        self._effects = EffectsMapper()

    def run(self, reactants: list[dict], conditions: dict) -> ReactionResult:
        formulas = [r["formula"] for r in reactants]

        # Stage 2: Try curated match
        matched = self._matcher.match(formulas)
        if matched:
            return self._build_curated_result(matched, reactants, conditions)

        # Stage 3: Try rule-based prediction
        predicted = self._predictor.predict(formulas)
        if predicted:
            return self._build_predicted_result(predicted, reactants, conditions)

        # No reaction
        return ReactionResult(
            equation=" + ".join(formulas) + " -> No reaction",
            reaction_type="none",
            source="predicted",
        )

    def _build_curated_result(self, matched: dict, reactants: list[dict], conditions: dict) -> ReactionResult:
        # Extract data from curated entry, compute thermo, map effects
        thermo = self._thermo.calculate(
            reactant_formulas=matched["reactants"],
            product_formulas=[p["formula"] if isinstance(p, dict) else p for p in matched["products"]],
            coefficients=matched.get("coefficients", []),
            total_volume_ml=sum(r.get("amount_ml", 0) or 0 for r in reactants),
        )
        effects = self._effects.map_effects(
            reaction_type=matched["reaction_type"],
            delta_h=matched.get("delta_h") or thermo.get("delta_h"),
            products=matched.get("products_detail", []),
            source="curated",
            curated_effects=matched.get("effects"),
        )
        return ReactionResult(
            equation=matched["equation"],
            reaction_type=matched["reaction_type"],
            source="curated",
            reactants=[{"formula": f, "amount": 1.0, "phase": "s"} for f in matched["reactants"]],
            products=matched.get("products_detail", []),
            delta_h=matched.get("delta_h") or thermo.get("delta_h"),
            delta_s=thermo.get("delta_s"),
            delta_g=thermo.get("delta_g"),
            spontaneous=thermo.get("spontaneous", False),
            temp_change=thermo.get("temp_change", 0.0),
            effects=effects,
        )

    def _build_predicted_result(self, predicted: dict, reactants: list[dict], conditions: dict) -> ReactionResult:
        # Balance equation, compute thermo, map effects
        try:
            coefficients = balance_equation(
                predicted.get("reactant_formulas", []),
                predicted.get("product_formulas", []),
            )
        except Exception:
            coefficients = []

        thermo = self._thermo.calculate(
            reactant_formulas=predicted.get("reactant_formulas", []),
            product_formulas=predicted.get("product_formulas", []),
            coefficients=coefficients,
            total_volume_ml=sum(r.get("amount_ml", 0) or 0 for r in reactants),
        )
        effects = self._effects.map_effects(
            reaction_type=predicted["reaction_type"],
            delta_h=thermo.get("delta_h"),
            products=predicted.get("products_detail", []),
            source="predicted",
            curated_effects=None,
        )
        return ReactionResult(
            equation=predicted.get("equation", ""),
            reaction_type=predicted["reaction_type"],
            source="predicted",
            delta_h=thermo.get("delta_h"),
            delta_g=thermo.get("delta_g"),
            spontaneous=thermo.get("spontaneous", False),
            temp_change=thermo.get("temp_change", 0.0),
            effects=effects,
        )
```

**Note for implementer:** The exact field names in `reactions.json` will determine how `_build_curated_result` reads data. You may need to adapt field access based on the actual JSON structure from Task 2. The key flow is: match/predict → balance → thermo → effects → return ReactionResult.

- [ ] **Step 4: Run tests — expect pass**

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/reaction_engine.py backend/tests/test_reaction_engine.py
git commit -m "feat: add ReactionEngine pipeline orchestrator"
```

---

## Task 9: Reaction & Substance API Endpoints

**Files:**
- Create: `backend/app/api/reactions.py`
- Create: `backend/app/api/substances.py`
- Create: `backend/tests/test_reactions_api.py`
- Modify: `backend/app/main.py` — mount routers

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_reactions_api.py`:
```python
def test_run_reaction(client):
    response = client.post("/api/reactions/run", json={
        "reactants": [
            {"formula": "Na", "amount_g": 2.3, "phase": "s"},
            {"formula": "H2O", "amount_ml": 50.0, "phase": "l"},
        ],
        "conditions": {"temperature": 25, "pressure": 1, "catalyst": None},
    })
    assert response.status_code == 200
    data = response.json()
    assert "equation" in data
    assert "effects" in data


def test_run_no_reaction(client):
    response = client.post("/api/reactions/run", json={
        "reactants": [
            {"formula": "Au", "amount_g": 1.0, "phase": "s"},
            {"formula": "H2O", "amount_ml": 50.0, "phase": "l"},
        ],
        "conditions": {"temperature": 25, "pressure": 1, "catalyst": None},
    })
    assert response.status_code == 200
    data = response.json()
    assert data["reaction_type"] == "none"


def test_get_common_substances(client):
    response = client.get("/api/substances/common")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 15
    assert any(s["formula"] == "HCl" for s in data)
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Implement endpoints**

Create `backend/app/api/reactions.py`:
```python
from fastapi import APIRouter, WebSocket
from pydantic import BaseModel
import asyncio

from app.engine.reaction_engine import ReactionEngine
from app.models.reaction import ReactionResult, ReactionEvent

router = APIRouter(prefix="/api/reactions", tags=["reactions"])
_engine = ReactionEngine()


class ReactionRequest(BaseModel):
    reactants: list[dict]
    conditions: dict


@router.post("/run", response_model=ReactionResult)
def run_reaction(request: ReactionRequest):
    return _engine.run(request.reactants, request.conditions)


@router.websocket("/stream")
async def stream_reaction(websocket: WebSocket):
    await websocket.accept()
    data = await websocket.receive_json()
    request = ReactionRequest(**data)
    result = _engine.run(request.reactants, request.conditions)

    # Stream events based on reaction effects
    events = _generate_events(result)
    for event in events:
        await websocket.send_json(event.model_dump())
        await asyncio.sleep(event.timestamp)

    await websocket.close()


def _generate_events(result: ReactionResult) -> list[ReactionEvent]:
    events = [ReactionEvent(event="reaction_started", data={"equation": result.equation}, timestamp=0.5)]

    if result.effects.color:
        events.append(ReactionEvent(event="color_changing", data=result.effects.color, timestamp=0.5))
    if result.effects.gas:
        events.append(ReactionEvent(event="gas_producing", data=result.effects.gas, timestamp=1.0))
    if result.effects.heat:
        events.append(ReactionEvent(event="temp_rising", data={"heat": result.effects.heat, "temp_change": result.temp_change}, timestamp=1.0))
    if result.effects.precipitate:
        events.append(ReactionEvent(event="precipitate_forming", data=result.effects.precipitate, timestamp=1.0))

    events.append(ReactionEvent(event="reaction_complete", data=result.model_dump(), timestamp=1.0))
    return events
```

Create `backend/app/api/substances.py`:
```python
import json
from pathlib import Path
from fastapi import APIRouter

router = APIRouter(prefix="/api/substances", tags=["substances"])

_DATA_PATH = Path(__file__).parent.parent / "data" / "substances.json"
_substances = json.loads(_DATA_PATH.read_text(encoding="utf-8"))


@router.get("/common")
def get_common_substances():
    return _substances
```

Update `backend/app/main.py` — add:
```python
from app.api.reactions import router as reactions_router
from app.api.substances import router as substances_router
app.include_router(reactions_router)
app.include_router(substances_router)
```

- [ ] **Step 4: Run tests — expect pass**

- [ ] **Step 5: Run all backend tests**

Run: `cd backend && source venv/Scripts/activate && python -m pytest tests/ -v`

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/ backend/app/main.py backend/tests/test_reactions_api.py
git commit -m "$(cat <<'EOF'
feat: add reaction and substance API endpoints

POST /api/reactions/run — instant reaction result
WS /api/reactions/stream — timed event stream for realistic mode
GET /api/substances/common — common chemicals list
EOF
)"
```

---

## Task 10: Frontend Types & Store Extensions

**Files:**
- Create: `frontend/src/types/substance.ts`
- Create: `frontend/src/types/reaction.ts`
- Modify: `frontend/src/stores/labStore.ts`
- Modify: `frontend/src/test/labStore.test.ts`

- [ ] **Step 1: Create TypeScript types**

Create `frontend/src/types/substance.ts`:
```typescript
export interface Substance {
  formula: string;
  name: string;
  phase: "s" | "l" | "g" | "aq";
  color: string;
  amount_ml: number | null;
  concentration: number | null;
  molar_mass: number | null;
  hazard_class: string | null;
}
```

Create `frontend/src/types/reaction.ts`:
```typescript
export interface ReactionEffects {
  color: { from: string; to: string; speed: string } | null;
  gas: { type: string; rate: string } | null;
  heat: string | null;
  precipitate: { color: string; speed: string } | null;
  special: string[];
  sounds: string[];
  safety: string[];
}

export interface ReactionResult {
  equation: string;
  reaction_type: string;
  source: "curated" | "predicted";
  reactants: { formula: string; amount: number; phase: string }[];
  products: { formula: string; amount: number; phase: string; color: string }[];
  limiting_reagent: string | null;
  yield_percent: number;
  delta_h: number | null;
  delta_s: number | null;
  delta_g: number | null;
  spontaneous: boolean;
  temp_change: number;
  effects: ReactionEffects;
}

export interface ReactionEvent {
  event: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface ReactionLogEntry extends ReactionResult {
  id: string;
  timestamp: Date;
}
```

- [ ] **Step 2: Extend labStore**

Read `frontend/src/stores/labStore.ts`, then extend:
- Change `BenchItem.contents` from `string[]` to `ContainerSubstance[]` (a simpler type: `{ formula: string; amount_ml: number; phase: string; color: string }`)
- Add `temperature: number` to BenchItem (default 25)
- Add `activeEffects: string[]` to BenchItem (default [])
- Add `simulationMode: "instant" | "realistic"` to state
- Add `reactionLog: ReactionLogEntry[]` to state
- Add actions: `setSimulationMode`, `addReactionLogEntry`, `updateBenchItemContents`, `updateBenchItemTemperature`, `setBenchItemEffects`

- [ ] **Step 3: Update store tests**

Add tests in `frontend/src/test/labStore.test.ts`:
```typescript
it("defaults to instant simulation mode", () => {
  expect(useLabStore.getState().simulationMode).toBe("instant");
});

it("switches simulation mode", () => {
  useLabStore.getState().setSimulationMode("realistic");
  expect(useLabStore.getState().simulationMode).toBe("realistic");
});

it("adds reaction log entry", () => {
  useLabStore.getState().addReactionLogEntry({
    id: "r1",
    timestamp: new Date(),
    equation: "Na + H2O -> NaOH + H2",
    reaction_type: "single_displacement",
    source: "curated",
    reactants: [], products: [],
    limiting_reagent: null, yield_percent: 100,
    delta_h: -184, delta_s: null, delta_g: null,
    spontaneous: true, temp_change: 45,
    effects: { color: null, gas: null, heat: null, precipitate: null, special: [], sounds: [], safety: [] },
  });
  expect(useLabStore.getState().reactionLog).toHaveLength(1);
});
```

- [ ] **Step 4: Run tests — expect pass**

Run: `cd frontend && npx vitest run`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/ frontend/src/stores/ frontend/src/test/
git commit -m "$(cat <<'EOF'
feat: add reaction/substance types and extend lab store

New types for ReactionResult, ReactionEffects, Substance.
Store extended with simulation mode, reaction log, container contents model.
EOF
)"
```

---

## Task 11: Substance Inventory & Simulation Toggle UI

**Files:**
- Create: `frontend/src/api/substances.ts`
- Create: `frontend/src/components/ui/SubstanceInventory.tsx`
- Create: `frontend/src/components/ui/SimulationToggle.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create substances API hook**

Create `frontend/src/api/substances.ts`:
```typescript
import { useQuery } from "@tanstack/react-query";
import type { Substance } from "../types/substance";

async function fetchSubstances(): Promise<Substance[]> {
  const response = await fetch("/api/substances/common");
  if (!response.ok) throw new Error("Failed to fetch substances");
  return response.json();
}

export function useSubstances() {
  return useQuery({ queryKey: ["substances"], queryFn: fetchSubstances, staleTime: Infinity });
}
```

- [ ] **Step 2: Create SubstanceInventory component**

Shows common chemicals and pure elements. Each item is clickable to add to a container on the bench. Uses the same placement pattern as EquipmentPalette — click substance, then click a container on the bench.

- [ ] **Step 3: Create SimulationToggle component**

Two buttons: Instant (⚡) and Realistic (🔬). Reads/writes `simulationMode` in the store.

- [ ] **Step 4: Integrate into App.tsx**

Add SubstanceInventory and SimulationToggle below EquipmentPalette in the left panel.

- [ ] **Step 5: Verify build**

Run: `cd frontend && npm run build`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: add SubstanceInventory and SimulationToggle UI components"
```

---

## Task 12: Reaction Log Panel

**Files:**
- Create: `frontend/src/components/ui/ReactionLog.tsx`
- Modify: `frontend/src/App.tsx` — add tabs to right panel (Inspector | Reactions)

- [ ] **Step 1: Create ReactionLog component**

Shows chronological list of reactions with: balanced equation (monospace), ΔH (red for exothermic, blue for endothermic), reaction type, source badge (green Curated, purple Predicted, gray No reaction), timestamp. Reads from `reactionLog` in store.

- [ ] **Step 2: Add tabbed right panel**

Modify App.tsx right panel to use Radix Tabs: "Inspector" tab shows ElementInspector, "Reactions" tab shows ReactionLog.

- [ ] **Step 3: Verify build**

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: add ReactionLog panel with tabbed right panel"
```

---

## Task 13: Container Context Menu

**Files:**
- Create: `frontend/src/components/ui/ContainerContextMenu.tsx`
- Modify: `frontend/src/components/lab/stations/MainBench.tsx` — add context menu to equipment

- [ ] **Step 1: Create ContainerContextMenu**

Use `@radix-ui/react-context-menu`. Options: Pour into, Heat, Stir, Inspect, Weigh, Measure Temp, Empty, Remove. For Phase 2, implement: Inspect (show contents in inspector), Empty (clear contents), Remove (remove from bench). Others show as disabled/placeholder for future phases.

- [ ] **Step 2: Wire into equipment components**

Wrap each equipment piece in MainBench with the context menu trigger. Right-click shows the menu.

- [ ] **Step 3: Verify build**

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: add container context menu with right-click actions"
```

---

## Task 14: Reaction API Client & Combine Interaction

**Files:**
- Create: `frontend/src/api/reactions.ts`
- Modify: `frontend/src/components/lab/LabScene.tsx` — handle container-on-container drop
- Modify: `frontend/src/stores/labStore.ts` — add combine action

- [ ] **Step 1: Create reaction API client**

Create `frontend/src/api/reactions.ts`:
```typescript
import type { ReactionResult, ReactionEvent } from "../types/reaction";

export async function runReaction(
  reactants: { formula: string; amount_g?: number; amount_ml?: number; phase: string }[],
  conditions: { temperature: number; pressure: number; catalyst: string | null } = { temperature: 25, pressure: 1, catalyst: null },
): Promise<ReactionResult> {
  const response = await fetch("/api/reactions/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reactants, conditions }),
  });
  if (!response.ok) throw new Error("Failed to run reaction");
  return response.json();
}

export function streamReaction(
  reactants: { formula: string; amount_g?: number; amount_ml?: number; phase: string }[],
  conditions: { temperature: number; pressure: number; catalyst: string | null },
  onEvent: (event: ReactionEvent) => void,
): () => void {
  const ws = new WebSocket(`ws://${window.location.host}/api/reactions/stream`);
  ws.onopen = () => ws.send(JSON.stringify({ reactants, conditions }));
  ws.onmessage = (e) => onEvent(JSON.parse(e.data));
  ws.onclose = () => {};
  return () => ws.close();
}
```

- [ ] **Step 2: Add combine logic to store**

Add `combineContainers(sourceId: string, targetId: string)` action to the store. This:
1. Gets contents from both containers
2. Calls the reaction API
3. Updates target container contents with products
4. Updates target container temperature
5. Empties source container
6. Adds result to reaction log
7. Triggers effects on target container

- [ ] **Step 3: Wire drag-to-combine in the 3D scene**

Modify equipment components to detect when one container is dropped onto another. Use R3F pointer events: drag start selects source, drop on another container triggers `combineContainers`.

A simpler approach for Phase 2: when a container is selected (clicked) and you click another container while holding Shift, it triggers a combine. Full drag-to-drop in 3D is complex and can be refined later.

- [ ] **Step 4: Verify build**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: add reaction API client and container combine interaction"
```

---

## Task 15: Dynamic Equipment Colors & Effects Rendering

**Files:**
- Modify: `frontend/src/components/lab/equipment/Beaker.tsx`
- Modify: `frontend/src/components/lab/equipment/TestTube.tsx`
- Modify: `frontend/src/components/lab/equipment/ErlenmeyerFlask.tsx`
- Modify: `frontend/src/components/lab/stations/MainBench.tsx`

- [ ] **Step 1: Update equipment to read contents color**

Modify each equipment component to accept a `contents` prop (array of substances). The liquid fill color should be derived from the first substance's color (or blended if multiple). The fill level should be based on total amount_ml relative to container capacity.

- [ ] **Step 2: Pass contents from store through MainBench**

MainBench reads each bench item's contents from the store and passes to the equipment component.

- [ ] **Step 3: Render active effects**

Each equipment component checks `activeEffects` on its bench item and renders the corresponding effect components (BubbleEffect, SteamEffect, etc.) as children.

- [ ] **Step 4: Verify build**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/lab/
git commit -m "feat: equipment renders dynamic liquid color and active effects"
```

---

## Task 16: Visual Effects Components

**Files:**
- Create: `frontend/src/components/lab/effects/BubbleEffect.tsx`
- Create: `frontend/src/components/lab/effects/SteamEffect.tsx`
- Create: `frontend/src/components/lab/effects/FlameEffect.tsx`
- Create: `frontend/src/components/lab/effects/PrecipitateEffect.tsx`

- [ ] **Step 1: Create BubbleEffect**

R3F component that renders rising bubble particles using instanced meshes. Props: `rate` ("gentle"|"moderate"|"vigorous"), `position`. Uses `useFrame` to animate sphere instances upward, respawning at the bottom. Gentle=5 particles, moderate=15, vigorous=30.

- [ ] **Step 2: Create SteamEffect**

Similar particle system but particles rise above the container and fade out (scale down + opacity). White/gray translucent spheres.

- [ ] **Step 3: Create FlameEffect**

Animated flame using a billboard sprite or a cone mesh with animated emissive material. Props: `color` (for metal-specific flames), `intensity`. Uses `useFrame` to animate scale/opacity for flickering.

- [ ] **Step 4: Create PrecipitateEffect**

Particles that spawn in the liquid volume and slowly settle downward. Props: `color`, `speed`. Particles accumulate at the bottom of the container.

- [ ] **Step 5: Verify build**

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/lab/effects/
git commit -m "feat: add visual effect components — bubbles, steam, flame, precipitate"
```

---

## Task 17: Sound System

**Files:**
- Create: `frontend/src/audio/SoundManager.ts`
- Modify: `frontend/src/components/ui/EnvironmentBar.tsx` — add volume control

- [ ] **Step 1: Create SoundManager**

Create `frontend/src/audio/SoundManager.ts`:
```typescript
class SoundManager {
  private context: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private masterVolume: GainNode | null = null;

  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
      this.masterVolume = this.context.createGain();
      this.masterVolume.connect(this.context.destination);
    }
    return this.context;
  }

  async load(name: string, url: string): Promise<void> {
    const ctx = this.getContext();
    const response = await fetch(url);
    const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
    this.buffers.set(name, buffer);
  }

  play(name: string, loop = false): void {
    const buffer = this.buffers.get(name);
    if (!buffer || !this.masterVolume) return;
    const ctx = this.getContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(this.masterVolume);
    source.start();
    if (loop) this.activeSources.set(name, source);
  }

  stop(name: string): void {
    const source = this.activeSources.get(name);
    if (source) { source.stop(); this.activeSources.delete(name); }
  }

  setVolume(value: number): void {
    if (this.masterVolume) this.masterVolume.gain.value = Math.max(0, Math.min(1, value));
  }
}

export const soundManager = new SoundManager();
```

**Note:** Actual sound files (.mp3/.ogg) need to be sourced. For Phase 2, use freely available lab sound effects or generate simple tones programmatically using oscillators as placeholders. The SoundManager can also generate simple sounds via OscillatorNode for basic fizz/hiss effects without external files.

- [ ] **Step 2: Add volume control to EnvironmentBar**

Add a simple volume slider to the environment bar that calls `soundManager.setVolume()`.

- [ ] **Step 3: Verify build**

- [ ] **Step 4: Commit**

```bash
git add frontend/src/audio/ frontend/src/components/ui/EnvironmentBar.tsx
git commit -m "feat: add SoundManager with Web Audio API and volume control"
```

---

## Task 18: Integration & End-to-End Test

**Files:**
- Various fixes across all files

- [ ] **Step 1: Run all backend tests**

Run: `cd backend && source venv/Scripts/activate && python -m pytest tests/ -v`
Expected: All pass.

- [ ] **Step 2: Run all frontend tests**

Run: `cd frontend && npx vitest run`
Expected: All pass.

- [ ] **Step 3: Verify frontend build**

Run: `cd frontend && npm run build`

- [ ] **Step 4: Manual integration test**

Start both servers and verify:
1. Substances load in the inventory panel
2. Simulation toggle switches between Instant/Realistic
3. Add substance to a container on the bench (container shows colored liquid)
4. Combine two containers → reaction runs → effects play → reaction log updates
5. Right-click context menu shows on containers
6. Reaction log shows balanced equation, ΔH, source badge
7. Sound plays on reaction (if sound files loaded)

- [ ] **Step 5: Fix any issues**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: Phase 2 integration verification

Reaction engine pipeline with curated database and rule-based prediction,
visual effects (bubbles, steam, flame, precipitate), sound system,
substance inventory, reaction log, container context menu, combine interaction.
EOF
)"
```
