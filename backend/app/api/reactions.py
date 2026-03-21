import asyncio

from fastapi import APIRouter, WebSocket
from pydantic import BaseModel

from app.engine.reaction_engine import ReactionEngine
from app.models.reaction import ReactionResult, ReactionEvent

router = APIRouter(prefix="/api/reactions", tags=["reactions"])
_engine = ReactionEngine()


class ReactionRequest(BaseModel):
    reactants: list[dict]
    conditions: dict


@router.post("/run", response_model=ReactionResult)
def run_reaction(request: ReactionRequest):
    return _engine.run(request.reactants, request.conditions)


@router.websocket("/stream")
async def stream_reaction(websocket: WebSocket):
    await websocket.accept()
    data = await websocket.receive_json()
    request = ReactionRequest(**data)
    result = _engine.run(request.reactants, request.conditions)
    events = _generate_events(result)
    for event in events:
        await websocket.send_json(event.model_dump())
        await asyncio.sleep(event.timestamp)
    await websocket.close()


def _generate_events(result: ReactionResult) -> list[ReactionEvent]:
    events = [ReactionEvent(event="reaction_started", data={"equation": result.equation}, timestamp=0)]
    if result.effects.color:
        events.append(ReactionEvent(event="color_changing", data=result.effects.color, timestamp=0.5))
    if result.effects.gas:
        events.append(ReactionEvent(event="gas_producing", data=result.effects.gas, timestamp=1.0))
    if result.effects.heat:
        events.append(ReactionEvent(event="temp_rising", data={"heat": result.effects.heat, "temp_change": result.temp_change}, timestamp=1.0))
    if result.effects.precipitate:
        events.append(ReactionEvent(event="precipitate_forming", data=result.effects.precipitate, timestamp=1.0))
    events.append(ReactionEvent(event="reaction_complete", data=result.model_dump(), timestamp=1.0))
    return events
