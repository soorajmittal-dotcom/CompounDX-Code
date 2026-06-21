from fastapi import APIRouter
from pydantic import BaseModel

from app.engine.transfer_graph import transfer_graph
from app.engine.spend_optimizer import spend_optimizer
from app.engine.hotel_optimizer import hotel_optimizer

router = APIRouter(prefix="/api/optimizer", tags=["optimizer"])


class TransferPathRequest(BaseModel):
    source: str
    target: str
    points: int = 100000


class SpendRequest(BaseModel):
    monthly_spend: dict[str, float]
    user_cards: list[int] | None = None


class HotelCompareRequest(BaseModel):
    city: str = "Singapore"
    nights: int = 5
    budget_inr: int | None = None


@router.post("/transfer-path")
def find_transfer_path(req: TransferPathRequest):
    paths = transfer_graph.find_all_paths(req.source, req.target)
    best = transfer_graph.find_best_path(req.source, req.target, req.points)

    return {
        "source": req.source,
        "target": req.target,
        "source_points": req.points,
        "best_path": {
            "route": best.route if best else [],
            "effective_ratio": best.effective_ratio if best else 0,
            "points_delivered": best.points_delivered if best else 0,
            "time_days": best.transfer_time_days if best else 0,
            "steps": best.steps if best else [],
        } if best else None,
        "all_paths": [
            {
                "route": p.route,
                "effective_ratio": p.effective_ratio,
                "time_days": p.transfer_time_days,
                "steps": p.steps,
            }
            for p in paths[:5]
        ],
    }


@router.get("/transfer-graph")
def get_transfer_graph():
    return transfer_graph.get_graph_data()


@router.get("/reachable/{program}")
def get_reachable(program: str):
    return transfer_graph.get_reachable_programs(program)


@router.post("/spend")
def optimize_spend(req: SpendRequest):
    return spend_optimizer.optimize_spend(req.monthly_spend, req.user_cards)


@router.post("/hotels")
def compare_hotels(req: HotelCompareRequest):
    return hotel_optimizer.compare_options(req.city, req.nights, req.budget_inr)
