from app.engine.thermodynamics import ThermodynamicsCalculator


def test_exothermic_reaction():
    calc = ThermodynamicsCalculator()
    result = calc.calculate(
        reactant_formulas=["H2", "O2"],
        product_formulas=["H2O"],
        coefficients=[2, 1, 2],
        total_volume_ml=100.0,
    )
    assert result["delta_h"] is not None
    assert result["delta_h"] < 0  # Formation of water is exothermic


def test_spontaneity():
    calc = ThermodynamicsCalculator()
    result = calc.calculate(
        reactant_formulas=["Na", "H2O"],
        product_formulas=["NaOH", "H2"],
        coefficients=[2, 2, 2, 1],
        total_volume_ml=50.0,
    )
    assert result["spontaneous"] is True


def test_unknown_compound_returns_none():
    calc = ThermodynamicsCalculator()
    result = calc.calculate(
        reactant_formulas=["XYZ123"],
        product_formulas=["ABC456"],
        coefficients=[1, 1],
        total_volume_ml=50.0,
    )
    assert result["delta_h"] is None
