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
