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
