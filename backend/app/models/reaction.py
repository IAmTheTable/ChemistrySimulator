from pydantic import BaseModel


class ReactionEffects(BaseModel):
    color: dict | None = None
    gas: dict | None = None
    heat: str | None = None
    precipitate: dict | None = None
    special: list[str] = []
    sounds: list[str] = []
    safety: list[str] = []


class ReactionResult(BaseModel):
    equation: str
    reaction_type: str
    source: str
    reactants: list[dict] = []
    products: list[dict] = []
    limiting_reagent: str | None = None
    yield_percent: float = 0.0
    delta_h: float | None = None
    delta_s: float | None = None
    delta_g: float | None = None
    spontaneous: bool = False
    temp_change: float = 0.0
    effects: ReactionEffects = ReactionEffects()


class ReactionEvent(BaseModel):
    event: str
    data: dict = {}
    timestamp: float = 0.0
