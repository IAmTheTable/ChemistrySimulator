import json
from pathlib import Path

_DATA_PATH = Path(__file__).parent.parent / "data" / "reactions.json"


class ReactionMatcher:
    def __init__(self):
        self._reactions = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
        self._index: dict[frozenset[str], dict] = {}
        for r in self._reactions:
            key = frozenset(r["reactants"])
            self._index[key] = r

    def match(self, reactant_formulas: list[str]) -> dict | None:
        key = frozenset(reactant_formulas)
        return self._index.get(key)
