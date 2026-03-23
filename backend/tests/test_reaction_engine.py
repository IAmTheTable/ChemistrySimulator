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
    # Use a pair that's NOT in the curated database but the predictor can handle
    # Cu + AgNO3 may or may not be curated. Let's try a less common one.
    result = engine.run(
        reactants=[{"formula": "Zn", "amount_g": 6.5, "phase": "s"},
                   {"formula": "HCl", "amount_ml": 50.0, "phase": "aq"}],
        conditions={"temperature": 25, "pressure": 1, "catalyst": None},
    )
    assert isinstance(result, ReactionResult)
    assert result.reaction_type in ("single_displacement",)


def test_no_reaction_single_substance():
    """A single substance with no decomposition rule returns 'none'."""
    engine = ReactionEngine()
    result = engine.run(
        reactants=[{"formula": "Au", "amount_g": 1.0, "phase": "s"}],
        conditions={"temperature": 25, "pressure": 1, "catalyst": None},
    )
    assert result.reaction_type == "none"


def test_inert_pair_returns_mixture():
    """Two inert substances that don't react should return 'mixture'."""
    engine = ReactionEngine()
    result = engine.run(
        reactants=[{"formula": "Au", "amount_g": 1.0, "phase": "s"},
                   {"formula": "H2O", "amount_ml": 50.0, "phase": "l"}],
        conditions={"temperature": 25, "pressure": 1, "catalyst": None},
    )
    assert result.reaction_type == "mixture"
    assert "mixture" in result.equation


def test_mixing_without_reaction():
    """Mixing two soluble salts should return a mixture or precipitation."""
    engine = ReactionEngine()
    result = engine.run(
        reactants=[{"formula": "NaCl", "amount_ml": 50, "phase": "aq"},
                   {"formula": "KNO3", "amount_ml": 50, "phase": "aq"}],
        conditions={"temperature": 25, "pressure": 1, "catalyst": None},
    )
    assert result is not None
    assert result.reaction_type in ("mixture", "precipitation", "double_displacement", "none")


def test_synthesis_metal_nonmetal():
    """Fe + S -> FeS (synthesis reaction, requires heat >= 300°C)."""
    engine = ReactionEngine()
    result = engine.run(
        reactants=[{"formula": "Fe", "amount_g": 5.6, "phase": "s"},
                   {"formula": "S", "amount_g": 3.2, "phase": "s"}],
        conditions={"temperature": 350, "pressure": 1, "catalyst": None},
    )
    assert result.reaction_type == "synthesis"
    assert any("FeS" in p.get("formula", "") for p in result.products)


def test_metal_water_reaction():
    """K + H2O -> KOH + H2 (alkali metal + water)."""
    engine = ReactionEngine()
    result = engine.run(
        reactants=[{"formula": "K", "amount_g": 3.9, "phase": "s"},
                   {"formula": "H2O", "amount_ml": 50.0, "phase": "l"}],
        conditions={"temperature": 25, "pressure": 1, "catalyst": None},
    )
    # Could be curated or predicted
    assert result.reaction_type in ("single_displacement",)
    assert any("H2" in p.get("formula", "") for p in result.products)


def test_oxide_water_metal_oxide():
    """CaO + H2O -> Ca(OH)2 (metal oxide + water)."""
    engine = ReactionEngine()
    result = engine.run(
        reactants=[{"formula": "CaO", "amount_g": 5.6, "phase": "s"},
                   {"formula": "H2O", "amount_ml": 50.0, "phase": "l"}],
        conditions={"temperature": 25, "pressure": 1, "catalyst": None},
    )
    assert result.reaction_type in ("synthesis",)
    assert any("Ca(OH)2" in p.get("formula", "") for p in result.products)


def test_oxide_water_nonmetal_oxide():
    """CO2 + H2O -> H2CO3 (nonmetal oxide + water)."""
    engine = ReactionEngine()
    result = engine.run(
        reactants=[{"formula": "CO2", "amount_g": 4.4, "phase": "g"},
                   {"formula": "H2O", "amount_ml": 50.0, "phase": "l"}],
        conditions={"temperature": 25, "pressure": 1, "catalyst": None},
    )
    assert result.reaction_type in ("synthesis",)
    assert any("H2CO3" in p.get("formula", "") for p in result.products)


def test_acid_metal_oxide():
    """HCl + CaO -> CaCl2 + H2O (acid + metal oxide)."""
    engine = ReactionEngine()
    result = engine.run(
        reactants=[{"formula": "HCl", "amount_ml": 50.0, "phase": "aq"},
                   {"formula": "CaO", "amount_g": 5.6, "phase": "s"}],
        conditions={"temperature": 25, "pressure": 1, "catalyst": None},
    )
    assert result.reaction_type in ("acid_base",)


def test_organic_combustion():
    """C2H6 + O2 -> CO2 + H2O (combustion, requires ignition >= 200°C)."""
    engine = ReactionEngine()
    result = engine.run(
        reactants=[{"formula": "C2H6", "amount_g": 3.0, "phase": "g"},
                   {"formula": "O2", "amount_g": 11.2, "phase": "g"}],
        conditions={"temperature": 300, "pressure": 1, "catalyst": None},
    )
    assert result.reaction_type == "combustion"


def test_mixture_effects_are_gentle():
    """Mixture result should have minimal effects (no dramatic sounds)."""
    engine = ReactionEngine()
    result = engine.run(
        reactants=[{"formula": "Au", "amount_g": 1.0, "phase": "s"},
                   {"formula": "H2O", "amount_ml": 50.0, "phase": "l"}],
        conditions={"temperature": 25, "pressure": 1, "catalyst": None},
    )
    assert result.effects.gas is None
    assert result.effects.heat is None
    assert result.effects.precipitate is None
