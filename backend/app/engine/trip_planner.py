from dataclasses import dataclass, asdict

from app.engine.award_search import award_search, FlightAward, HotelAward
from app.engine.points_valuator import points_valuator
from app.engine.transfer_graph import transfer_graph


@dataclass
class TripOption:
    name: str
    description: str
    flights: list[dict]
    hotels: list[dict]
    total_points: int
    total_cash_inr: int
    total_value_if_cash: int
    savings_inr: int
    points_programs_used: list[str]


class TripPlanner:
    def plan_trip(
        self,
        origin: str,
        destination: str,
        nights: int = 5,
        travelers: int = 1,
        user_balances: dict | None = None,
    ) -> dict:
        if user_balances is None:
            user_balances = {}

        flight_results = {
            "economy": award_search.search_flights(origin, destination, "economy", travelers),
            "premium_economy": award_search.search_flights(origin, destination, "premium_economy", travelers),
            "business": award_search.search_flights(origin, destination, "business", travelers),
            "first": award_search.search_flights(origin, destination, "first", travelers),
        }

        hotel_results = award_search.search_hotels(destination, nights, travelers)

        luxury = self._build_luxury_option(flight_results, hotel_results, travelers)
        balanced = self._build_balanced_option(flight_results, hotel_results, travelers)
        budget = self._build_budget_option(flight_results, hotel_results, travelers)

        return {
            "origin": origin,
            "destination": destination,
            "nights": nights,
            "travelers": travelers,
            "options": [
                asdict(luxury),
                asdict(balanced),
                asdict(budget),
            ],
            "transfer_suggestions": self._get_transfer_suggestions(user_balances, budget),
        }

    def _build_luxury_option(self, flights: dict, hotels: list[HotelAward], travelers: int) -> TripOption:
        best_first = flights.get("first", [])
        best_biz = flights.get("business", [])
        flight_pick = (best_first[0] if best_first else best_biz[0]) if (best_first or best_biz) else None

        luxury_hotels = [h for h in hotels if h.cpp_value >= 1.0]
        hotel_pick = luxury_hotels[0] if luxury_hotels else (hotels[0] if hotels else None)

        flight_data = []
        total_points = 0
        total_cash = 0
        cash_equivalent = 0

        if flight_pick:
            flight_data.append({
                "airline": flight_pick.airline,
                "program": flight_pick.program,
                "cabin": flight_pick.cabin,
                "points": flight_pick.points_required,
                "taxes": flight_pick.taxes_inr,
                "cash_price": flight_pick.cash_price_inr,
                "cpp": flight_pick.cpp_value,
            })
            total_points += flight_pick.points_required
            total_cash += flight_pick.taxes_inr
            cash_equivalent += flight_pick.cash_price_inr

        hotel_data = []
        if hotel_pick:
            hotel_data.append({
                "hotel": hotel_pick.hotel_name,
                "program": hotel_pick.program,
                "nights": hotel_pick.nights,
                "points": hotel_pick.total_points,
                "cash_rate": hotel_pick.cash_rate_inr,
                "total_cash_price": hotel_pick.total_cash,
                "cpp": hotel_pick.cpp_value,
                "fifth_night_free": hotel_pick.fifth_night_free,
            })
            total_points += hotel_pick.total_points
            cash_equivalent += hotel_pick.total_cash

        return TripOption(
            name="Maximum Luxury",
            description="First/Business class flights + premium hotel stays on points",
            flights=flight_data,
            hotels=hotel_data,
            total_points=total_points,
            total_cash_inr=total_cash,
            total_value_if_cash=cash_equivalent,
            savings_inr=cash_equivalent - total_cash,
            points_programs_used=list({f.get("program", "") for f in flight_data} | {h.get("program", "") for h in hotel_data}),
        )

    def _build_balanced_option(self, flights: dict, hotels: list[HotelAward], travelers: int) -> TripOption:
        biz_flights = flights.get("business", [])
        pe_flights = flights.get("premium_economy", [])
        flight_pick = None
        for f in (biz_flights + pe_flights):
            if f.cpp_value >= 1.0:
                flight_pick = f
                break
        if not flight_pick and biz_flights:
            flight_pick = biz_flights[0]

        mid_hotels = [h for h in hotels if 0.5 <= h.cpp_value <= 1.5]
        hotel_pick = mid_hotels[0] if mid_hotels else (hotels[len(hotels) // 2] if hotels else None)

        flight_data = []
        total_points = 0
        total_cash = 0
        cash_equivalent = 0

        if flight_pick:
            flight_data.append({
                "airline": flight_pick.airline,
                "program": flight_pick.program,
                "cabin": flight_pick.cabin,
                "points": flight_pick.points_required,
                "taxes": flight_pick.taxes_inr,
                "cash_price": flight_pick.cash_price_inr,
                "cpp": flight_pick.cpp_value,
            })
            total_points += flight_pick.points_required
            total_cash += flight_pick.taxes_inr
            cash_equivalent += flight_pick.cash_price_inr

        hotel_data = []
        if hotel_pick:
            hotel_data.append({
                "hotel": hotel_pick.hotel_name,
                "program": hotel_pick.program,
                "nights": hotel_pick.nights,
                "points": hotel_pick.total_points,
                "cash_rate": hotel_pick.cash_rate_inr,
                "total_cash_price": hotel_pick.total_cash,
                "cpp": hotel_pick.cpp_value,
                "fifth_night_free": hotel_pick.fifth_night_free,
            })
            total_points += hotel_pick.total_points
            cash_equivalent += hotel_pick.total_cash

        return TripOption(
            name="Balanced Value",
            description="Best value redemptions — mix of comfort and smart points usage",
            flights=flight_data,
            hotels=hotel_data,
            total_points=total_points,
            total_cash_inr=total_cash,
            total_value_if_cash=cash_equivalent,
            savings_inr=cash_equivalent - total_cash,
            points_programs_used=list({f.get("program", "") for f in flight_data} | {h.get("program", "") for h in hotel_data}),
        )

    def _build_budget_option(self, flights: dict, hotels: list[HotelAward], travelers: int) -> TripOption:
        eco_flights = flights.get("economy", [])
        flight_pick = eco_flights[0] if eco_flights else None

        budget_hotels = sorted(hotels, key=lambda h: h.total_points)
        hotel_pick = budget_hotels[0] if budget_hotels else None

        flight_data = []
        total_points = 0
        total_cash = 0
        cash_equivalent = 0

        if flight_pick:
            flight_data.append({
                "airline": flight_pick.airline,
                "program": flight_pick.program,
                "cabin": flight_pick.cabin,
                "points": flight_pick.points_required,
                "taxes": flight_pick.taxes_inr,
                "cash_price": flight_pick.cash_price_inr,
                "cpp": flight_pick.cpp_value,
            })
            total_points += flight_pick.points_required
            total_cash += flight_pick.taxes_inr
            cash_equivalent += flight_pick.cash_price_inr

        hotel_data = []
        if hotel_pick:
            hotel_data.append({
                "hotel": hotel_pick.hotel_name,
                "program": hotel_pick.program,
                "nights": hotel_pick.nights,
                "points": hotel_pick.total_points,
                "cash_rate": hotel_pick.cash_rate_inr,
                "total_cash_price": hotel_pick.total_cash,
                "cpp": hotel_pick.cpp_value,
                "fifth_night_free": hotel_pick.fifth_night_free,
            })
            total_points += hotel_pick.total_points
            cash_equivalent += hotel_pick.total_cash

        return TripOption(
            name="Minimum Cash",
            description="Maximize point redemptions, minimize out-of-pocket spending",
            flights=flight_data,
            hotels=hotel_data,
            total_points=total_points,
            total_cash_inr=total_cash,
            total_value_if_cash=cash_equivalent,
            savings_inr=cash_equivalent - total_cash,
            points_programs_used=list({f.get("program", "") for f in flight_data} | {h.get("program", "") for h in hotel_data}),
        )

    def _get_transfer_suggestions(self, user_balances: dict, budget_option: TripOption) -> list[dict]:
        suggestions = []
        programs_needed = budget_option.points_programs_used

        for program in programs_needed:
            currency_name = program
            for source, balance in user_balances.items():
                if source == currency_name:
                    continue
                path = transfer_graph.find_best_path(source, currency_name, balance)
                if path:
                    suggestions.append({
                        "from": source,
                        "to": currency_name,
                        "source_points": balance,
                        "delivered_points": path.points_delivered,
                        "ratio": path.effective_ratio,
                        "time_days": path.transfer_time_days,
                    })

        return suggestions


trip_planner = TripPlanner()
