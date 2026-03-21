"""ReactionEngine: pipeline orchestrator for chemistry reactions.

Coordinates the matcher, predictor, equation balancer, thermodynamics
calculator, and effects mapper to produce a complete ReactionResult.
"""

from __future__ import annotations

from app.engine.reaction_matcher import ReactionMatcher
from app.engine.reaction_predictor import ReactionPredictor
from app.engine.equation_balancer import balance_equation
from app.engine.thermodynamics import ThermodynamicsCalculator
from app.engine.effects_mapper import EffectsMapper
from app.engine.nomenclature import name_compound
from app.models.reaction import ReactionResult, ReactionEffects


class ReactionEngine:
    """Orchestrates the full reaction pipeline."""

    def __init__(self) -> None:
        self._matcher = ReactionMatcher()
        self._predictor = ReactionPredictor()
        self._thermo = ThermodynamicsCalculator()
        self._effects_mapper = EffectsMapper()

    def run(
        self,
        reactants: list[dict],
        conditions: dict,
    ) -> ReactionResult:
        """Run the reaction pipeline.

        Args:
            reactants: List of dicts, each with at least a "formula" key,
                       plus optional "amount_g", "amount_ml", "phase".
            conditions: Dict with "temperature", "pressure", "catalyst".

        Returns:
            A fully populated ReactionResult.
        """
        # 1. Extract formulas
        formulas = [r["formula"] for r in reactants]

        # Compute total volume for thermodynamics (sum of amount_ml values)
        total_volume_ml = sum(r.get("amount_ml", 0.0) for r in reactants)
        # Ensure a minimum volume for calculations
        if total_volume_ml <= 0:
            total_volume_ml = 100.0

        # 2. Try curated match
        curated = self._matcher.match(formulas)
        if curated is not None:
            return self._build_curated_result(curated, reactants, total_volume_ml)

        # 3. Try predicted reaction
        predicted = self._predictor.predict(formulas)
        if predicted is not None:
            return self._build_predicted_result(predicted, reactants, total_volume_ml)

        # 4. No reaction
        return self._build_no_reaction_result(reactants)

    def _build_curated_result(
        self,
        curated: dict,
        reactants: list[dict],
        total_volume_ml: float,
    ) -> ReactionResult:
        """Build a ReactionResult from a curated reaction entry."""
        equation = curated["equation"]
        reaction_type = curated["reaction_type"]
        delta_h = curated.get("delta_h")
        products_detail = curated.get("products_detail", [])
        curated_effects = curated.get("effects")

        # Enrich products with compound names
        for product in products_detail:
            if "formula" in product and "name" not in product:
                product["name"] = name_compound(product["formula"])

        # Map effects using curated effects data
        effects = self._effects_mapper.map_effects(
            reaction_type=reaction_type,
            delta_h=delta_h,
            products=products_detail,
            source="curated",
            curated_effects=curated_effects,
        )

        return ReactionResult(
            equation=equation,
            reaction_type=reaction_type,
            source="curated",
            reactants=reactants,
            products=products_detail,
            delta_h=delta_h,
            effects=effects,
        )

    def _build_predicted_result(
        self,
        predicted: dict,
        reactants: list[dict],
        total_volume_ml: float,
    ) -> ReactionResult:
        """Build a ReactionResult from a predicted reaction."""
        reaction_type = predicted["reaction_type"]
        reactant_formulas = predicted["reactant_formulas"]
        product_formulas = predicted["product_formulas"]

        # Balance the equation
        coefficients = balance_equation(reactant_formulas, product_formulas)

        # Build balanced equation string
        equation = self._format_equation(
            reactant_formulas, product_formulas, coefficients
        )

        # Compute thermodynamics
        thermo = self._thermo.calculate(
            reactant_formulas=reactant_formulas,
            product_formulas=product_formulas,
            coefficients=coefficients,
            total_volume_ml=total_volume_ml,
        )

        # Build products detail for effects mapper (minimal info)
        products_detail = [
            {"formula": f, "name": name_compound(f), "phase": "aq"}
            for f in product_formulas
        ]
        # Mark gaseous products
        for p in products_detail:
            if p["formula"] in ("H2", "O2", "CO2", "Cl2", "N2", "SO2", "NH3"):
                p["phase"] = "g"

        # Map effects (no curated effects for predicted reactions)
        effects = self._effects_mapper.map_effects(
            reaction_type=reaction_type,
            delta_h=thermo.get("delta_h"),
            products=products_detail,
            source="predicted",
            curated_effects=None,
        )

        return ReactionResult(
            equation=equation,
            reaction_type=reaction_type,
            source="predicted",
            reactants=reactants,
            products=products_detail,
            delta_h=thermo.get("delta_h"),
            delta_s=thermo.get("delta_s"),
            delta_g=thermo.get("delta_g"),
            spontaneous=thermo.get("spontaneous", False),
            temp_change=thermo.get("temp_change", 0.0),
            effects=effects,
        )

    @staticmethod
    def _build_no_reaction_result(reactants: list[dict]) -> ReactionResult:
        """Build a ReactionResult indicating no reaction occurred."""
        return ReactionResult(
            equation="No reaction",
            reaction_type="none",
            source="none",
            reactants=reactants,
            products=[],
            effects=ReactionEffects(),
        )

    @staticmethod
    def _format_equation(
        reactant_formulas: list[str],
        product_formulas: list[str],
        coefficients: list[int],
    ) -> str:
        """Format a balanced equation string from formulas and coefficients."""
        n_reactants = len(reactant_formulas)
        reactant_coeffs = coefficients[:n_reactants]
        product_coeffs = coefficients[n_reactants:]

        def _terms(formulas: list[str], coeffs: list[int]) -> list[str]:
            parts = []
            for formula, coeff in zip(formulas, coeffs):
                if coeff == 1:
                    parts.append(formula)
                else:
                    parts.append(f"{coeff}{formula}")
            return parts

        lhs = " + ".join(_terms(reactant_formulas, reactant_coeffs))
        rhs = " + ".join(_terms(product_formulas, product_coeffs))
        return f"{lhs} -> {rhs}"
