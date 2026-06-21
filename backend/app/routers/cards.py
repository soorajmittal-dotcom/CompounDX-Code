import json
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(prefix="/api/cards", tags=["cards"])

data_dir = Path(__file__).parent.parent / "data"


@router.get("/")
def list_cards():
    with open(data_dir / "cards.json") as f:
        cards = json.load(f)
    return {"cards": cards, "total": len(cards)}


@router.get("/{card_id}")
def get_card(card_id: int):
    with open(data_dir / "cards.json") as f:
        cards = json.load(f)
    card = next((c for c in cards if c["id"] == card_id), None)
    if not card:
        return {"error": "Card not found"}
    return card


@router.get("/programs/airlines")
def list_airline_programs():
    with open(data_dir / "airline_programs.json") as f:
        programs = json.load(f)
    return {"programs": programs, "total": len(programs)}


@router.get("/programs/hotels")
def list_hotel_programs():
    with open(data_dir / "hotel_programs.json") as f:
        programs = json.load(f)
    return {"programs": programs, "total": len(programs)}


@router.get("/valuations")
def get_valuations():
    with open(data_dir / "point_valuations.json") as f:
        valuations = json.load(f)
    return valuations
