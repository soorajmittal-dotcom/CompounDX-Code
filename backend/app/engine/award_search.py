import random
from dataclasses import dataclass


@dataclass
class FlightAward:
    airline: str
    program: str
    route: str
    cabin: str
    points_required: int
    taxes_inr: int
    cash_price_inr: int
    cpp_value: float
    availability: str
    stops: int


@dataclass
class HotelAward:
    hotel_name: str
    program: str
    city: str
    category: int
    points_per_night: int
    cash_rate_inr: int
    nights: int
    total_points: int
    total_cash: int
    cpp_value: float
    fifth_night_free: bool


MOCK_ROUTES = {
    ("DEL", "SIN"): {
        "distance": "short_haul",
        "region": "India-SEA",
        "cash_prices": {"economy": 25000, "premium_economy": 45000, "business": 150000, "first": 350000},
    },
    ("DEL", "NRT"): {
        "distance": "medium_haul",
        "region": "India-East_Asia",
        "cash_prices": {"economy": 45000, "premium_economy": 80000, "business": 230000, "first": 500000},
    },
    ("DEL", "LHR"): {
        "distance": "long_haul",
        "region": "India-Europe",
        "cash_prices": {"economy": 55000, "premium_economy": 95000, "business": 280000, "first": 600000},
    },
    ("DEL", "JFK"): {
        "distance": "ultra_long",
        "region": "India-North_America",
        "cash_prices": {"economy": 70000, "premium_economy": 130000, "business": 350000, "first": 750000},
    },
    ("DEL", "DXB"): {
        "distance": "short_haul",
        "region": "India-Middle_East",
        "cash_prices": {"economy": 18000, "premium_economy": 35000, "business": 90000, "first": 200000},
    },
    ("BOM", "SIN"): {
        "distance": "short_haul",
        "region": "India-SEA",
        "cash_prices": {"economy": 22000, "premium_economy": 42000, "business": 140000, "first": 320000},
    },
    ("BOM", "LHR"): {
        "distance": "long_haul",
        "region": "India-Europe",
        "cash_prices": {"economy": 50000, "premium_economy": 90000, "business": 260000, "first": 580000},
    },
    ("BLR", "SIN"): {
        "distance": "short_haul",
        "region": "India-SEA",
        "cash_prices": {"economy": 20000, "premium_economy": 38000, "business": 120000, "first": 300000},
    },
    ("DEL", "ICN"): {
        "distance": "medium_haul",
        "region": "India-East_Asia",
        "cash_prices": {"economy": 40000, "premium_economy": 75000, "business": 200000, "first": 450000},
    },
    ("DEL", "BKK"): {
        "distance": "short_haul",
        "region": "India-SEA",
        "cash_prices": {"economy": 20000, "premium_economy": 40000, "business": 120000, "first": 280000},
    },
}

AWARD_AVAILABILITY = {
    "India-SEA": [
        {"program": "KrisFlyer", "airline": "Singapore Airlines", "economy": 30000, "premium_economy": 50000, "business": 62000, "first": 92000, "taxes": 5000, "stops": 0},
        {"program": "Flying Blue", "airline": "KLM via AMS", "economy": 30000, "business": 60000, "taxes": 8000, "stops": 1},
        {"program": "British Airways Avios", "airline": "Qatar via DOH", "economy": 25000, "business": 50000, "taxes": 6000, "stops": 1},
        {"program": "Emirates Skywards", "airline": "Emirates via DXB", "economy": 32000, "business": 55000, "first": 82000, "taxes": 4000, "stops": 1},
    ],
    "India-East_Asia": [
        {"program": "KrisFlyer", "airline": "Singapore Airlines", "economy": 45000, "premium_economy": 68000, "business": 88000, "first": 120000, "taxes": 6000, "stops": 1},
        {"program": "Flying Blue", "airline": "Air France/KLM", "economy": 43000, "business": 86000, "taxes": 9000, "stops": 1},
        {"program": "Turkish Miles", "airline": "Turkish via IST", "economy": 30000, "business": 57500, "taxes": 7000, "stops": 1},
        {"program": "Emirates Skywards", "airline": "Emirates via DXB", "economy": 42000, "business": 75000, "first": 105000, "taxes": 5000, "stops": 1},
    ],
    "India-Europe": [
        {"program": "KrisFlyer", "airline": "Singapore Airlines via SIN", "economy": 57000, "premium_economy": 85000, "business": 105000, "first": 148000, "taxes": 8000, "stops": 1},
        {"program": "Flying Blue", "airline": "Air France/KLM Direct", "economy": 43000, "premium_economy": 64000, "business": 86000, "first": 143000, "taxes": 10000, "stops": 0},
        {"program": "British Airways Avios", "airline": "British Airways Direct", "economy": 50000, "business": 100000, "taxes": 45000, "stops": 0},
        {"program": "Turkish Miles", "airline": "Turkish via IST", "economy": 30000, "business": 57500, "taxes": 7000, "stops": 1},
        {"program": "Emirates Skywards", "airline": "Emirates via DXB", "economy": 55000, "business": 102500, "first": 150000, "taxes": 5000, "stops": 1},
    ],
    "India-North_America": [
        {"program": "KrisFlyer", "airline": "Singapore Airlines via SIN/NRT", "economy": 70000, "premium_economy": 105000, "business": 132000, "first": 185000, "taxes": 9000, "stops": 1},
        {"program": "Flying Blue", "airline": "Air France via CDG", "economy": 55000, "business": 107000, "taxes": 12000, "stops": 1},
        {"program": "Emirates Skywards", "airline": "Emirates via DXB", "economy": 62500, "business": 127500, "first": 187500, "taxes": 6000, "stops": 1},
        {"program": "United MileagePlus", "airline": "United/Air India Direct", "economy": 40000, "business": 80000, "taxes": 8000, "stops": 0},
        {"program": "Turkish Miles", "airline": "Turkish via IST", "economy": 45000, "business": 82500, "taxes": 8000, "stops": 1},
    ],
    "India-Middle_East": [
        {"program": "Emirates Skywards", "airline": "Emirates Direct", "economy": 22500, "business": 45000, "first": 67500, "taxes": 3000, "stops": 0},
        {"program": "Etihad Guest Miles", "airline": "Etihad Direct", "economy": 20000, "business": 40750, "first": 62500, "taxes": 3000, "stops": 0},
        {"program": "British Airways Avios", "airline": "Qatar Direct", "economy": 15000, "business": 30000, "taxes": 4000, "stops": 0},
    ],
}


class AwardSearchEngine:
    def search_flights(self, origin: str, destination: str, cabin: str = "business", travelers: int = 1) -> list[FlightAward]:
        route_key = (origin.upper(), destination.upper())
        route_info = MOCK_ROUTES.get(route_key)

        if not route_info:
            for key, info in MOCK_ROUTES.items():
                if key[0] == origin.upper() or key[1] == destination.upper():
                    route_info = info
                    route_key = key
                    break

        if not route_info:
            route_info = MOCK_ROUTES[("DEL", "SIN")]
            route_key = ("DEL", "SIN")

        region = route_info["region"]
        cash_price = route_info["cash_prices"].get(cabin, route_info["cash_prices"]["economy"])
        awards_data = AWARD_AVAILABILITY.get(region, [])

        results = []
        for award in awards_data:
            points = award.get(cabin)
            if not points:
                continue

            taxes = award["taxes"] * travelers
            total_points = points * travelers
            total_cash = cash_price * travelers
            cpp = (total_cash - taxes) / total_points if total_points > 0 else 0

            availability_options = ["Available", "Waitlist", "Limited"]
            avail = random.choices(availability_options, weights=[0.6, 0.2, 0.2])[0]

            results.append(FlightAward(
                airline=award["airline"],
                program=award["program"],
                route=f"{route_key[0]} → {route_key[1]}",
                cabin=cabin,
                points_required=total_points,
                taxes_inr=taxes,
                cash_price_inr=total_cash,
                cpp_value=round(cpp, 2),
                availability=avail,
                stops=award["stops"],
            ))

        results.sort(key=lambda x: x.cpp_value, reverse=True)
        return results

    def search_hotels(self, city: str, nights: int = 3, travelers: int = 1) -> list[HotelAward]:
        import json
        from pathlib import Path

        data_dir = Path(__file__).parent.parent / "data"
        with open(data_dir / "hotel_programs.json") as f:
            programs = json.load(f)

        results = []
        for program in programs:
            categories = program.get("categories", {})
            for cat_name, cat_data in categories.items():
                ppn = cat_data["points_per_night"]
                cash_rate = cat_data["avg_cash_rate"]

                fifth_night_free = nights >= 5 and program["name"] in ["Marriott Bonvoy", "Hilton Honors"]
                effective_nights = nights - 1 if fifth_night_free else nights
                if program["name"] == "IHG One Rewards" and nights >= 4:
                    effective_nights = nights - 1

                total_points = ppn * effective_nights
                total_cash = cash_rate * nights
                cpp = total_cash / total_points if total_points > 0 else 0

                results.append(HotelAward(
                    hotel_name=f"{program['name']} Cat {cat_name}",
                    program=program["name"],
                    city=city,
                    category=cat_name if isinstance(cat_name, int) else 0,
                    points_per_night=ppn,
                    cash_rate_inr=cash_rate,
                    nights=nights,
                    total_points=total_points,
                    total_cash=total_cash,
                    cpp_value=round(cpp, 2),
                    fifth_night_free=fifth_night_free,
                ))

        results.sort(key=lambda x: x.cpp_value, reverse=True)
        return results[:15]


award_search = AwardSearchEngine()
