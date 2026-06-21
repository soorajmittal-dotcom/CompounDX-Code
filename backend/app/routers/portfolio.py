from fastapi import APIRouter
from pydantic import BaseModel

from app.engine.points_valuator import points_valuator
from app.engine.benefits_engine import benefits_engine

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


class PortfolioInput(BaseModel):
    balances: dict[str, int] = {}
    cards: list[int] = []
    elite_statuses: dict[str, str] = {}
    home_airport: str = "DEL"


DEMO_PORTFOLIO = PortfolioInput(
    balances={
        "HDFC Reward Points": 350000,
        "Amex Membership Rewards": 120000,
        "Axis EDGE Miles": 80000,
        "KrisFlyer": 45000,
        "Marriott Bonvoy": 120000,
        "British Airways Avios": 35000,
        "World of Hyatt": 25000,
    },
    cards=[1, 2, 4, 6, 7],
    elite_statuses={
        "Marriott Bonvoy": "Gold",
        "KrisFlyer": "Silver",
        "Hilton Honors": "Gold",
    },
    home_airport="DEL",
)


@router.get("/summary")
def get_portfolio_summary():
    valuation = points_valuator.calculate_portfolio_value(DEMO_PORTFOLIO.balances)
    benefits = benefits_engine.get_all_benefits(DEMO_PORTFOLIO.cards)

    return {
        "valuation": valuation,
        "cards_held": DEMO_PORTFOLIO.cards,
        "elite_statuses": DEMO_PORTFOLIO.elite_statuses,
        "home_airport": DEMO_PORTFOLIO.home_airport,
        "benefits_summary": {
            "total_value": benefits["total_annual_value"],
            "total_fees": benefits["total_annual_fees"],
            "roi": benefits["roi_percentage"],
        },
    }


@router.post("/valuation")
def calculate_valuation(portfolio: PortfolioInput):
    return points_valuator.calculate_portfolio_value(portfolio.balances)


@router.get("/benefits")
def get_benefits():
    return benefits_engine.get_all_benefits(DEMO_PORTFOLIO.cards)


@router.get("/unused-benefits")
def get_unused_benefits():
    return benefits_engine.get_unused_benefits_estimate(DEMO_PORTFOLIO.cards)


@router.get("/fee-justification/{card_id}")
def fee_justification(card_id: int):
    return benefits_engine.annual_fee_justification(card_id)
