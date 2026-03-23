import json
import re
from pathlib import Path

from app.engine.equation_balancer import parse_formula
from app.engine.constants import (
    ACID_BASE,
    SINGLE_DISPLACEMENT,
    DOUBLE_DISPLACEMENT,
    PRECIPITATION,
    COMBUSTION,
    DECOMPOSITION,
    SYNTHESIS,
)

_DATA_DIR = Path(__file__).parent.parent / "data"
_ACTIVITY_SERIES_PATH = _DATA_DIR / "activity_series.json"
_SOLUBILITY_RULES_PATH = _DATA_DIR / "solubility_rules.json"

# Common nonmetals (elemental form symbols)
_NONMETAL_ELEMENTS: set[str] = {
    "H", "He", "C", "N", "O", "F", "Ne", "P", "S", "Cl", "Ar",
    "Se", "Br", "Kr", "I", "Xe", "At", "Rn",
}

# Diatomic nonmetal formulas (the molecular form)
_DIATOMIC: dict[str, str] = {
    "H": "H2", "N": "N2", "O": "O2", "F": "F2",
    "Cl": "Cl2", "Br": "Br2", "I": "I2",
}

# Common oxidation states for metals (used to build binary formulas)
_METAL_CHARGES: dict[str, int] = {
    "Li": 1, "Na": 1, "K": 1, "Rb": 1, "Cs": 1,
    "Be": 2, "Mg": 2, "Ca": 2, "Sr": 2, "Ba": 2,
    "Al": 3, "Zn": 2, "Fe": 2, "Cu": 2, "Ag": 1,
    "Sn": 2, "Pb": 2, "Cr": 3, "Co": 2, "Ni": 2,
    "Mn": 2, "Hg": 2, "Pt": 4, "Au": 3,
}

# Common oxidation states for nonmetals in binary compounds
_NONMETAL_CHARGES: dict[str, int] = {
    "F": -1, "Cl": -1, "Br": -1, "I": -1,
    "O": -2, "S": -2, "Se": -2,
    "N": -3, "P": -3,
}

# Alkali metals
_ALKALI_METALS: set[str] = {"Li", "Na", "K", "Rb", "Cs"}

# Alkaline earth metals
_ALKALINE_EARTH_METALS: set[str] = {"Be", "Mg", "Ca", "Sr", "Ba"}

# Metal oxides: formula -> metal cation
_METAL_OXIDES: dict[str, str] = {
    "Li2O": "Li", "Na2O": "Na", "K2O": "K",
    "MgO": "Mg", "CaO": "Ca", "BaO": "Ba", "SrO": "Sr",
    "Al2O3": "Al", "Fe2O3": "Fe", "FeO": "Fe",
    "CuO": "Cu", "Cu2O": "Cu", "ZnO": "Zn",
    "PbO": "Pb", "SnO": "Sn", "Cr2O3": "Cr",
    "MnO": "Mn", "MnO2": "Mn", "NiO": "Ni",
}

# Nonmetal oxides -> acid produced with water
_NONMETAL_OXIDE_ACIDS: dict[str, str] = {
    "CO2": "H2CO3",
    "SO2": "H2SO3",
    "SO3": "H2SO4",
    "N2O5": "HNO3",
    "N2O3": "HNO2",
    "P2O5": "H3PO4",
    "P4O10": "H3PO4",
    "Cl2O7": "HClO4",
}

# Known acid decompositions into (cation, anion)
_KNOWN_ACIDS: dict[str, tuple[str, str]] = {
    "HCl": ("H", "Cl"),
    "HBr": ("H", "Br"),
    "HI": ("H", "I"),
    "HF": ("H", "F"),
    "H2SO4": ("H", "SO4"),
    "HNO3": ("H", "NO3"),
    "H3PO4": ("H", "PO4"),
    "H2CO3": ("H", "CO3"),
    "H2SO3": ("H", "SO3"),
    "H2S": ("H", "S"),
    "H2CrO4": ("H", "CrO4"),
    "HClO3": ("H", "ClO3"),
    "HClO4": ("H", "ClO4"),
    "CH3COOH": ("H", "CH3COO"),
    "HCOOH": ("H", "HCOO"),
    "H2C2O4": ("H", "C2O4"),
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
    "MgCO3": ("Mg", "CO3"),
    "ZnCl2": ("Zn", "Cl"),
    "FeCl2": ("Fe", "Cl"),
    "FeCl3": ("Fe", "Cl"),
    "CuCl2": ("Cu", "Cl"),
    "PbCl2": ("Pb", "Cl"),
    "MgCl2": ("Mg", "Cl"),
    "AlCl3": ("Al", "Cl"),
    "NiCl2": ("Ni", "Cl"),
    "CoCl2": ("Co", "Cl"),
    "MnCl2": ("Mn", "Cl"),
    "NaOH": ("Na", "OH"),
    "KOH": ("K", "OH"),
    "Ca(OH)2": ("Ca", "OH"),
    "Ba(OH)2": ("Ba", "OH"),
    "Mg(OH)2": ("Mg", "OH"),
    "Al(OH)3": ("Al", "OH"),
    "Fe(OH)3": ("Fe", "OH"),
    "Cu(OH)2": ("Cu", "OH"),
    "Ni(OH)2": ("Ni", "OH"),
    "Co(OH)2": ("Co", "OH"),
    "Zn(OH)2": ("Zn", "OH"),
    "Pb(OH)2": ("Pb", "OH"),
    "Mn(OH)2": ("Mn", "OH"),
    "Cu(NO3)2": ("Cu", "NO3"),
    "Zn(NO3)2": ("Zn", "NO3"),
    "Pb(NO3)2": ("Pb", "NO3"),
    "Fe(NO3)3": ("Fe", "NO3"),
    "Mg(NO3)2": ("Mg", "NO3"),
    "Ca(NO3)2": ("Ca", "NO3"),
    "Ba(NO3)2": ("Ba", "NO3"),
    "MgSO4": ("Mg", "SO4"),
    "NiSO4": ("Ni", "SO4"),
    "CoSO4": ("Co", "SO4"),
    "MnSO4": ("Mn", "SO4"),
    "Al2(SO4)3": ("Al", "SO4"),
    "K2SO4": ("K", "SO4"),
    "K2CO3": ("K", "CO3"),
    "Na2S": ("Na", "S"),
    "K2S": ("K", "S"),
    "CuS": ("Cu", "S"),
    "ZnS": ("Zn", "S"),
    "PbS": ("Pb", "S"),
    "FeS": ("Fe", "S"),
    "Ag2S": ("Ag", "S"),
    "MnS": ("Mn", "S"),
    "NiS": ("Ni", "S"),
    "CoS": ("Co", "S"),
    "Na3PO4": ("Na", "PO4"),
    "K3PO4": ("K", "PO4"),
    "Ca3(PO4)2": ("Ca", "PO4"),
    "NH4Cl": ("NH4", "Cl"),
    "NH4NO3": ("NH4", "NO3"),
    "(NH4)2SO4": ("NH4", "SO4"),
    "(NH4)2CO3": ("NH4", "CO3"),
    "SnCl2": ("Sn", "Cl"),
    "SnCl4": ("Sn", "Cl"),
    "CrCl3": ("Cr", "Cl"),
    "Na2CrO4": ("Na", "CrO4"),
    "K2CrO4": ("K", "CrO4"),
    "Na2Cr2O7": ("Na", "Cr2O7"),
    "K2Cr2O7": ("K", "Cr2O7"),
    "KMnO4": ("K", "MnO4"),
    "NaF": ("Na", "F"),
    "KF": ("K", "F"),
    "CaF2": ("Ca", "F"),
    "BaCl2": ("Ba", "Cl"),
    "SrCl2": ("Sr", "Cl"),
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

    @staticmethod
    def _is_sulfide(formula: str) -> bool:
        if formula in _KNOWN_SALTS:
            return _KNOWN_SALTS[formula][1] == "S"
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
        return self._result(SINGLE_DISPLACEMENT, reactants, products)

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
        return self._result(ACID_BASE, reactants, products)

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
        return self._result(ACID_BASE, reactants, products)

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
        return self._result(PRECIPITATION, reactants, products)

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
        return self._result(SINGLE_DISPLACEMENT, reactants, products)

    def _try_combustion(self, reactants: list[str]) -> dict | None:
        """Organic compound + O2 -> CO2 + H2O (combustion).

        Also handles any compound containing C and H burned in O2.
        """
        organic = None
        has_o2 = False
        for r in reactants:
            if r == "O2":
                has_o2 = True
            elif self._is_organic(r):
                organic = r

        if organic is None or not has_o2:
            return None

        products = ["CO2", "H2O"]
        result = self._result(COMBUSTION, reactants, products)
        result["conditions"] = {"min_temperature": 200}
        return result

    # ------------------------------------------------------------------
    # NEW: Synthesis (combination) reactions
    # ------------------------------------------------------------------

    def _try_synthesis(self, reactants: list[str]) -> dict | None:
        """Two elements -> binary compound (e.g., Fe + S -> FeS).

        Handles metal + nonmetal combinations using common oxidation states.
        """
        if len(reactants) != 2:
            return None

        # Identify which is metal and which is nonmetal
        metal = nonmetal = None
        for r in reactants:
            # Strip diatomic form to get the element
            elem = self._element_from_formula(r)
            if elem is None:
                continue
            if elem in _NONMETAL_ELEMENTS and elem not in ("He", "Ne", "Ar", "Kr", "Xe", "Rn"):
                nonmetal = elem
            elif elem not in _NONMETAL_ELEMENTS:
                metal = elem

        if metal is None or nonmetal is None:
            return None

        # Build the binary compound formula from charges
        product = self._binary_formula(metal, nonmetal)
        if product is None:
            return None

        return self._result(SYNTHESIS, reactants, [product])

    @staticmethod
    def _element_from_formula(formula: str) -> str | None:
        """If *formula* is a pure element (e.g., 'Fe', 'O2', 'S8'), return
        the element symbol. Otherwise return None."""
        parsed = parse_formula(formula)
        if len(parsed) == 1:
            return next(iter(parsed))
        return None

    @staticmethod
    def _binary_formula(metal: str, nonmetal: str) -> str | None:
        """Build a binary ionic compound formula from a metal and nonmetal."""
        m_charge = _METAL_CHARGES.get(metal)
        nm_charge = _NONMETAL_CHARGES.get(nonmetal)
        if m_charge is None or nm_charge is None:
            return None

        # Cross-reduce charges to get subscripts
        nm_abs = abs(nm_charge)
        from math import gcd as _gcd
        g = _gcd(m_charge, nm_abs)
        m_sub = nm_abs // g
        nm_sub = m_charge // g

        m_part = metal if m_sub == 1 else f"{metal}{m_sub}"
        nm_part = nonmetal if nm_sub == 1 else f"{nonmetal}{nm_sub}"
        return m_part + nm_part

    # ------------------------------------------------------------------
    # NEW: Metal + water
    # ------------------------------------------------------------------

    def _try_metal_water(self, reactants: list[str]) -> dict | None:
        """Alkali / alkaline-earth metal + H2O -> metal hydroxide + H2."""
        metal = None
        has_water = False
        for r in reactants:
            if self._is_water(r):
                has_water = True
            elif self._is_metal(r):
                metal = r

        if metal is None or not has_water:
            return None

        # Only alkali and alkaline earth metals react with water
        if metal not in _ALKALI_METALS and metal not in _ALKALINE_EARTH_METALS:
            return None

        charge = _METAL_CHARGES.get(metal, 1)
        if charge == 1:
            hydroxide = f"{metal}OH"
        else:
            hydroxide = f"{metal}(OH){charge}"

        # Register the hydroxide in _KNOWN_SALTS if not already there
        if hydroxide not in _KNOWN_SALTS:
            _KNOWN_SALTS[hydroxide] = (metal, "OH")

        products = [hydroxide, "H2"]
        return self._result(SINGLE_DISPLACEMENT, reactants, products)

    # ------------------------------------------------------------------
    # NEW: Oxide + water
    # ------------------------------------------------------------------

    def _try_oxide_water(self, reactants: list[str]) -> dict | None:
        """Metal oxide + H2O -> metal hydroxide.
        Nonmetal oxide + H2O -> acid."""
        oxide = None
        has_water = False
        for r in reactants:
            if self._is_water(r):
                has_water = True
            else:
                oxide = r

        if oxide is None or not has_water:
            return None

        # Metal oxide + water -> hydroxide
        if oxide in _METAL_OXIDES:
            metal = _METAL_OXIDES[oxide]
            charge = _METAL_CHARGES.get(metal, 2)
            if charge == 1:
                hydroxide = f"{metal}OH"
            else:
                hydroxide = f"{metal}(OH){charge}"
            if hydroxide not in _KNOWN_SALTS:
                _KNOWN_SALTS[hydroxide] = (metal, "OH")
            return self._result(SYNTHESIS, [oxide, "H2O"], [hydroxide])

        # Nonmetal oxide + water -> acid
        if oxide in _NONMETAL_OXIDE_ACIDS:
            acid = _NONMETAL_OXIDE_ACIDS[oxide]
            return self._result(SYNTHESIS, [oxide, "H2O"], [acid])

        return None

    # ------------------------------------------------------------------
    # NEW: Double displacement (general)
    # ------------------------------------------------------------------

    def _try_double_displacement(self, reactants: list[str]) -> dict | None:
        """Any two ionic compounds -> swap ions, check if products differ
        from reactants. A reaction occurs if at least one product is
        insoluble, a gas, or water."""
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
        prod1 = _make_salt_formula(cat1, an2)
        prod2 = _make_salt_formula(cat2, an1)

        # Check driving forces
        has_precipitate = self._is_insoluble(cat1, an2) or self._is_insoluble(cat2, an1)
        forms_water = prod1 == "H2O" or prod2 == "H2O" or (cat1 == "H" and an2 == "OH") or (cat2 == "H" and an1 == "OH")
        forms_gas = prod1 in ("CO2", "SO2", "H2S", "NH3") or prod2 in ("CO2", "SO2", "H2S", "NH3")

        if not has_precipitate and not forms_water and not forms_gas:
            return None

        products = [prod1, prod2]
        rtype = PRECIPITATION if has_precipitate else DOUBLE_DISPLACEMENT
        return self._result(rtype, reactants, products)

    # ------------------------------------------------------------------
    # NEW: Acid + metal oxide
    # ------------------------------------------------------------------

    def _try_acid_metal_oxide(self, reactants: list[str]) -> dict | None:
        """Acid + metal oxide -> salt + H2O."""
        acid = oxide = None
        for r in reactants:
            if self._is_acid(r):
                acid = r
            elif r in _METAL_OXIDES:
                oxide = r

        if acid is None or oxide is None:
            return None

        metal = _METAL_OXIDES[oxide]
        _, acid_anion = _KNOWN_ACIDS[acid]
        salt = _make_salt_formula(metal, acid_anion)
        products = [salt, "H2O"]
        return self._result(ACID_BASE, reactants, products)

    def _try_thermal_decomposition(
        self, reactants: list[str], conditions: dict | None = None
    ) -> dict | None:
        """Thermal decomposition when temperature > 100C.

        Known decompositions:
        - Carbonates -> metal oxide + CO2
        - Hydroxides -> metal oxide + H2O
        - Bicarbonates -> carbonate + H2O + CO2
        - Chlorates -> chloride + O2
        - Nitrates -> varies by metal
        - H2O2 -> H2O + O2
        - Ammonium salts -> ammonia + acid
        """
        if conditions is None:
            return None
        temp = conditions.get("temperature", 25)
        if temp <= 100:
            return None

        if len(reactants) != 1:
            return None

        compound = reactants[0]

        # Carbonate decomposition: MCO3 -> MO + CO2
        if self._is_carbonate(compound):
            cation, _ = _KNOWN_SALTS[compound]
            charge = _METAL_CHARGES.get(cation, 2)
            if charge == 1:
                oxide = f"{cation}2O"
            else:
                oxide = f"{cation}O"
            products = [oxide, "CO2"]
            return self._result(DECOMPOSITION, reactants, products)

        # Hydroxide decomposition: M(OH)n -> MxOy + H2O
        if compound in _KNOWN_SALTS and _KNOWN_SALTS[compound][1] == "OH":
            cation = _KNOWN_SALTS[compound][0]
            # Alkali metal hydroxides are too stable for simple thermal decomp
            if cation in _ALKALI_METALS:
                return None
            charge = _METAL_CHARGES.get(cation, 2)
            if charge == 1:
                oxide = f"{cation}2O"
            else:
                oxide = f"{cation}O"
            products = [oxide, "H2O"]
            return self._result(DECOMPOSITION, reactants, products)

        # Bicarbonate decomposition: 2NaHCO3 -> Na2CO3 + H2O + CO2
        _BICARBONATES = {
            "NaHCO3": "Na2CO3", "KHCO3": "K2CO3",
            "Ca(HCO3)2": "CaCO3", "Mg(HCO3)2": "MgCO3",
            "NH4HCO3": None,  # special: -> NH3 + H2O + CO2
        }
        if compound in _BICARBONATES:
            carbonate = _BICARBONATES[compound]
            if carbonate is None:
                products = ["NH3", "H2O", "CO2"]
            else:
                products = [carbonate, "H2O", "CO2"]
            return self._result(DECOMPOSITION, reactants, products)

        # Chlorate decomposition: 2KClO3 -> 2KCl + 3O2
        _CHLORATES = {"KClO3": "KCl", "NaClO3": "NaCl"}
        if compound in _CHLORATES:
            products = [_CHLORATES[compound], "O2"]
            return self._result(DECOMPOSITION, reactants, products)

        # Nitrate decomposition (depends on metal activity)
        if compound in _KNOWN_SALTS and _KNOWN_SALTS[compound][1] == "NO3":
            cation = _KNOWN_SALTS[compound][0]
            if cation in ("NH4",):
                products = ["N2O", "H2O"]
                return self._result(DECOMPOSITION, reactants, products)
            # Active metals (Na, K): nitrate -> nitrite + O2
            if cation in _ALKALI_METALS:
                nitrite = f"{cation}NO2"
                products = [nitrite, "O2"]
                return self._result(DECOMPOSITION, reactants, products)
            # Less active metals: nitrate -> oxide + NO2 + O2
            charge = _METAL_CHARGES.get(cation, 2)
            if charge == 1:
                oxide = f"{cation}2O"
            else:
                oxide = f"{cation}O"
            products = [oxide, "NO2", "O2"]
            return self._result(DECOMPOSITION, reactants, products)

        # H2O2 decomposition
        if compound == "H2O2":
            products = ["H2O", "O2"]
            return self._result(DECOMPOSITION, reactants, products)

        # Ammonium salts: NH4Cl -> NH3 + HCl
        if compound in _KNOWN_SALTS and _KNOWN_SALTS[compound][0] == "NH4":
            _, anion = _KNOWN_SALTS[compound]
            acid = _make_salt_formula("H", anion)
            products = ["NH3", acid]
            return self._result(DECOMPOSITION, reactants, products)

        return None

    # ------------------------------------------------------------------
    # NEW: Metal combustion (metal + O2 -> metal oxide)
    # ------------------------------------------------------------------

    def _try_metal_combustion(self, reactants: list[str]) -> dict | None:
        """Metal + O2 -> metal oxide."""
        metal = None
        has_o2 = False
        for r in reactants:
            if r == "O2":
                has_o2 = True
            elif self._is_metal(r):
                metal = r

        if metal is None or not has_o2:
            return None

        # Build oxide formula based on charge
        charge = _METAL_CHARGES.get(metal)
        if charge is None:
            return None

        # Cross with O^2-
        from math import gcd as _gcd
        g = _gcd(charge, 2)
        m_sub = 2 // g
        o_sub = charge // g

        m_part = metal if m_sub == 1 else f"{metal}{m_sub}"
        o_part = "O" if o_sub == 1 else f"O{o_sub}"
        product = m_part + o_part

        result = self._result(COMBUSTION, reactants, [product])
        result["conditions"] = {"min_temperature": 200}
        return result

    # ------------------------------------------------------------------
    # NEW: Acid + hydroxide (broader than existing acid_base)
    # ------------------------------------------------------------------

    def _try_acid_hydroxide(self, reactants: list[str]) -> dict | None:
        """Acid + any metal hydroxide -> salt + water.
        Broader than _try_acid_base: handles hydroxides not in _KNOWN_SALTS
        by checking the formula for OH pattern.
        """
        acid = hydroxide = None
        for r in reactants:
            if self._is_acid(r):
                acid = r
            elif "OH" in r and r not in _KNOWN_ACIDS:
                hydroxide = r

        if acid is None or hydroxide is None:
            return None

        # Already handled by _try_acid_base
        if self._is_base(hydroxide):
            return None

        # Try to extract metal from hydroxide
        ions = self._ions(hydroxide)
        if ions is None:
            return None
        cation, _ = ions
        _, acid_anion = _KNOWN_ACIDS[acid]
        salt = _make_salt_formula(cation, acid_anion)
        products = [salt, "H2O"]
        return self._result(ACID_BASE, reactants, products)

    # ------------------------------------------------------------------
    # NEW: Halogen displacement (Cl2 + KBr -> KCl + Br2)
    # ------------------------------------------------------------------

    def _try_halogen_displacement(self, reactants: list[str]) -> dict | None:
        """A more reactive halogen displaces a less reactive one from a salt.
        Activity order: F2 > Cl2 > Br2 > I2
        """
        _HALOGEN_ACTIVITY = {"F": 0, "Cl": 1, "Br": 2, "I": 3}
        _HALOGEN_DIATOMIC = {"F": "F2", "Cl": "Cl2", "Br": "Br2", "I": "I2"}

        _HALOGEN_FROM_FORMULA = {"F2": "F", "Cl2": "Cl", "Br2": "Br", "I2": "I"}
        halogen_elem = None
        halogen_formula = None
        salt = None
        for r in reactants:
            if r in _HALOGEN_FROM_FORMULA:
                halogen_formula = r
                halogen_elem = _HALOGEN_FROM_FORMULA[r]
            elif self._is_salt(r):
                salt = r

        if halogen_elem is None or salt is None:
            return None

        cation, anion = _KNOWN_SALTS[salt]
        # Anion must be a halide
        if anion not in _HALOGEN_ACTIVITY:
            return None
        if halogen_elem not in _HALOGEN_ACTIVITY:
            return None

        # Incoming halogen must be more reactive (lower index)
        if _HALOGEN_ACTIVITY[halogen_elem] >= _HALOGEN_ACTIVITY[anion]:
            return None

        new_salt = _make_salt_formula(cation, halogen_elem)
        displaced = _HALOGEN_DIATOMIC[anion]
        return self._result(SINGLE_DISPLACEMENT, reactants, [new_salt, displaced])

    @staticmethod
    def _is_organic(formula: str) -> bool:
        """Check if a formula represents an organic compound (contains C and H)."""
        return bool(re.search(r"C", formula) and re.search(r"H", formula))

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

    def predict(
        self, reactants: list[str], conditions: dict | None = None
    ) -> dict | None:
        """Try each rule in priority order and return the first match,
        or None if no known reaction pattern applies.

        Args:
            reactants: List of formula strings.
            conditions: Optional dict with temperature, pressure, catalyst.
        """
        for rule in (
            self._try_metal_acid,
            self._try_acid_base,
            self._try_acid_hydroxide,
            self._try_acid_carbonate,
            self._try_acid_metal_oxide,
            self._try_precipitation,
            self._try_double_displacement,
            self._try_metal_salt_displacement,
            self._try_halogen_displacement,
            self._try_metal_water,
            self._try_oxide_water,
            self._try_combustion,
            self._try_metal_combustion,
            self._try_synthesis,
        ):
            result = rule(reactants)
            if result is not None:
                return result

        # Thermal decomposition needs conditions
        result = self._try_thermal_decomposition(reactants, conditions)
        if result is not None:
            return result

        return None
