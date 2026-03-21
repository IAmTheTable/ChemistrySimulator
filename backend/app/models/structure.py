from pydantic import BaseModel


class AtomData(BaseModel):
    index: int
    symbol: str
    x: float
    y: float
    z: float
    color: str
    radius: float


class BondData(BaseModel):
    atom1: int
    atom2: int
    order: int


class MoleculeData(BaseModel):
    formula: str
    name: str
    atoms: list[AtomData]
    bonds: list[BondData]
    properties: dict = {}


class OrbitalInfo(BaseModel):
    n: int
    l: int
    label: str
    electrons: int
    shape: str
    radius: float
    orientations: list[str] = []


class OrbitalData(BaseModel):
    element: str
    atomic_number: int
    electron_configuration: str
    orbitals: list[OrbitalInfo]
