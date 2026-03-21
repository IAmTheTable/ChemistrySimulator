from app.engine.reaction_predictor import ReactionPredictor


def test_metal_acid_displacement():
    predictor = ReactionPredictor()
    result = predictor.predict(["Zn", "HCl"])
    assert result is not None
    assert result["reaction_type"] == "single_displacement"


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
