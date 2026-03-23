import json
from pathlib import Path

_DATA_PATH = Path(__file__).parent.parent / "data" / "reactions.json"


class ReactionMatcher:
    def __init__(self):
        self._reactions = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
        self._index: dict[frozenset[str], list[dict]] = {}
        for r in self._reactions:
            key = frozenset(r["reactants"])
            self._index.setdefault(key, []).append(r)

    def match(self, reactant_formulas: list[str]) -> dict | None:
        """Return the best single match (first with no catalyst requirement)."""
        key = frozenset(reactant_formulas)
        candidates = self._index.get(key)
        if not candidates:
            return None
        # Prefer reactions that need no special catalyst (simplest conditions)
        for c in candidates:
            cat = c.get("conditions", {}).get("catalyst")
            if cat is None:
                return c
        # Fall back to first candidate
        return candidates[0]

    def match_all(self, reactant_formulas: list[str]) -> list[dict]:
        """Return all curated reactions matching the given reactant set."""
        key = frozenset(reactant_formulas)
        return self._index.get(key, [])
