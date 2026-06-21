import json
from pathlib import Path


CATEGORY_MAPPINGS = {
    "travel": ["travel", "travel_portals", "travel_amex", "international"],
    "dining": ["dining", "weekend_dining"],
    "groceries": ["groceries", "grocery", "departmental_stores", "departmental"],
    "fuel": ["fuel"],
    "utilities": ["utilities"],
    "online": ["online_spends", "online"],
    "insurance": ["insurance"],
    "international": ["international"],
    "entertainment": ["entertainment", "movies"],
}


class SpendOptimizer:
    def __init__(self):
        data_dir = Path(__file__).parent.parent / "data"
        with open(data_dir / "cards.json") as f:
            self.cards = json.load(f)
        with open(data_dir / "point_valuations.json") as f:
            self.valuations = json.load(f)

    def optimize_spend(self, monthly_spend: dict[str, float], user_cards: list[int] | None = None) -> dict:
        available_cards = self.cards
        if user_cards:
            available_cards = [c for c in self.cards if c["id"] in user_cards]

        if not available_cards:
            available_cards = self.cards

        recommendations = []
        total_annual_value = 0.0

        for category, monthly_amount in monthly_spend.items():
            best_card = None
            best_value = 0.0

            for card in available_cards:
                earn_rate = self._get_earn_rate(card, category)
                cpp = self._get_cpp(card["points_currency"])
                value_per_inr = (earn_rate / 150) * cpp
                annual_value = monthly_amount * 12 * value_per_inr

                if annual_value > best_value:
                    best_value = annual_value
                    best_card = card

            if best_card:
                earn_rate = self._get_earn_rate(best_card, category)
                recommendations.append({
                    "category": category,
                    "monthly_spend": monthly_amount,
                    "recommended_card": best_card["name"],
                    "card_bank": best_card["bank"],
                    "earn_rate": earn_rate,
                    "points_currency": best_card["points_currency"],
                    "monthly_points": int(monthly_amount * earn_rate / 150),
                    "annual_value_inr": round(best_value, 0),
                    "image_color": best_card["image_color"],
                })
                total_annual_value += best_value

        recommendations.sort(key=lambda x: x["annual_value_inr"], reverse=True)

        total_annual_fees = sum(c["annual_fee"] for c in available_cards)
        net_value = total_annual_value - total_annual_fees

        return {
            "recommendations": recommendations,
            "total_annual_value_inr": round(total_annual_value, 0),
            "total_annual_fees": total_annual_fees,
            "net_annual_value": round(net_value, 0),
            "cards_used": list({r["recommended_card"] for r in recommendations}),
            "monthly_points_total": sum(r["monthly_points"] for r in recommendations),
        }

    def _get_earn_rate(self, card: dict, category: str) -> float:
        bonus_cats = card.get("bonus_categories", {})
        mapped_keys = CATEGORY_MAPPINGS.get(category, [category])

        best_rate = card.get("base_earn_rate", 1.0)
        for key in mapped_keys:
            if key in bonus_cats:
                best_rate = max(best_rate, bonus_cats[key])

        if "all_spends" in bonus_cats:
            best_rate = max(best_rate, bonus_cats["all_spends"])

        return best_rate

    def _get_cpp(self, currency: str) -> float:
        val = self.valuations.get(currency)
        if val:
            return val.get("transfer_value", val.get("cpp_inr", 0.25))
        return 0.25


spend_optimizer = SpendOptimizer()
