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


def test_no_reaction():
    engine = ReactionEngine()
    result = engine.run(
        reactants=[{"formula": "Au", "amount_g": 1.0, "phase": "s"},
                   {"formula": "H2O", "amount_ml": 50.0, "phase": "l"}],
        conditions={"temperature": 25, "pressure": 1, "catalyst": None},
    )
    assert result.reaction_type == "none"
