from fastapi import APIRouter
from pydantic import BaseModel

from app.engine.trip_planner import trip_planner
from app.engine.award_search import award_search

router = APIRouter(prefix="/api/trips", tags=["trips"])


class TripRequest(BaseModel):
    origin: str = "DEL"
    destination: str = "SIN"
    nights: int = 5
    travelers: int = 1
    cabin_preference: str = "business"
    user_balances: dict[str, int] | None = None


class FlightSearchRequest(BaseModel):
    origin: str
    destination: str
    cabin: str = "business"
    travelers: int = 1


@router.post("/plan")
def plan_trip(req: TripRequest):
    return trip_planner.plan_trip(
        origin=req.origin,
        destination=req.destination,
        nights=req.nights,
        travelers=req.travelers,
        user_balances=req.user_balances,
    )


@router.post("/search-flights")
def search_flights(req: FlightSearchRequest):
    results = award_search.search_flights(req.origin, req.destination, req.cabin, req.travelers)
    return {
        "route": f"{req.origin} → {req.destination}",
        "cabin": req.cabin,
        "travelers": req.travelers,
        "results": [
            {
                "airline": r.airline,
                "program": r.program,
                "points": r.points_required,
                "taxes": r.taxes_inr,
                "cash_price": r.cash_price_inr,
                "cpp": r.cpp_value,
                "availability": r.availability,
                "stops": r.stops,
            }
            for r in results
        ],
    }


@router.post("/search-hotels")
def search_hotels(city: str = "Singapore", nights: int = 5):
    results = award_search.search_hotels(city, nights)
    return {
        "city": city,
        "nights": nights,
        "results": [
            {
                "hotel": r.hotel_name,
                "program": r.program,
                "points_per_night": r.points_per_night,
                "total_points": r.total_points,
                "cash_rate": r.cash_rate_inr,
                "total_cash": r.total_cash,
                "cpp": r.cpp_value,
                "fifth_night_free": r.fifth_night_free,
            }
            for r in results
        ],
    }
