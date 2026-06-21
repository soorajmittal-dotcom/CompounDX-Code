import json
from pathlib import Path


class PointsValuator:
    def __init__(self):
        data_dir = Path(__file__).parent.parent / "data"
        with open(data_dir / "point_valuations.json") as f:
            self.valuations = json.load(f)

    def get_valuation(self, program: str) -> dict | None:
        return self.valuations.get(program)

    def calculate_portfolio_value(self, balances: dict[str, int]) -> dict:
        total_value = 0.0
        breakdown = []

        for program, balance in balances.items():
            val = self.valuations.get(program)
            if val:
                value = balance * val["cpp_inr"]
                transfer_value = balance * val.get("transfer_value", val["cpp_inr"])
                breakdown.append({
                    "program": program,
                    "balance": balance,
                    "cpp_inr": val["cpp_inr"],
                    "value_inr": value,
                    "transfer_value_inr": transfer_value,
                    "best_use": val["best_use"],
                })
                total_value += max(value, transfer_value)
            else:
                breakdown.append({
                    "program": program,
                    "balance": balance,
                    "cpp_inr": 0,
                    "value_inr": 0,
                    "transfer_value_inr": 0,
                    "best_use": "Unknown program",
                })

        breakdown.sort(key=lambda x: x["transfer_value_inr"], reverse=True)

        return {
            "total_value_inr": total_value,
            "total_value_formatted": f"₹{total_value:,.0f}",
            "programs_count": len(breakdown),
            "breakdown": breakdown,
        }

    def compare_redemption_options(self, program: str, points: int, cash_price: float) -> dict:
        val = self.valuations.get(program)
        if not val:
            return {"error": "Unknown program"}

        points_value = points * val["cpp_inr"]
        cpp_achieved = cash_price / points if points > 0 else 0

        return {
            "program": program,
            "points_required": points,
            "cash_price_inr": cash_price,
            "points_value_inr": points_value,
            "cpp_achieved": round(cpp_achieved, 2),
            "cpp_benchmark": val["cpp_inr"],
            "is_good_value": cpp_achieved >= val["cpp_inr"],
            "savings_inr": cash_price - points_value if cpp_achieved >= val["cpp_inr"] else 0,
            "recommendation": "Good redemption" if cpp_achieved >= val["cpp_inr"] else "Below average value — consider saving points",
        }


points_valuator = PointsValuator()
