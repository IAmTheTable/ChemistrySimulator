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
    assert data.index("Li") < data.index("Au")


def test_solubility_rules_json_valid():
    data = json.loads((DATA_DIR / "solubility_rules.json").read_text(encoding="utf-8"))
    assert "always_soluble_cations" in data
    assert "Na" in data["always_soluble_cations"]


def test_thermodynamic_data_json_valid():
    data = json.loads((DATA_DIR / "thermodynamic_data.json").read_text(encoding="utf-8"))
    assert "H2O" in data
    assert "delta_hf" in data["H2O"]
