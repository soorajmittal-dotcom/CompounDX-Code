from fastapi import APIRouter
from pydantic import BaseModel

from app.engine.points_valuator import points_valuator
from app.engine.transfer_graph import transfer_graph
from app.engine.spend_optimizer import spend_optimizer
from app.engine.trip_planner import trip_planner
from app.engine.benefits_engine import benefits_engine

router = APIRouter(prefix="/api/advisor", tags=["advisor"])


class AdvisorQuery(BaseModel):
    query: str
    context: dict | None = None


DEMO_BALANCES = {
    "HDFC Reward Points": 350000,
    "Amex Membership Rewards": 120000,
    "Axis EDGE Miles": 80000,
    "KrisFlyer": 45000,
    "Marriott Bonvoy": 120000,
}


def classify_intent(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ["transfer", "convert", "move points"]):
        return "transfer"
    if any(w in q for w in ["trip", "plan", "fly", "travel", "visit", "japan", "europe", "london", "singapore", "korea"]):
        return "trip"
    if any(w in q for w in ["card", "spend", "which card", "best card", "use for"]):
        return "spend"
    if any(w in q for w in ["benefit", "lounge", "golf", "insurance", "unused"]):
        return "benefits"
    if any(w in q for w in ["value", "worth", "how much", "maximize", "portfolio"]):
        return "valuation"
    if any(w in q for w in ["renew", "cancel", "annual fee", "keep", "downgrade"]):
        return "fee_analysis"
    return "general"


def handle_transfer_query(query: str) -> dict:
    q = query.lower()
    source = None
    target = None

    program_keywords = {
        "hdfc": "HDFC Reward Points",
        "infinia": "HDFC Reward Points",
        "amex": "Amex Membership Rewards",
        "axis": "Axis EDGE Miles",
        "krisflyer": "KrisFlyer",
        "singapore": "KrisFlyer",
        "marriott": "Marriott Bonvoy",
        "bonvoy": "Marriott Bonvoy",
        "avios": "British Airways Avios",
        "british airways": "British Airways Avios",
        "flying blue": "Flying Blue",
        "emirates": "Emirates Skywards",
        "hyatt": "World of Hyatt",
    }

    for keyword, program in program_keywords.items():
        if keyword in q:
            if not source:
                source = program
            elif program != source:
                target = program
                break

    if source and target:
        result = transfer_graph.calculate_transfer_value(source, target, 100000, 1.5)
        return {
            "type": "transfer_analysis",
            "message": f"Transfer path from {source} to {target}:",
            "data": result,
            "recommendation": f"You can transfer 100,000 {source} and receive approximately {result.get('delivered_points', 0):,} {target}." if result.get("possible") else f"No direct or indirect path found from {source} to {target}.",
        }

    if source:
        reachable = transfer_graph.get_reachable_programs(source)
        return {
            "type": "reachable_programs",
            "message": f"Programs reachable from {source}:",
            "data": reachable[:10],
            "recommendation": f"You can transfer {source} to {len(reachable)} different programs. Best ratios available for airline and hotel partners.",
        }

    return {
        "type": "general",
        "message": "I can help with transfer recommendations. Please specify which programs you'd like to transfer between (e.g., 'transfer HDFC to KrisFlyer').",
    }


def handle_trip_query(query: str) -> dict:
    q = query.lower()
    destinations = {
        "japan": ("DEL", "NRT", 7),
        "tokyo": ("DEL", "NRT", 7),
        "singapore": ("DEL", "SIN", 5),
        "london": ("DEL", "LHR", 7),
        "europe": ("DEL", "LHR", 10),
        "dubai": ("DEL", "DXB", 4),
        "bangkok": ("DEL", "BKK", 5),
        "korea": ("DEL", "ICN", 7),
        "seoul": ("DEL", "ICN", 7),
        "new york": ("DEL", "JFK", 7),
        "usa": ("DEL", "JFK", 10),
    }

    origin = "DEL"
    destination = "SIN"
    nights = 5

    for key, (orig, dest, n) in destinations.items():
        if key in q:
            origin, destination, nights = orig, dest, n
            break

    result = trip_planner.plan_trip(origin, destination, nights, 1, DEMO_BALANCES)

    options_summary = []
    for opt in result["options"]:
        options_summary.append({
            "name": opt["name"],
            "total_points": opt["total_points"],
            "cash_outflow": opt["total_cash_inr"],
            "savings": opt["savings_inr"],
        })

    return {
        "type": "trip_plan",
        "message": f"Here's your optimized trip plan for {origin} → {destination} ({nights} nights):",
        "data": result,
        "summary": options_summary,
        "recommendation": f"For maximum savings, use the '{result['options'][2]['name']}' option saving ₹{result['options'][2]['savings_inr']:,} vs cash booking.",
    }


def handle_spend_query(query: str) -> dict:
    demo_spend = {
        "travel": 50000,
        "dining": 30000,
        "groceries": 25000,
        "fuel": 10000,
        "utilities": 15000,
        "online": 20000,
        "international": 15000,
    }

    result = spend_optimizer.optimize_spend(demo_spend, [1, 2, 4, 6, 7])
    top_recs = result["recommendations"][:5]

    return {
        "type": "spend_optimization",
        "message": "Here's your optimized card usage strategy:",
        "data": result,
        "recommendation": f"By using the right card for each category, you can earn ₹{result['total_annual_value_inr']:,.0f} annually in rewards (net of ₹{result['total_annual_fees']:,} in fees = ₹{result['net_annual_value']:,.0f} net value).",
        "top_recommendations": [{"category": r["category"], "card": r["recommended_card"], "annual_value": r["annual_value_inr"]} for r in top_recs],
    }


def handle_benefits_query(query: str) -> dict:
    result = benefits_engine.get_all_benefits([1, 2, 4, 6, 7])
    unused = benefits_engine.get_unused_benefits_estimate([1, 2, 4, 6, 7])

    return {
        "type": "benefits_analysis",
        "message": "Here's your card benefits analysis:",
        "data": {
            "total_value": result["total_annual_value"],
            "total_fees": result["total_annual_fees"],
            "roi": result["roi_percentage"],
            "unused_value": unused["total_unused_value"],
        },
        "recommendation": f"Your cards provide ₹{result['total_annual_value']:,} in annual benefits against ₹{result['total_annual_fees']:,} in fees ({result['roi_percentage']}% ROI). You may be missing ₹{unused['total_unused_value']:,} in underutilized benefits.",
        "unused_benefits": unused["potentially_unused"],
    }


def handle_valuation_query(query: str) -> dict:
    result = points_valuator.calculate_portfolio_value(DEMO_BALANCES)
    return {
        "type": "portfolio_valuation",
        "message": "Your points portfolio valuation:",
        "data": result,
        "recommendation": f"Your total portfolio is worth approximately {result['total_value_formatted']}. The highest-value currencies are airline miles — consider transferring bank points to airline programs for maximum value.",
    }


def handle_fee_query(query: str) -> dict:
    cards_analysis = []
    for card_id in [1, 2, 4, 6, 7]:
        analysis = benefits_engine.annual_fee_justification(card_id)
        cards_analysis.append(analysis)

    return {
        "type": "fee_analysis",
        "message": "Annual fee analysis for your cards:",
        "data": cards_analysis,
        "recommendation": "All your current cards provide positive ROI. Keep them as long as you're utilizing the key benefits (lounges, transfers, milestone rewards).",
    }


@router.post("/query")
def advisor_query(req: AdvisorQuery):
    intent = classify_intent(req.query)

    handlers = {
        "transfer": handle_transfer_query,
        "trip": handle_trip_query,
        "spend": handle_spend_query,
        "benefits": handle_benefits_query,
        "valuation": handle_valuation_query,
        "fee_analysis": handle_fee_query,
    }

    handler = handlers.get(intent)
    if handler:
        result = handler(req.query)
    else:
        result = {
            "type": "general",
            "message": "I can help you with:\n• Transfer recommendations between loyalty programs\n• Trip planning and optimization\n• Card spend optimization\n• Benefits analysis\n• Portfolio valuation\n• Annual fee analysis\n\nTry asking something like 'Plan a trip to Japan' or 'Should I transfer HDFC points to KrisFlyer?'",
        }

    return {
        "query": req.query,
        "intent": intent,
        "response": result,
        "suggestions": [
            "Plan a trip to Singapore in Business class",
            "Which card should I use for dining?",
            "Transfer HDFC to KrisFlyer or Marriott?",
            "How much are my points worth?",
            "Am I using all my card benefits?",
            "Should I renew my HDFC Infinia?",
        ],
    }
