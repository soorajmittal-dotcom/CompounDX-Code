import json
from pathlib import Path


class HotelOptimizer:
    def __init__(self):
        data_dir = Path(__file__).parent.parent / "data"
        with open(data_dir / "hotel_programs.json") as f:
            self.programs = json.load(f)

    def compare_options(self, city: str, nights: int, budget_inr: int | None = None) -> dict:
        options = []

        for program in self.programs:
            categories = program.get("categories", {})
            for cat_name, cat_data in categories.items():
                ppn = cat_data["points_per_night"]
                cash_rate = cat_data["avg_cash_rate"]

                fifth_night_free = False
                effective_nights_points = nights
                if nights >= 5 and program["name"] in ["Marriott Bonvoy", "Hilton Honors"]:
                    fifth_night_free = True
                    effective_nights_points = nights - (nights // 5)
                elif nights >= 4 and program["name"] == "IHG One Rewards":
                    fifth_night_free = True
                    effective_nights_points = nights - (nights // 4)

                total_points = ppn * effective_nights_points
                total_cash = cash_rate * nights
                cpp = total_cash / total_points if total_points > 0 else 0

                if budget_inr and total_cash > budget_inr:
                    continue

                options.append({
                    "program": program["name"],
                    "category": cat_name,
                    "points_per_night": ppn,
                    "cash_rate_per_night": cash_rate,
                    "nights": nights,
                    "total_points": total_points,
                    "total_cash": total_cash,
                    "cpp_value": round(cpp, 2),
                    "fifth_night_free": fifth_night_free,
                    "nights_free": nights - effective_nights_points,
                    "savings_from_free_nights": cash_rate * (nights - effective_nights_points),
                    "elite_benefits": program.get("benefits_by_tier", {}),
                    "sweet_spots": program.get("sweet_spots", []),
                })

        options.sort(key=lambda x: x["cpp_value"], reverse=True)

        best_value = options[0] if options else None
        cheapest_points = min(options, key=lambda x: x["total_points"]) if options else None

        return {
            "city": city,
            "nights": nights,
            "options": options[:20],
            "recommendations": {
                "best_value": best_value,
                "cheapest_points": cheapest_points,
                "with_free_nights": [o for o in options if o["fifth_night_free"]][:5],
            },
        }

    def elite_benefit_value(self, program_name: str, tier: str, nights_per_year: int) -> dict:
        program = next((p for p in self.programs if p["name"] == program_name), None)
        if not program:
            return {"error": "Program not found"}

        benefits = program.get("benefits_by_tier", {}).get(tier, [])
        estimated_value = 0

        benefit_values = {
            "Room upgrade": 2000 * nights_per_year,
            "Suite upgrade": 5000 * nights_per_year,
            "Breakfast": 1500 * nights_per_year,
            "Late checkout": 500 * nights_per_year,
            "Lounge access": 2000 * nights_per_year,
            "Free parking": 500 * nights_per_year,
        }

        valued_benefits = []
        for benefit in benefits:
            value = 0
            for key, val in benefit_values.items():
                if key.lower() in benefit.lower():
                    value = val
                    break
            valued_benefits.append({"benefit": benefit, "estimated_annual_value": value})
            estimated_value += value

        return {
            "program": program_name,
            "tier": tier,
            "nights_per_year": nights_per_year,
            "benefits": valued_benefits,
            "total_annual_value": estimated_value,
        }


hotel_optimizer = HotelOptimizer()
