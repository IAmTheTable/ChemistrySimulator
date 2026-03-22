"""EffectsMapper: derives visual and sound effects from reaction properties.

Given reaction metadata (type, delta_h, products, source) this module
produces a populated ReactionEffects instance suitable for front-end
rendering.
"""

from __future__ import annotations

from app.models.reaction import ReactionEffects


class EffectsMapper:
    """Map reaction properties to a ReactionEffects object."""

    def map_effects(
        self,
        reaction_type: str,
        delta_h: float | None,
        products: list[dict],
        source: str,
        curated_effects: dict | None,
    ) -> ReactionEffects:
        """Derive or pass through visual/audio effects for a reaction.

        Args:
            reaction_type:   Reaction classification string (e.g. "combustion").
            delta_h:         Enthalpy change in kJ/mol.  None means unknown.
            products:        List of product dicts with at minimum "formula"
                             and "phase" keys.
            source:          Origin of the reaction data ("curated" / "predicted").
            curated_effects: Pre-authored effects dict; when provided it is
                             used as-is and derivation logic is skipped.

        Returns:
            A fully populated ReactionEffects instance.
        """
        if curated_effects is not None:
            return self._from_curated(curated_effects)

        if reaction_type == "mixture":
            return self._mixture_effects()

        return self._derive(reaction_type, delta_h, products)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _mixture_effects() -> ReactionEffects:
        """Return minimal effects for a mixture (no chemical change)."""
        return ReactionEffects(
            sounds=["pour"],
        )

    def _from_curated(self, curated: dict) -> ReactionEffects:
        """Build a ReactionEffects directly from a curated effects dict."""
        return ReactionEffects(
            color=curated.get("color"),
            gas=curated.get("gas"),
            heat=curated.get("heat"),
            precipitate=curated.get("precipitate"),
            special=curated.get("special", []),
            sounds=curated.get("sounds", []),
            safety=curated.get("safety", []),
        )

    def _derive(
        self,
        reaction_type: str,
        delta_h: float | None,
        products: list[dict],
    ) -> ReactionEffects:
        """Derive ReactionEffects from reaction properties."""
        sounds: list[str] = []
        safety: list[str] = []
        special: list[str] = []

        # --- Gas detection -------------------------------------------
        gas: dict | None = None
        for p in products:
            if p.get("phase") == "g":
                formula = p.get("formula", "")
                abs_dh = abs(delta_h) if delta_h is not None else 0
                if abs_dh > 100:
                    rate = "vigorous"
                elif abs_dh > 50:
                    rate = "moderate"
                else:
                    rate = "gentle"
                gas = {"type": formula, "rate": rate}
                break  # use first gaseous product

        # --- Precipitate detection ------------------------------------
        precipitate: dict | None = None
        phases = [p.get("phase") for p in products]
        has_solid = "s" in phases
        has_aqueous = "aq" in phases
        if has_solid and has_aqueous:
            precipitate = {"color": "#ffffff", "speed": "moderate"}

        # --- Heat / sound from delta_h --------------------------------
        heat: str | None = None
        if delta_h is not None:
            if delta_h < -100:
                heat = "exothermic"
                sounds.append("sizzle")
            elif delta_h < 0:
                heat = "exothermic"
                sounds.append("fizz_gentle")
            else:
                heat = "endothermic"

        # --- Combustion special effect --------------------------------
        if reaction_type == "combustion":
            special.append("flame")

        # --- Safety warnings -----------------------------------------
        product_formulas = {p.get("formula") for p in products}
        if "H2" in product_formulas:
            safety.append("flammable_gas")
        if "Cl2" in product_formulas:
            safety.append("toxic_gas")

        return ReactionEffects(
            gas=gas,
            heat=heat,
            precipitate=precipitate,
            special=special,
            sounds=sounds,
            safety=safety,
        )
