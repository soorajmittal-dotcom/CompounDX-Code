import json
from pathlib import Path


class BenefitsEngine:
    def __init__(self):
        data_dir = Path(__file__).parent.parent / "data"
        with open(data_dir / "cards.json") as f:
            self.cards = json.load(f)

    def get_all_benefits(self, user_cards: list[int] | None = None) -> dict:
        available_cards = self.cards
        if user_cards:
            available_cards = [c for c in self.cards if c["id"] in user_cards]

        all_benefits = []
        total_value = 0
        by_type = {}

        for card in available_cards:
            for benefit in card.get("benefits", []):
                entry = {
                    "card_name": card["name"],
                    "card_bank": card["bank"],
                    "type": benefit["type"],
                    "description": benefit["description"],
                    "annual_value": benefit["annual_value"],
                    "image_color": card["image_color"],
                }
                all_benefits.append(entry)
                total_value += benefit["annual_value"]

                if benefit["type"] not in by_type:
                    by_type[benefit["type"]] = []
                by_type[benefit["type"]].append(entry)

        total_fees = sum(c["annual_fee"] for c in available_cards)

        return {
            "benefits": all_benefits,
            "by_type": by_type,
            "total_annual_value": total_value,
            "total_annual_fees": total_fees,
            "net_value": total_value - total_fees,
            "roi_percentage": round((total_value / total_fees * 100), 1) if total_fees > 0 else 0,
            "summary": {
                "lounge_value": sum(b["annual_value"] for b in all_benefits if b["type"] == "lounge"),
                "golf_value": sum(b["annual_value"] for b in all_benefits if b["type"] == "golf"),
                "insurance_value": sum(b["annual_value"] for b in all_benefits if b["type"] == "insurance"),
                "milestone_value": sum(b["annual_value"] for b in all_benefits if b["type"] == "milestone"),
                "dining_value": sum(b["annual_value"] for b in all_benefits if b["type"] == "dining"),
                "forex_value": sum(b["annual_value"] for b in all_benefits if b["type"] == "forex"),
            },
        }

    def get_unused_benefits_estimate(self, user_cards: list[int] | None = None) -> dict:
        all_benefits = self.get_all_benefits(user_cards)

        unused_estimate = []
        for benefit in all_benefits["benefits"]:
            if benefit["type"] in ["golf", "meet_greet", "concierge", "travel_credit"]:
                unused_estimate.append({
                    **benefit,
                    "likely_unused": True,
                    "tip": f"You may be missing out on ₹{benefit['annual_value']:,} annually from {benefit['description']}",
                })

        return {
            "potentially_unused": unused_estimate,
            "total_unused_value": sum(b["annual_value"] for b in unused_estimate),
            "tip": "These benefits are commonly underutilized. Make sure you're taking advantage of them!",
        }

    def annual_fee_justification(self, card_id: int, annual_spend: float = 0) -> dict:
        card = next((c for c in self.cards if c["id"] == card_id), None)
        if not card:
            return {"error": "Card not found"}

        benefits_value = sum(b["annual_value"] for b in card.get("benefits", []))
        fee = card["annual_fee"]
        roi = (benefits_value / fee * 100) if fee > 0 else float("inf")

        return {
            "card_name": card["name"],
            "annual_fee": fee,
            "benefits_value": benefits_value,
            "roi_percentage": round(roi, 1),
            "net_value": benefits_value - fee,
            "recommendation": "Keep" if benefits_value > fee else "Consider downgrading",
            "breakdown": card.get("benefits", []),
        }


benefits_engine = BenefitsEngine()
