import json
from pathlib import Path

_DATA_DIR = Path(__file__).parent.parent / "data"
_ACTIVITY_SERIES_PATH = _DATA_DIR / "activity_series.json"
_SOLUBILITY_RULES_PATH = _DATA_DIR / "solubility_rules.json"

# Known acid decompositions into (cation, anion)
_KNOWN_ACIDS: dict[str, tuple[str, str]] = {
    "HCl": ("H", "Cl"),
    "HBr": ("H", "Br"),
    "HI": ("H", "I"),
    "HF": ("H", "F"),
    "H2SO4": ("H", "SO4"),
    "HNO3": ("H", "NO3"),
    "H3PO4": ("H", "PO4"),
    "CH3COOH": ("H", "CH3COO"),
}

# Known salt decompositions into (cation, anion)
_KNOWN_SALTS: dict[str, tuple[str, str]] = {
    "NaCl": ("Na", "Cl"),
    "KCl": ("K", "Cl"),
    "CaCl2": ("Ca", "Cl"),
    "AgCl": ("Ag", "Cl"),
    "NaBr": ("Na", "Br"),
    "KBr": ("K", "Br"),
    "AgBr": ("Ag", "Br"),
    "NaI": ("Na", "I"),
    "KI": ("K", "I"),
    "AgI": ("Ag", "I"),
    "NaNO3": ("Na", "NO3"),
    "KNO3": ("K", "NO3"),
    "AgNO3": ("Ag", "NO3"),
    "CuSO4": ("Cu", "SO4"),
    "ZnSO4": ("Zn", "SO4"),
    "FeSO4": ("Fe", "SO4"),
    "Na2SO4": ("Na", "SO4"),
    "BaSO4": ("Ba", "SO4"),
    "PbSO4": ("Pb", "SO4"),
    "Na2CO3": ("Na", "CO3"),
    "K2CO3": ("K", "CO3"),
    "CaCO3": ("Ca", "CO3"),
    "BaCO3": ("Ba", "CO3"),
    "ZnCl2": ("Zn", "Cl"),
    "FeCl2": ("Fe", "Cl"),
    "FeCl3": ("Fe", "Cl"),
    "CuCl2": ("Cu", "Cl"),
    "PbCl2": ("Pb", "Cl"),
    "NaOH": ("Na", "OH"),
    "KOH": ("K", "OH"),
    "Ca(OH)2": ("Ca", "OH"),
    "Ba(OH)2": ("Ba", "OH"),
}


def _make_salt_formula(cation: str, anion: str) -> str:
    """Build a simple salt formula from cation and anion.

    This is a rough helper -- it does not handle subscripts/charges
    rigorously, but covers the common cases the predictor needs.
    """
    # Check the reverse lookup from known salts
    for formula, (c, a) in _KNOWN_SALTS.items():
        if c == cation and a == anion:
            return formula
    for formula, (c, a) in _KNOWN_ACIDS.items():
        if c == cation and a == anion:
            return formula
    # Fallback: concatenate
    return f"{cation}{anion}"


class ReactionPredictor:
    """Applies chemistry heuristics to predict reaction products
    when no curated match exists in the reaction database."""

    def __init__(self) -> None:
        self._activity_series: list[str] = json.loads(
            _ACTIVITY_SERIES_PATH.read_text(encoding="utf-8")
        )
        self._solubility_rules: dict = json.loads(
            _SOLUBILITY_RULES_PATH.read_text(encoding="utf-8")
        )

    # ------------------------------------------------------------------
    # Classification helpers
    # ------------------------------------------------------------------

    def _is_metal(self, formula: str) -> bool:
        """Single-element symbol present in the activity series."""
        return formula in self._activity_series

    @staticmethod
    def _is_acid(formula: str) -> bool:
        return formula in _KNOWN_ACIDS

    @staticmethod
    def _is_base(formula: str) -> bool:
        """Ends with OH (or is in known salts with OH anion)."""
        if formula in _KNOWN_SALTS and _KNOWN_SALTS[formula][1] == "OH":
            return True
        return False

    @staticmethod
    def _is_salt(formula: str) -> bool:
        return formula in _KNOWN_SALTS and _KNOWN_SALTS[formula][1] != "OH"

    @staticmethod
    def _is_water(formula: str) -> bool:
        return formula == "H2O"

    @staticmethod
    def _is_carbonate(formula: str) -> bool:
        if formula in _KNOWN_SALTS:
            return _KNOWN_SALTS[formula][1] == "CO3"
        return False

    def _ions(self, formula: str) -> tuple[str, str] | None:
        """Return (cation, anion) for an ionic/acid compound."""
        if formula in _KNOWN_ACIDS:
            return _KNOWN_ACIDS[formula]
        if formula in _KNOWN_SALTS:
            return _KNOWN_SALTS[formula]
        return None

    # ------------------------------------------------------------------
    # Activity series helpers
    # ------------------------------------------------------------------

    def _rank(self, element: str) -> int | None:
        """Lower index == more reactive."""
        try:
            return self._activity_series.index(element)
        except ValueError:
            return None

    def _is_above(self, metal: str, reference: str) -> bool:
        """Return True if *metal* is more reactive (higher) than *reference*."""
        r_metal = self._rank(metal)
        r_ref = self._rank(reference)
        if r_metal is None or r_ref is None:
            return False
        return r_metal < r_ref  # lower index = more reactive

    # ------------------------------------------------------------------
    # Solubility helper
    # ------------------------------------------------------------------

    def _is_insoluble(self, cation: str, anion: str) -> bool:
        """Check whether the salt made of *cation* + *anion* is insoluble."""
        rules = self._solubility_rules

        # If the cation is always soluble, the compound is soluble
        if cation in rules["always_soluble_cations"]:
            return False
        # If the anion is always soluble, the compound is soluble
        if anion in rules["always_soluble_anions"]:
            return False

        # Soluble-with-exceptions anions
        if anion in rules["soluble_with_exceptions"]:
            exc = rules["soluble_with_exceptions"][anion]
            return cation in exc["insoluble_with"]

        # Generally insoluble anions
        if anion in rules["generally_insoluble"]:
            exc = rules["generally_insoluble"][anion]
            return cation not in exc["soluble_with"]

        # Default: assume soluble (no rule matched)
        return False

    # ------------------------------------------------------------------
    # Reaction-type predictors
    # ------------------------------------------------------------------

    def _try_metal_acid(self, reactants: list[str]) -> dict | None:
        """Metal + Acid -> salt + H2 (single displacement)."""
        metal = acid = None
        for r in reactants:
            if self._is_metal(r) and r != "H":
                metal = r
            elif self._is_acid(r):
                acid = r

        if metal is None or acid is None:
            return None

        # Metal must be above H in activity series
        if not self._is_above(metal, "H"):
            return None

        _, anion = _KNOWN_ACIDS[acid]
        salt = _make_salt_formula(metal, anion)
        products = [salt, "H2"]
        return self._result(
            "single_displacement", reactants, products
        )

    def _try_acid_base(self, reactants: list[str]) -> dict | None:
        """Acid + Base -> salt + H2O (neutralization)."""
        acid = base = None
        for r in reactants:
            if self._is_acid(r):
                acid = r
            elif self._is_base(r):
                base = r

        if acid is None or base is None:
            return None

        _, acid_anion = _KNOWN_ACIDS[acid]
        base_cation, _ = _KNOWN_SALTS[base]
        salt = _make_salt_formula(base_cation, acid_anion)
        products = [salt, "H2O"]
        return self._result("acid_base", reactants, products)

    def _try_acid_carbonate(self, reactants: list[str]) -> dict | None:
        """Acid + Carbonate -> salt + CO2 + H2O."""
        acid = carbonate = None
        for r in reactants:
            if self._is_acid(r):
                acid = r
            elif self._is_carbonate(r):
                carbonate = r

        if acid is None or carbonate is None:
            return None

        _, acid_anion = _KNOWN_ACIDS[acid]
        carb_cation, _ = _KNOWN_SALTS[carbonate]
        salt = _make_salt_formula(carb_cation, acid_anion)
        products = [salt, "CO2", "H2O"]
        return self._result("acid_base", reactants, products)

    def _try_precipitation(self, reactants: list[str]) -> dict | None:
        """Two ionic compounds -> check for insoluble product."""
        ions_list: list[tuple[str, str]] = []
        for r in reactants:
            ions = self._ions(r)
            if ions is None:
                return None
            ions_list.append(ions)

        if len(ions_list) != 2:
            return None

        (cat1, an1), (cat2, an2) = ions_list

        # Cross-swap: cat1+an2 and cat2+an1
        has_precipitate = False
        precipitate_products: list[str] = []
        soluble_products: list[str] = []

        prod1_formula = _make_salt_formula(cat1, an2)
        prod2_formula = _make_salt_formula(cat2, an1)

        if self._is_insoluble(cat1, an2):
            has_precipitate = True
            precipitate_products.append(prod1_formula)
        else:
            soluble_products.append(prod1_formula)

        if self._is_insoluble(cat2, an1):
            has_precipitate = True
            precipitate_products.append(prod2_formula)
        else:
            soluble_products.append(prod2_formula)

        if not has_precipitate:
            return None

        products = precipitate_products + soluble_products
        return self._result("precipitation", reactants, products)

    def _try_metal_salt_displacement(self, reactants: list[str]) -> dict | None:
        """Metal + Salt solution -> displacement if metal is more reactive."""
        metal = salt = None
        for r in reactants:
            if self._is_metal(r):
                metal = r
            elif self._is_salt(r):
                salt = r

        if metal is None or salt is None:
            return None

        salt_cation, salt_anion = _KNOWN_SALTS[salt]

        if not self._is_above(metal, salt_cation):
            return None

        new_salt = _make_salt_formula(metal, salt_anion)
        products = [new_salt, salt_cation]
        return self._result("single_displacement", reactants, products)

    # ------------------------------------------------------------------
    # Result builder
    # ------------------------------------------------------------------

    @staticmethod
    def _result(
        reaction_type: str,
        reactants: list[str],
        products: list[str],
    ) -> dict:
        equation = " + ".join(reactants) + " -> " + " + ".join(products)
        return {
            "reaction_type": reaction_type,
            "reactant_formulas": list(reactants),
            "product_formulas": products,
            "equation": equation,
            "source": "predicted",
        }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def predict(self, reactants: list[str]) -> dict | None:
        """Try each rule in priority order and return the first match,
        or None if no known reaction pattern applies."""
        for rule in (
            self._try_metal_acid,
            self._try_acid_base,
            self._try_acid_carbonate,
            self._try_precipitation,
            self._try_metal_salt_displacement,
        ):
            result = rule(reactants)
            if result is not None:
                return result
        return None
