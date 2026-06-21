from fastapi import APIRouter
from pydantic import BaseModel

from app.engine.opportunity_scanner import opportunity_scanner, expiry_tracker, card_renewal_analyzer
from app.engine.goal_planner import goal_planner

router = APIRouter(prefix="/api/scanner", tags=["scanner"])

DEMO_BALANCES = {
    "HDFC Reward Points": 350000,
    "Amex Membership Rewards": 120000,
    "Axis EDGE Miles": 80000,
    "KrisFlyer": 45000,
    "Marriott Bonvoy": 120000,
    "British Airways Avios": 35000,
}
DEMO_CARDS = [1, 2, 4, 6, 7]


class GoalRequest(BaseModel):
    destination: str = "Singapore"
    target_date: str = "2027-03-15"
    cabin: str = "business"
    travelers: int = 1
    current_balances: dict | None = None
    monthly_spend: dict | None = None
    user_cards: list[int] | None = None


class RenewalRequest(BaseModel):
    card_id: int
    annual_spend: float = 600000


@router.get("/opportunities")
def scan_opportunities():
    return opportunity_scanner.scan_opportunities(DEMO_BALANCES, DEMO_CARDS)


@router.get("/expiry")
def check_expiry():
    return {
        "alerts": expiry_tracker.check_expiring_points(DEMO_BALANCES),
        "total_at_risk": sum(
            item["balance"] for item in expiry_tracker.check_expiring_points(DEMO_BALANCES)
            if item["risk"] in ["high", "medium"]
        ),
    }


@router.post("/renewal")
def analyze_renewal(req: RenewalRequest):
    return card_renewal_analyzer.analyze_renewal(req.card_id, req.annual_spend)


@router.get("/renewal/all")
def analyze_all_renewals():
    return card_renewal_analyzer.analyze_all_cards(DEMO_CARDS)


@router.post("/goal")
def create_goal_roadmap(req: GoalRequest):
    return goal_planner.create_roadmap(
        destination=req.destination,
        target_date=req.target_date,
        cabin=req.cabin,
        travelers=req.travelers,
        current_balances=req.current_balances or DEMO_BALANCES,
        monthly_spend=req.monthly_spend or {
            "travel": 50000,
            "dining": 30000,
            "groceries": 25000,
            "fuel": 10000,
            "utilities": 15000,
            "online": 20000,
        },
        user_cards=req.user_cards or DEMO_CARDS,
    )


@router.get("/sweet-spots")
def get_sweet_spots():
    import json
    from pathlib import Path
    data_dir = Path(__file__).parent.parent / "data" / "knowledge_base"
    with open(data_dir / "sweet_spots.json") as f:
        return json.load(f)


@router.get("/promotions")
def get_promotions():
    import json
    from pathlib import Path
    from datetime import date

    data_dir = Path(__file__).parent.parent / "data" / "knowledge_base"
    with open(data_dir / "promotions.json") as f:
        promos = json.load(f)

    today = date.today().isoformat()
    active_bonuses = [
        b for b in promos.get("transfer_bonuses", [])
        if b.get("end_date", "9999-12-31") >= today and b.get("start_date", "0000-01-01") <= today
    ]
    upcoming_bonuses = [
        b for b in promos.get("transfer_bonuses", [])
        if b.get("start_date", "0000-01-01") > today
    ]

    strategies = []
    for bonus in active_bonuses:
        if bonus.get("bonus_percent", 0) >= 25:
            strategies.append({
                "action": f"Transfer {bonus['from']} to {bonus['to']} now",
                "reason": f"{bonus['bonus_percent']}% bonus active until {bonus['end_date']}",
                "urgency": "high" if bonus.get("end_date", "") <= today[:8] + "30" else "medium",
                "tip": bonus.get("value_tip", ""),
            })

    for offer in promos.get("card_offers", []):
        strategies.append({
            "action": f"Use {offer['card']} for {offer['offer']}",
            "reason": offer.get("value", ""),
            "urgency": "ongoing",
            "tip": offer.get("tip", ""),
        })

    promos["active_transfer_bonuses"] = active_bonuses
    promos["upcoming_transfer_bonuses"] = upcoming_bonuses
    promos["strategies"] = strategies
    promos["last_updated"] = today
    return promos


@router.get("/memberships")
def get_memberships():
    import json
    from pathlib import Path
    data_dir = Path(__file__).parent.parent / "data" / "knowledge_base"
    with open(data_dir / "memberships.json") as f:
        return json.load(f)
