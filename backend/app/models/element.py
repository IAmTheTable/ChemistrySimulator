from pydantic import BaseModel


class Isotope(BaseModel):
    mass_number: int
    atomic_mass: float
    abundance: float | None
    stable: bool


class Element(BaseModel):
    atomic_number: int
    symbol: str
    name: str
    atomic_mass: float
    category: str
    phase_at_stp: str
    electron_configuration: str
    electron_configuration_semantic: str
    electronegativity_pauling: float | None
    first_ionization_energy: float | None
    atomic_radius: float | None
    covalent_radius: float | None
    van_der_waals_radius: float | None
    melting_point: float | None
    boiling_point: float | None
    density: float | None
    oxidation_states: list[int]
    group: int | None
    period: int
    block: str
    crystal_structure: str | None
    magnetic_ordering: str | None
    cpk_hex_color: str | None
    isotopes: list[Isotope]
    shells: list[int]
    summary: str
