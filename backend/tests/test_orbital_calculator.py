from app.engine.orbital_calculator import OrbitalCalculator
from app.models.structure import OrbitalData


def test_hydrogen_orbitals():
    calc = OrbitalCalculator()
    data = calc.get_orbitals(1)
    assert isinstance(data, OrbitalData)
    assert data.element == "Hydrogen"
    assert len(data.orbitals) == 1
    assert data.orbitals[0].label == "1s"
    assert data.orbitals[0].shape == "sphere"


def test_carbon_orbitals():
    calc = OrbitalCalculator()
    data = calc.get_orbitals(6)
    assert data.element == "Carbon"
    assert len(data.orbitals) == 3  # 1s, 2s, 2p
    p_orbital = next(o for o in data.orbitals if o.label == "2p")
    assert p_orbital.shape == "dumbbell"
    assert p_orbital.electrons == 2
    assert set(p_orbital.orientations) == {"x", "y", "z"}


def test_iron_orbitals():
    calc = OrbitalCalculator()
    data = calc.get_orbitals(26)
    assert data.element == "Iron"
    d_orbital = next(o for o in data.orbitals if "3d" in o.label)
    assert d_orbital.shape == "cloverleaf"
    assert d_orbital.electrons == 6


def test_orbital_radius_increases_with_n():
    calc = OrbitalCalculator()
    data = calc.get_orbitals(11)  # Sodium: 1s2 2s2 2p6 3s1
    radii = {o.label: o.radius for o in data.orbitals}
    assert radii["1s"] < radii["2s"] < radii["3s"]
