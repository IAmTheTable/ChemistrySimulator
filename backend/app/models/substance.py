from pydantic import BaseModel


class Substance(BaseModel):
    formula: str
    name: str
    phase: str  # "s", "l", "g", "aq"
    color: str
    amount_ml: float | None = None
    concentration: float | None = None
    molar_mass: float | None = None
    hazard_class: str | None = None


class SubstanceInput(BaseModel):
    formula: str
    amount_g: float | None = None
    amount_ml: float | None = None
    phase: str
