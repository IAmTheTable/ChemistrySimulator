"""Thermodynamics calculator using Hess's Law.

Computes ΔH_rxn, ΔS_rxn, ΔG_rxn, spontaneity, and estimated temperature
change for a given reaction using standard formation data.
"""

from __future__ import annotations

import json
from pathlib import Path

_DATA_PATH = Path(__file__).parent.parent / "data" / "thermodynamic_data.json"

# Standard temperature in Kelvin
_T_DEFAULT = 298.15

# Specific heat capacity of water (J / g·°C), used for temp_change estimate
_C_WATER = 4.184


class ThermodynamicsCalculator:
    """Calculate thermodynamic properties for a chemical reaction."""

    def __init__(self, data_path: Path | str | None = None) -> None:
        path = Path(data_path) if data_path is not None else _DATA_PATH
        with open(path, encoding="utf-8") as f:
            self._db: dict[str, dict[str, float]] = json.load(f)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def calculate(
        self,
        reactant_formulas: list[str],
        product_formulas: list[str],
        coefficients: list[int | float],
        total_volume_ml: float,
        temperature_k: float = _T_DEFAULT,
    ) -> dict:
        """Compute thermodynamic quantities for a reaction.

        Args:
            reactant_formulas: Chemical formulas of the reactants.
            product_formulas:  Chemical formulas of the products.
            coefficients:      Stoichiometric coefficients — reactants first,
                               then products, in the same order as the formula
                               lists.
            total_volume_ml:   Total solution volume in mL (used for ΔT
                               estimate assuming aqueous solution, density
                               1 g/mL).
            temperature_k:     Reaction temperature in Kelvin (default 298.15).

        Returns:
            dict with keys:
                delta_h    – ΔH_rxn in kJ/mol, or None if data missing.
                delta_s    – ΔS_rxn in J/(mol·K), or None if data missing.
                delta_g    – ΔG_rxn in kJ/mol, or None if data missing.
                spontaneous – True when ΔG < 0.
                temp_change – Estimated °C change in the solution.
        """
        n_reactants = len(reactant_formulas)
        reactant_coeffs = coefficients[:n_reactants]
        product_coeffs = coefficients[n_reactants:]

        delta_h = self._hess(
            reactant_formulas, product_formulas,
            reactant_coeffs, product_coeffs,
            key="delta_hf",
        )
        delta_s = self._hess(
            reactant_formulas, product_formulas,
            reactant_coeffs, product_coeffs,
            key="delta_sf",
        )

        if delta_h is None or delta_s is None:
            delta_g = None
            spontaneous = False
            temp_change = 0.0
        else:
            # ΔS must be converted from J/mol·K → kJ/mol·K before combining
            delta_g = delta_h - temperature_k * (delta_s / 1000.0)
            spontaneous = delta_g < 0

            # Rough calorimetry: Q = m·c·ΔT  →  ΔT = Q / (m·c)
            # |ΔH| in kJ/mol → J/mol via × 1000; mass ≈ volume (mL) × 1 g/mL
            mass_g = total_volume_ml  # density ≈ 1 g/mL for dilute aqueous
            temp_change = abs(delta_h * 1000.0) / (mass_g * _C_WATER)
            # Sign convention: positive ΔT for exothermic (delta_h < 0)
            if delta_h > 0:
                temp_change = -temp_change

        return {
            "delta_h": delta_h,
            "delta_s": delta_s,
            "delta_g": delta_g,
            "spontaneous": spontaneous,
            "temp_change": temp_change,
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _lookup(self, formula: str, key: str) -> float | None:
        """Return the requested thermodynamic value for *formula*.

        Returns 0.0 for pure elements in standard state (ΔHf° = 0 by
        definition) when they appear in the database with a zero value.
        Returns None when the formula is not in the database at all.
        """
        entry = self._db.get(formula)
        if entry is None:
            return None
        return entry.get(key)

    def _hess(
        self,
        reactant_formulas: list[str],
        product_formulas: list[str],
        reactant_coeffs: list[int | float],
        product_coeffs: list[int | float],
        key: str,
    ) -> float | None:
        """Apply Hess's Law: Σ(coeff·ΔXf°)_products − Σ(coeff·ΔXf°)_reactants.

        Returns None if any formula is missing from the database.
        """
        total_products = 0.0
        for formula, coeff in zip(product_formulas, product_coeffs):
            value = self._lookup(formula, key)
            if value is None:
                return None
            total_products += coeff * value

        total_reactants = 0.0
        for formula, coeff in zip(reactant_formulas, reactant_coeffs):
            value = self._lookup(formula, key)
            if value is None:
                return None
            total_reactants += coeff * value

        return total_products - total_reactants
