"""Orbital calculator for quantum-number-based orbital data."""

import json
import re
from pathlib import Path

from app.models.structure import OrbitalData, OrbitalInfo

DATA_PATH = Path(__file__).parent.parent / "data" / "elements.json"

L_MAP = {"s": 0, "p": 1, "d": 2, "f": 3}
SHAPE_MAP = {0: "sphere", 1: "dumbbell", 2: "cloverleaf", 3: "complex"}

ORIENTATIONS_MAP = {
    0: [],
    1: ["x", "y", "z"],
    2: ["xy", "xz", "yz", "x2y2", "z2"],
    3: ["fz3", "fxz2", "fyz2", "fxyz", "fz(x2-y2)", "fx(x2-3y2)", "fy(3x2-y2)"],
}

NOBLE_GAS_CONFIGS = {
    "He": "1s2",
    "Ne": "1s2 2s2 2p6",
    "Ar": "1s2 2s2 2p6 3s2 3p6",
    "Kr": "1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6",
    "Xe": "1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2 5p6",
    "Rn": "1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2 5p6 4f14 5d10 6s2 6p6",
}


class OrbitalCalculator:
    """Calculates orbital data for elements based on their electron configuration."""

    def __init__(self) -> None:
        self._elements: list[dict] = json.loads(
            DATA_PATH.read_text(encoding="utf-8")
        )

    def _expand_config(self, config: str) -> str:
        """Expand noble gas core notation if present.

        E.g. '[Ar] 3d6 4s2' -> '1s2 2s2 2p6 3s2 3p6 3d6 4s2'
        """
        match = re.match(r"\[(\w+)\]\s*(.*)", config)
        if match:
            noble_gas = match.group(1)
            remainder = match.group(2).strip()
            base = NOBLE_GAS_CONFIGS.get(noble_gas, "")
            if remainder:
                return f"{base} {remainder}"
            return base
        return config

    def _parse_subshells(self, config: str) -> list[dict]:
        """Parse electron configuration string into subshell dicts.

        Each token like '3d6' is parsed into:
          n=3, l=2 (d), electrons=6
        """
        config = self._expand_config(config)
        tokens = config.split()
        subshells = []
        for token in tokens:
            m = re.match(r"(\d+)([spdf])(\d+)", token)
            if not m:
                continue
            n = int(m.group(1))
            l_char = m.group(2)
            electrons = int(m.group(3))
            l_val = L_MAP[l_char]
            subshells.append({
                "n": n,
                "l": l_val,
                "l_char": l_char,
                "electrons": electrons,
            })
        return subshells

    def get_orbitals(self, atomic_number: int) -> OrbitalData:
        """Get orbital data for an element by its atomic number."""
        element = next(
            e for e in self._elements if e["atomic_number"] == atomic_number
        )
        config = element["electron_configuration"]
        name = element["name"]

        subshells = self._parse_subshells(config)

        orbitals: list[OrbitalInfo] = []
        for sub in subshells:
            n = sub["n"]
            l_val = sub["l"]
            label = f"{n}{sub['l_char']}"
            orbitals.append(
                OrbitalInfo(
                    n=n,
                    l=l_val,
                    label=label,
                    electrons=sub["electrons"],
                    shape=SHAPE_MAP[l_val],
                    radius=n * 0.6,
                    orientations=ORIENTATIONS_MAP[l_val],
                )
            )

        return OrbitalData(
            element=name,
            atomic_number=atomic_number,
            electron_configuration=config,
            orbitals=orbitals,
        )
