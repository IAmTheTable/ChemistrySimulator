import json
from pathlib import Path

from app.models.structure import MoleculeData

DATA_PATH = Path(__file__).parent.parent / "app" / "data" / "common_structures.json"


def test_file_exists():
    assert DATA_PATH.exists()


def test_has_enough_molecules():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    assert len(data) >= 20


def test_entries_are_valid():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    for key, entry in data.items():
        mol = MoleculeData(**entry)
        assert len(mol.atoms) > 0


def test_water_present():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    assert "H2O" in data
    water = MoleculeData(**data["H2O"])
    assert len(water.atoms) == 3
    assert len(water.bonds) == 2
