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
from app.engine.constants import MIXTURE, NO_REACTION, AQUEOUS, GAS, SOLID
from app.models.reaction import ReactionResult, ReactionEffects

# Phase symbol labels for state notation
_PHASE_SYMBOLS: dict[str, str] = {
    "s": "(s)",
    "l": "(l)",
    "g": "(g)",
    "aq": "(aq)",
}

# Alkali metals for safety notes
_ALKALI_METALS = {"Li", "Na", "K", "Rb", "Cs", "Fr"}


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
        predicted = self._predictor.predict(formulas, conditions)
        if predicted is not None:
            return self._build_predicted_result(predicted, reactants, total_volume_ml)

        # 4. General mixture fallback — substances mixed but no chemical change
        if len(formulas) >= 2:
            return self._build_mixture_result(formulas, reactants)

        # 5. No reaction
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

        # Build the new enrichment fields
        description = self._build_description(
            reactants, products_detail, reaction_type, delta_h,
        )
        observations = self._build_observations(effects, delta_h)
        safety_notes = self._build_safety_notes(
            reactants, products_detail, effects, delta_h,
        )
        balanced_with_states = self._build_equation_with_states(
            equation, reactants, products_detail,
        )

        return ReactionResult(
            equation=equation,
            reaction_type=reaction_type,
            source="curated",
            reactants=reactants,
            products=products_detail,
            delta_h=delta_h,
            effects=effects,
            description=description,
            observations=observations,
            safety_notes=safety_notes,
            balanced_with_states=balanced_with_states,
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
            {"formula": f, "name": name_compound(f), "phase": AQUEOUS}
            for f in product_formulas
        ]
        # Mark gaseous products
        for p in products_detail:
            if p["formula"] in ("H2", "O2", "CO2", "Cl2", "N2", "SO2", "NH3"):
                p["phase"] = GAS

        # Map effects (no curated effects for predicted reactions)
        effects = self._effects_mapper.map_effects(
            reaction_type=reaction_type,
            delta_h=thermo.get("delta_h"),
            products=products_detail,
            source="predicted",
            curated_effects=None,
        )

        predicted_delta_h = thermo.get("delta_h")

        # Build the new enrichment fields
        description = self._build_description(
            reactants, products_detail, reaction_type, predicted_delta_h,
        )
        observations = self._build_observations(effects, predicted_delta_h)
        safety_notes = self._build_safety_notes(
            reactants, products_detail, effects, predicted_delta_h,
        )
        balanced_with_states = self._build_equation_with_states(
            equation, reactants, products_detail,
        )

        return ReactionResult(
            equation=equation,
            reaction_type=reaction_type,
            source="predicted",
            reactants=reactants,
            products=products_detail,
            delta_h=predicted_delta_h,
            delta_s=thermo.get("delta_s"),
            delta_g=thermo.get("delta_g"),
            spontaneous=thermo.get("spontaneous", False),
            temp_change=thermo.get("temp_change", 0.0),
            effects=effects,
            description=description,
            observations=observations,
            safety_notes=safety_notes,
            balanced_with_states=balanced_with_states,
        )

    def _build_mixture_result(
        self,
        formulas: list[str],
        reactants: list[dict],
    ) -> ReactionResult:
        """Build a ReactionResult for substances that were mixed but did
        not undergo a chemical change."""
        equation = (
            " + ".join(formulas)
            + " -> mixture (no chemical change observed)"
        )
        products_detail = [
            {"formula": f, "name": name_compound(f), "phase": AQUEOUS}
            for f in formulas
        ]
        effects = self._effects_mapper.map_effects(
            reaction_type=MIXTURE,
            delta_h=None,
            products=products_detail,
            source="predicted",
            curated_effects=None,
        )
        reactant_names = [
            name_compound(f) for f in formulas
        ]
        description = (
            f"{' and '.join(reactant_names)} were mixed but no chemical "
            f"reaction was observed under current conditions."
        )

        return ReactionResult(
            equation=equation,
            reaction_type=MIXTURE,
            source="predicted",
            reactants=reactants,
            products=products_detail,
            effects=effects,
            description=description,
            observations=["Substances mix without visible chemical change"],
            safety_notes=[],
            balanced_with_states="",
        )

    @staticmethod
    def _build_no_reaction_result(reactants: list[dict]) -> ReactionResult:
        """Build a ReactionResult indicating no reaction occurred."""
        return ReactionResult(
            equation="No reaction",
            reaction_type=NO_REACTION,
            source=NO_REACTION,
            reactants=reactants,
            products=[],
            effects=ReactionEffects(),
        )

    # ------------------------------------------------------------------
    # Enrichment helpers: description, observations, safety, states
    # ------------------------------------------------------------------

    @staticmethod
    def _build_description(
        reactants: list[dict],
        products: list[dict],
        reaction_type: str,
        delta_h: float | None,
    ) -> str:
        """Generate a human-readable description of the reaction."""
        reactant_names = [
            name_compound(r.get("formula", r.get("formula", "")))
            for r in reactants
            if r.get("formula")
        ]
        product_names = [
            p.get("name") or name_compound(p.get("formula", ""))
            for p in products
            if p.get("formula")
        ]

        # Reaction type label
        type_labels = {
            "acid_base": "an acid-base neutralization reaction",
            "single_displacement": "a single displacement reaction",
            "double_displacement": "a double displacement reaction",
            "precipitation": "a precipitation reaction",
            "combustion": "a combustion reaction",
            "decomposition": "a decomposition reaction",
            "synthesis": "a synthesis reaction",
            "redox": "a redox reaction",
        }
        type_label = type_labels.get(reaction_type, f"a {reaction_type} reaction")

        # Energy description
        energy_part = ""
        if delta_h is not None:
            if delta_h < -200:
                energy_part = ", releasing a large amount of energy"
            elif delta_h < -50:
                energy_part = ", releasing energy as heat"
            elif delta_h < 0:
                energy_part = ", with a slight release of heat"
            elif delta_h > 50:
                energy_part = ", absorbing energy from the surroundings"
            elif delta_h > 0:
                energy_part = ", with slight energy absorption"

        # Vigor description
        vigor = ""
        if delta_h is not None and abs(delta_h) > 150:
            vigor = " vigorously"

        reactant_str = " and ".join(reactant_names[:3]) if reactant_names else "The reactants"
        product_str = " and ".join(product_names[:3]) if product_names else "products"

        return (
            f"{reactant_str} react{vigor} in {type_label}, "
            f"producing {product_str}{energy_part}."
        )

    @staticmethod
    def _build_observations(
        effects: ReactionEffects,
        delta_h: float | None,
    ) -> list[str]:
        """Generate observation strings from effects data."""
        observations: list[str] = []

        # Gas observations
        if effects.gas is not None:
            rate = effects.gas.get("rate", "gentle")
            gas_type = effects.gas.get("type", "gas")
            if rate == "vigorous":
                observations.append(
                    f"Vigorous effervescence as {gas_type} gas is produced"
                )
            elif rate == "moderate":
                observations.append(f"Gas bubbles observed ({gas_type})")
            else:
                observations.append(f"Gentle bubbling as {gas_type} gas evolves")

        # Precipitate observations
        if effects.precipitate is not None:
            color = effects.precipitate.get("color", "white")
            observations.append(
                f"A {color} precipitate forms and settles"
            )

        # Color change observations
        if effects.color is not None:
            from_color = effects.color.get("from", "")
            to_color = effects.color.get("to", "")
            if from_color and to_color:
                observations.append(
                    f"Solution changes from {from_color} to {to_color}"
                )
            elif to_color:
                observations.append(f"Solution turns {to_color}")

        # Heat observations
        if delta_h is not None:
            abs_dh = abs(delta_h)
            if delta_h < 0:
                if abs_dh > 200:
                    observations.append(
                        "Violent exothermic reaction, exercise extreme caution"
                    )
                elif abs_dh > 100:
                    observations.append(
                        "Significant heat released, temperature rises noticeably"
                    )
                elif abs_dh > 30:
                    observations.append("Container feels warm to the touch")
            else:
                if abs_dh > 30:
                    observations.append(
                        "Solution cools as heat is absorbed"
                    )

        # Special effects
        if "flame" in effects.special or "sparks" in effects.special:
            observations.append("Sparks or flame observed")

        return observations

    @staticmethod
    def _build_safety_notes(
        reactants: list[dict],
        products: list[dict],
        effects: ReactionEffects,
        delta_h: float | None,
    ) -> list[str]:
        """Generate safety warnings based on products and effects."""
        notes: list[str] = []
        product_formulas = {p.get("formula", "") for p in products}
        reactant_formulas = {r.get("formula", "") for r in reactants}
        all_formulas = product_formulas | reactant_formulas

        if "H2" in product_formulas:
            notes.append(
                "Hydrogen gas is flammable -- keep away from flames"
            )
        if "Cl2" in product_formulas:
            notes.append("Chlorine gas is toxic -- use fume hood")
        if "SO2" in product_formulas:
            notes.append("Sulfur dioxide is toxic -- use fume hood")
        if "NH3" in product_formulas:
            notes.append("Ammonia gas is irritating -- ensure ventilation")

        if "HCl" in all_formulas:
            notes.append("Hydrochloric acid is corrosive")
        if "H2SO4" in all_formulas:
            notes.append("Sulfuric acid is highly corrosive -- use proper PPE")
        if "HNO3" in all_formulas:
            notes.append("Nitric acid is corrosive and oxidizing")
        if "NaOH" in all_formulas or "KOH" in all_formulas:
            notes.append("Strong base is corrosive -- avoid skin contact")

        # Check for alkali metals + water
        for r in reactants:
            f = r.get("formula", "")
            if f in _ALKALI_METALS:
                notes.append(
                    "Never use large quantities -- reaction can be explosive"
                )
                break

        # Vigorous reaction warning
        if delta_h is not None and abs(delta_h) > 150:
            notes.append("Add reagents slowly to control reaction rate")

        return notes

    @staticmethod
    def _build_equation_with_states(
        equation: str,
        reactants: list[dict],
        products: list[dict],
    ) -> str:
        """Build a balanced equation string with state symbols appended.

        Uses phase info from reactants and products to annotate the
        equation, e.g. ``2Na(s) + 2H2O(l) -> 2NaOH(aq) + H2(g)``.
        """
        if not equation or "No reaction" in equation or "mixture" in equation:
            return ""

        # Build a lookup: formula -> phase symbol
        phase_map: dict[str, str] = {}
        for r in reactants:
            f = r.get("formula", "")
            phase = r.get("phase", "")
            if f and phase:
                phase_map[f] = _PHASE_SYMBOLS.get(phase, "")
        for p in products:
            f = p.get("formula", "")
            phase = p.get("phase", "")
            if f and phase:
                phase_map[f] = _PHASE_SYMBOLS.get(phase, "")

        # Split the equation into LHS and RHS on " -> "
        if " -> " not in equation:
            return equation

        lhs, rhs = equation.split(" -> ", 1)

        def _annotate_side(side: str) -> str:
            terms = side.split(" + ")
            annotated: list[str] = []
            for term in terms:
                term = term.strip()
                # Extract coefficient prefix (digits at start)
                i = 0
                while i < len(term) and term[i].isdigit():
                    i += 1
                coeff = term[:i]
                formula = term[i:]
                state = phase_map.get(formula, "")
                annotated.append(f"{coeff}{formula}{state}")
            return " + ".join(annotated)

        return f"{_annotate_side(lhs)} -> {_annotate_side(rhs)}"

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
