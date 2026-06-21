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


@router.post("/recommend")
def recommend_cards(request: dict):
    from app.engine.spend_optimizer import spend_optimizer

    monthly_spend = request.get("monthly_spend", {})
    current_cards = request.get("current_cards", [])

    with open(data_dir / "cards.json") as f:
        all_cards = json.load(f)

    current_card_ids = set(current_cards)
    candidates = [c for c in all_cards if c["id"] not in current_card_ids]

    recommendations = []
    for card in candidates:
        score = 0
        reasons = []
        annual_value = 0

        for category, amount in monthly_spend.items():
            bonus = card.get("bonus_categories", {}).get(category, card.get("base_earn_rate", 1))
            monthly_points = amount * bonus / 100
            annual_points = monthly_points * 12
            point_value_inr = annual_points * 0.5
            annual_value += point_value_inr
            if bonus > card.get("base_earn_rate", 1):
                reasons.append(f"{bonus}x on {category}")
                score += bonus * amount / 1000

        benefits_value = sum(b.get("annual_value", 0) for b in card.get("benefits", []))
        annual_value += benefits_value
        net_value = annual_value - card.get("annual_fee", 0)
        roi = (annual_value / card["annual_fee"] * 100) if card.get("annual_fee", 0) > 0 else 999

        if net_value > 0:
            recommendations.append({
                "card_id": card["id"],
                "card_name": card["name"],
                "bank": card["bank"],
                "annual_fee": card["annual_fee"],
                "estimated_annual_value": round(annual_value),
                "net_value": round(net_value),
                "roi_percent": round(roi),
                "top_reasons": reasons[:3],
                "score": round(score, 1),
                "image_color": card.get("image_color", "#666"),
            })

    recommendations.sort(key=lambda x: x["net_value"], reverse=True)
    return {
        "recommendations": recommendations[:5],
        "based_on_spend": monthly_spend,
        "current_cards_count": len(current_cards),
    }
