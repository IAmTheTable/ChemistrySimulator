from app.engine.equation_balancer import balance_equation, parse_formula


def test_parse_formula_simple():
    assert parse_formula("H2O") == {"H": 2, "O": 1}


def test_parse_formula_complex():
    assert parse_formula("Ca(OH)2") == {"Ca": 1, "O": 2, "H": 2}


def test_parse_formula_element():
    assert parse_formula("Na") == {"Na": 1}


def test_parse_formula_multi_digit():
    assert parse_formula("Fe2O3") == {"Fe": 2, "O": 3}


def test_balance_simple():
    coeffs = balance_equation(["H2", "O2"], ["H2O"])
    # 2H2 + O2 -> 2H2O
    assert coeffs == [2, 1, 2]


def test_balance_combustion():
    coeffs = balance_equation(["CH4", "O2"], ["CO2", "H2O"])
    # CH4 + 2O2 -> CO2 + 2H2O
    assert coeffs == [1, 2, 1, 2]


def test_balance_sodium_water():
    coeffs = balance_equation(["Na", "H2O"], ["NaOH", "H2"])
    # 2Na + 2H2O -> 2NaOH + H2
    assert coeffs == [2, 2, 2, 1]
