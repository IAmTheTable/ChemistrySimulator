from app.models.element import Element


def test_element_creation():
    hydrogen = Element(
        atomic_number=1,
        symbol="H",
        name="Hydrogen",
        atomic_mass=1.008,
        category="nonmetal",
        phase_at_stp="gas",
        electron_configuration="1s1",
        electron_configuration_semantic="1s1",
        electronegativity_pauling=2.20,
        first_ionization_energy=1312.0,
        atomic_radius=25.0,
        covalent_radius=31.0,
        van_der_waals_radius=120.0,
        melting_point=-259.16,
        boiling_point=-252.87,
        density=0.00008988,
        oxidation_states=[-1, 1],
        group=1,
        period=1,
        block="s",
        crystal_structure="hexagonal",
        magnetic_ordering="diamagnetic",
        cpk_hex_color="FFFFFF",
        isotopes=[
            {"mass_number": 1, "atomic_mass": 1.00783, "abundance": 0.999885, "stable": True},
            {"mass_number": 2, "atomic_mass": 2.01410, "abundance": 0.000115, "stable": True},
            {"mass_number": 3, "atomic_mass": 3.01605, "abundance": None, "stable": False},
        ],
        shells=[1],
        summary="Hydrogen is the lightest element.",
    )
    assert hydrogen.atomic_number == 1
    assert hydrogen.symbol == "H"
    assert hydrogen.oxidation_states == [-1, 1]
    assert len(hydrogen.isotopes) == 3


def test_element_optional_fields():
    """Elements with missing data should still be valid."""
    oganesson = Element(
        atomic_number=118,
        symbol="Og",
        name="Oganesson",
        atomic_mass=294.0,
        category="unknown",
        phase_at_stp="unknown",
        electron_configuration="[Rn] 5f14 6d10 7s2 7p6",
        electron_configuration_semantic="[Rn] 5f14 6d10 7s2 7p6",
        electronegativity_pauling=None,
        first_ionization_energy=None,
        atomic_radius=None,
        covalent_radius=None,
        van_der_waals_radius=None,
        melting_point=None,
        boiling_point=None,
        density=None,
        oxidation_states=[],
        group=18,
        period=7,
        block="p",
        crystal_structure=None,
        magnetic_ordering=None,
        cpk_hex_color=None,
        isotopes=[],
        shells=[2, 8, 18, 32, 32, 18, 8],
        summary="Oganesson is a synthetic element.",
    )
    assert oganesson.electronegativity_pauling is None
    assert oganesson.melting_point is None
