from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/user", tags=["user"])

USER_STORE: dict = {}


class UserProfile(BaseModel):
    name: str = "Default User"
    home_airport: str = "DEL"
    cards: list[int] = [1, 2, 4, 6, 7]
    balances: dict[str, int] = {
        "HDFC Reward Points": 350000,
        "Amex Membership Rewards": 120000,
        "Axis EDGE Miles": 80000,
        "KrisFlyer": 45000,
        "Marriott Bonvoy": 120000,
        "British Airways Avios": 35000,
        "World of Hyatt": 25000,
    }
    elite_statuses: dict[str, str] = {
        "Marriott Bonvoy": "Gold",
        "KrisFlyer": "Silver",
        "Hilton Honors": "Gold",
    }
    memberships: list[str] = ["Priority Pass", "DreamFolks", "Club Marriott"]
    monthly_spend: dict[str, float] = {
        "travel": 50000,
        "dining": 30000,
        "groceries": 25000,
        "fuel": 10000,
        "utilities": 15000,
        "online": 20000,
        "international": 15000,
        "entertainment": 10000,
    }
    card_renewal_dates: dict[str, str] = {
        "HDFC Infinia": "2027-01-15",
        "HDFC Diners Black": "2026-11-20",
        "Axis Atlas": "2027-03-10",
        "Amex Platinum Travel": "2026-09-01",
        "Amex MRCC": "2026-12-15",
    }


class FamilyMember(BaseModel):
    name: str
    relationship: str = "self"
    cards: list[int] = []
    balances: dict[str, int] = {}
    elite_statuses: dict[str, str] = {}


class FamilyPool(BaseModel):
    members: list[FamilyMember] = []


DEFAULT_PROFILE = UserProfile()
DEFAULT_FAMILY = FamilyPool(members=[
    FamilyMember(
        name="Self",
        relationship="self",
        cards=[1, 2, 4, 6, 7],
        balances={"HDFC Reward Points": 350000, "Amex Membership Rewards": 120000, "Axis EDGE Miles": 80000, "KrisFlyer": 45000},
        elite_statuses={"Marriott Bonvoy": "Gold", "KrisFlyer": "Silver"},
    ),
    FamilyMember(
        name="Spouse",
        relationship="spouse",
        cards=[3, 8],
        balances={"ICICI Reward Points": 85000, "SBI Reward Points": 45000, "Marriott Bonvoy": 60000},
        elite_statuses={"Marriott Bonvoy": "Silver"},
    ),
    FamilyMember(
        name="Parent",
        relationship="parent",
        cards=[9],
        balances={"ICICI Reward Points": 40000, "Air India": 25000},
        elite_statuses={},
    ),
])


@router.get("/profile")
def get_profile():
    return DEFAULT_PROFILE.model_dump()


@router.post("/profile")
def update_profile(profile: UserProfile):
    global DEFAULT_PROFILE
    DEFAULT_PROFILE = profile
    return {"status": "updated", "profile": profile.model_dump()}


@router.get("/family")
def get_family():
    pool = DEFAULT_FAMILY
    combined_balances: dict[str, int] = {}
    combined_cards: list[int] = []
    all_statuses: dict[str, dict[str, str]] = {}

    for member in pool.members:
        combined_cards.extend(member.cards)
        for program, balance in member.balances.items():
            combined_balances[program] = combined_balances.get(program, 0) + balance
        for program, status in member.elite_statuses.items():
            if program not in all_statuses:
                all_statuses[program] = {}
            all_statuses[program][member.name] = status

    return {
        "members": [m.model_dump() for m in pool.members],
        "combined_balances": combined_balances,
        "combined_cards": list(set(combined_cards)),
        "all_statuses": all_statuses,
        "total_members": len(pool.members),
    }


@router.post("/family/member")
def add_family_member(member: FamilyMember):
    DEFAULT_FAMILY.members.append(member)
    return {"status": "added", "total_members": len(DEFAULT_FAMILY.members)}


@router.get("/family/valuation")
def family_valuation():
    from app.engine.points_valuator import points_valuator

    family_data = []
    total_family_value = 0

    for member in DEFAULT_FAMILY.members:
        val = points_valuator.calculate_portfolio_value(member.balances)
        family_data.append({
            "name": member.name,
            "relationship": member.relationship,
            "value": val["total_value_inr"],
            "programs": len(member.balances),
            "cards": len(member.cards),
        })
        total_family_value += val["total_value_inr"]

    return {
        "members": family_data,
        "total_family_value": total_family_value,
        "total_family_value_formatted": f"₹{total_family_value:,.0f}",
    }
