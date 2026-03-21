from app.engine.reaction_matcher import ReactionMatcher


def test_matcher_finds_known_reaction():
    matcher = ReactionMatcher()
    result = matcher.match(["Na", "H2O"])
    assert result is not None
    assert "NaOH" in result["equation"]


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
    assert r1 is not None and r2 is not None
    assert r1["equation"] == r2["equation"]
