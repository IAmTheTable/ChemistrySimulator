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
