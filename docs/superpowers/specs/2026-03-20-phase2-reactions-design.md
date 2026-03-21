# Phase 2: Reactions — Design Specification

## Overview

Add chemical reaction simulation to the Chemistry Simulator. Users combine chemicals on the lab bench via drag-and-drop or precise pouring, and see reactions play out with visual effects and sound. The backend predicts products, balances equations, calculates thermodynamics, and streams reaction events to the frontend.

## Reaction Engine Pipeline (Backend)

The reaction system processes chemicals through a 6-stage pipeline:

### Stage 1: Input Parser

Accepts reactant formulas with amounts and conditions (temperature, pressure, catalyst). Validates that formulas are recognized chemical compounds or elements.

### Stage 2: Reaction Matcher

Looks up reactant combinations in a curated reactions database (~150 common reactions). Each curated entry contains: reactant/product formulas with stoichiometry, balanced equation string, reaction type, ΔH in kJ/mol, required conditions, visual effect descriptors, colors, gas produced, and safety warnings. Results are labeled `source: "curated"`.

**Reaction categories in the curated database:**
- Acid-base (HCl+NaOH, H₂SO₄+KOH, etc.)
- Single displacement (Na+H₂O, Zn+HCl, Fe+CuSO₄)
- Double displacement (AgNO₃+NaCl, BaCl₂+Na₂SO₄)
- Combustion (CH₄+O₂, C₂H₅OH+O₂, Mg+O₂)
- Decomposition (H₂O₂→H₂O+O₂, CaCO₃→CaO+CO₂)
- Synthesis (Fe+S→FeS, N₂+H₂→NH₃)
- Redox (MnO₄⁻+Fe²⁺, Cr₂O₇²⁻+I⁻)
- Precipitation (Pb(NO₃)₂+KI→PbI₂↓)

### Stage 3: Rule-Based Predictor (Fallback)

If no curated match is found, applies chemistry rules to predict products. Results are labeled `source: "predicted"`.

**Rules implemented:**
- **Activity series:** Metal + acid → salt + H₂ (if metal above H). Metal + salt → displacement (if metal more reactive). Metal + water → hydroxide + H₂ (alkali/alkaline metals).
- **Solubility rules:** All Na⁺/K⁺/NH₄⁺ salts soluble. Most Cl⁻ soluble (except Ag, Pb, Hg). Most OH⁻/CO₃²⁻/PO₄³⁻ insoluble. Used to predict precipitation.
- **Acid-base rules:** Strong acid + strong base → salt + H₂O. Acid + carbonate → salt + CO₂ + H₂O. Acid + metal oxide → salt + H₂O.

If no rules match, returns "No reaction observed."

### Stage 4: Equation Balancer

Balances the equation using matrix-based stoichiometry. Identifies limiting reagent. Calculates theoretical yield.

### Stage 5: Thermodynamics Calculator

Computes ΔH (enthalpy), ΔS (entropy), ΔG (Gibbs free energy) from standard formation data. Calculates temperature change in the container based on amounts and heat capacity. Determines spontaneity.

### Stage 6: Effects Mapper

Maps the reaction result to visual and sound effect descriptors:
- Color change (from → to, transition speed)
- Gas production (type, rate: gentle/moderate/vigorous)
- Heat effects (exothermic glow, steam, or endothermic frost)
- Precipitate (color, settling speed)
- Special effects (explosion, flame color, sparks, fluorescence)
- Sound triggers (fizz, sizzle, pop, bang, hiss, crackle)
- Safety warnings (toxic gas, corrosive, flammable)

### Output: ReactionResult

```
{
  equation: "2Na + 2H₂O → 2NaOH + H₂↑",
  reaction_type: "single_displacement",
  source: "curated" | "predicted",
  reactants: [{formula, amount, phase}],
  products: [{formula, amount, phase, color}],
  limiting_reagent: "Na",
  yield_percent: 100,
  delta_h: -184.0,
  delta_s: 12.5,
  delta_g: -210.5,
  spontaneous: true,
  temp_change: +45.2,
  effects: {
    color: {from: "#c0c0c0", to: "#f0f0f0", speed: "fast"},
    gas: {type: "H2", rate: "vigorous"},
    heat: "exothermic",
    precipitate: null,
    special: ["sparks"],
    sounds: ["fizz_vigorous", "sizzle"],
    safety: ["flammable_gas", "corrosive"]
  }
}
```

## Delivery Modes

Users can toggle between two modes via a control in the left panel:

**Instant mode:** Single REST POST to `/api/reactions/run`. Returns complete ReactionResult. Frontend applies all effects simultaneously.

**Realistic mode:** WebSocket connection to `/api/reactions/stream`. Backend sends events in timed sequence:
1. `reaction_started` (0s) — play pour sound
2. `color_changing` (0.5s) — begin color lerp
3. `gas_producing` (1s) — start bubble particles + fizz sound
4. `temp_rising` (2s) — heat glow + steam particles
5. `precipitate_forming` (3s) — particles settle to bottom
6. `reaction_complete` (4s) — final state, update container contents, add to reaction log

Not all events fire for every reaction — only relevant ones (e.g., no precipitate event for a gas-only reaction).

## Visual Effects System (Frontend)

All effects are R3F components rendered inside the 3D lab scene.

### Color Transitions
- Smooth color lerp on the liquid fill mesh material
- Sudden color flash for fast/violent reactions
- Opacity changes for dissolution (solid disappearing into liquid)

### Gas & Bubbles
- Instanced mesh particle system (small spheres rising through liquid)
- Gas cloud particles above container mouth
- Three intensity levels: gentle, moderate, vigorous
- Particle count and speed tied to gas production rate

### Fire & Heat
- Flame effect using animated noise-based shader or sprite billboard
- Metal-specific flame colors (Na=yellow, Cu=green, Li=red, K=violet, Ba=green)
- Container emissive glow for hot surfaces
- Steam/vapor particles rising from hot liquid
- Heat shimmer via post-processing distortion (optional, performance-dependent)

### Precipitates
- Small colored particles spawning in liquid and settling downward
- Cloudiness effect (liquid opacity increase during formation)
- Solid layer mesh growing at container bottom

### Explosions & Vigorous Reactions
- Camera shake (spring-based damping)
- Bloom flash via post-processing
- Particle burst outward from container
- Safety warning overlay on screen

### Emission & Glow
- Emissive material + bloom for fluorescence/chemiluminescence
- Spark particles for metal reactions
- Dynamic point light spawned at reaction site

## Sound System

Web Audio API via a lightweight `SoundManager` class.

**Reaction sounds:** fizz_gentle, fizz_vigorous, sizzle, pop, bang, hiss, crackle
**Lab sounds:** pour, clink (glass contact), burner_on, burner_loop, stir, boil, alarm

Implementation: Short .mp3/.ogg clips loaded on demand. Looping sounds for sustained effects (boiling, burner flame). Volume scaled by reaction intensity. Master volume control in environment bar.

## Interaction Model

### Adding Chemicals to the Bench

1. Click element in periodic table → element appears in the Substance Inventory (left panel) as a pure substance
2. Common chemicals (HCl, NaOH, H₂SO₄, H₂O, AgNO₃, NaCl, etc.) are pre-listed in the inventory
3. Drag substance from inventory → drops into an empty container on the bench, or creates a new container with the substance

### Combining Chemicals

**Quick Mix (drag):** Drag one container onto another. Contents merge. If reactants match a reaction, it triggers automatically.

**Precise Pour (context menu):** Right-click container → "Pour into..." → click target container → amount slider (mL/g) → confirm → pour animation plays, reaction triggers if applicable.

### Context Menu

Right-clicking any container shows: Pour into, Heat, Stir, Inspect (view contents), Weigh (show mass), Measure Temp, Empty (discard contents), Remove (take off bench).

## Container Contents Model

The `BenchItem` from Phase 1 is extended:

```
BenchItem {
  id: string,
  type: "beaker" | "erlenmeyer" | "test-tube",
  position: [x, y, z],
  contents: Substance[],
  temperature: number,        // °C
  activeEffects: Effect[],    // currently playing effects
}

Substance {
  formula: string,
  amount_ml: number,
  concentration: number | null,  // mol/L for solutions
  phase: "s" | "l" | "g" | "aq",
  color: string,                 // hex color
}
```

After a reaction, the container's contents are replaced with products, temperature is updated, and effects are triggered.

## New UI Components

### Reaction Log Panel

Added as a tab alongside the Inspector in the right panel. Shows a chronological list of all reactions performed:
- Balanced equation in monospace
- ΔH value with color coding (red for exothermic, blue for endothermic)
- Reaction type label
- Source badge: green "Curated", purple "Predicted", or gray "No reaction"
- Timestamp
- Click an entry to see full thermodynamic details

### Substance Inventory

Extends the left panel (below Equipment Palette):
- **Common Chemicals** section — pre-loaded list of frequently used substances (HCl, NaOH, H₂SO₄, H₂O, AgNO₃, NaCl, KMnO₄, etc.) with formula and phase
- **Pure Elements** section — populated when user clicks elements in the periodic table
- Each substance is draggable onto bench containers
- Shows formula, phase notation (s/l/g/aq), and color swatch

### Simulation Speed Toggle

In the left panel below the inventory: two buttons to switch between Instant and Realistic mode. Current mode stored in Zustand store.

## API Endpoints

### POST /api/reactions/run

Request:
```json
{
  "reactants": [
    {"formula": "Na", "amount_g": 2.3, "phase": "s"},
    {"formula": "H2O", "amount_ml": 50, "phase": "l"}
  ],
  "conditions": {
    "temperature": 25,
    "pressure": 1,
    "catalyst": null
  }
}
```

Response: Complete `ReactionResult` object.

### WebSocket /api/reactions/stream

Same request format sent as first message. Server responds with timed event messages. Connection closes after `reaction_complete`.

### GET /api/substances/common

Returns the list of common chemicals with their properties (formula, name, default phase, color, hazard class).

## Backend File Structure (New/Modified)

```
backend/app/
├── api/
│   ├── reactions.py          — POST /api/reactions/run, WebSocket /api/reactions/stream
│   └── substances.py         — GET /api/substances/common
├── engine/
│   ├── reaction_engine.py    — Pipeline orchestrator
│   ├── reaction_matcher.py   — Curated database lookup
│   ├── reaction_predictor.py — Rule-based prediction
│   ├── equation_balancer.py  — Stoichiometry & balancing
│   ├── thermodynamics.py     — ΔH, ΔS, ΔG calculations
│   └── effects_mapper.py     — Visual/sound effect mapping
├── data/
│   ├── reactions.json        — Curated reactions database
│   ├── activity_series.json  — Metal reactivity order
│   ├── solubility_rules.json — Solubility table
│   ├── thermodynamic_data.json — Standard formation enthalpies
│   └── substances.json       — Common chemicals list
└── models/
    ├── reaction.py           — ReactionResult, ReactionEvent Pydantic models
    └── substance.py          — Substance Pydantic model
```

## Frontend File Structure (New/Modified)

```
frontend/src/
├── api/
│   ├── reactions.ts          — React Query hooks + WebSocket client
│   └── substances.ts         — useSubstances() hook
├── stores/
│   └── labStore.ts           — Extended: contents model, simulation mode, reaction history
├── components/
│   ├── ui/
│   │   ├── ReactionLog.tsx       — Reaction history panel
│   │   ├── SubstanceInventory.tsx — Chemical inventory with drag
│   │   ├── ContainerContextMenu.tsx — Right-click menu
│   │   └── SimulationToggle.tsx  — Instant/Realistic switch
│   └── lab/
│       ├── effects/
│       │   ├── BubbleEffect.tsx      — Gas/bubble particles
│       │   ├── FlameEffect.tsx       — Fire/flame shader
│       │   ├── SteamEffect.tsx       — Steam/vapor particles
│       │   ├── PrecipitateEffect.tsx  — Settling particles
│       │   ├── ExplosionEffect.tsx    — Camera shake + bloom + burst
│       │   ├── GlowEffect.tsx        — Emissive glow
│       │   └── SparkEffect.tsx       — Spark particles
│       └── equipment/
│           ├── Beaker.tsx     — Modified: dynamic color, effects rendering
│           ├── TestTube.tsx   — Modified: dynamic color, effects rendering
│           └── ErlenmeyerFlask.tsx — Modified: dynamic color, effects rendering
├── audio/
│   ├── SoundManager.ts       — Web Audio API wrapper
│   └── sounds/               — .mp3/.ogg audio files
└── types/
    ├── reaction.ts           — ReactionResult, ReactionEvent types
    └── substance.ts          — Substance type
```
