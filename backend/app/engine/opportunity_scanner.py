import json
from pathlib import Path
from datetime import datetime, timedelta


class OpportunityScanner:
    def __init__(self):
        data_dir = Path(__file__).parent.parent / "data" / "knowledge_base"
        with open(data_dir / "promotions.json") as f:
            self.promotions = json.load(f)
        with open(data_dir / "sweet_spots.json") as f:
            self.sweet_spots = json.load(f)

    def scan_opportunities(self, user_balances: dict, user_cards: list[int]) -> dict:
        active_bonuses = self._get_active_transfer_bonuses()
        card_offers = self._get_card_offers(user_cards)
        sweet_spot_matches = self._match_sweet_spots(user_balances)
        point_purchase_deals = self._get_point_purchase_deals()

        total_potential_value = sum(o.get("potential_value_inr", 0) for o in sweet_spot_matches)

        return {
            "transfer_bonuses": active_bonuses,
            "card_offers": card_offers,
            "sweet_spot_matches": sweet_spot_matches,
            "point_purchase_deals": point_purchase_deals,
            "total_opportunities": len(active_bonuses) + len(card_offers) + len(sweet_spot_matches),
            "total_potential_value": total_potential_value,
            "last_scanned": datetime.now().isoformat(),
        }

    def _get_active_transfer_bonuses(self) -> list[dict]:
        today = datetime.now().date()
        active = []
        for bonus in self.promotions.get("transfer_bonuses", []):
            end_date = datetime.strptime(bonus["end_date"], "%Y-%m-%d").date()
            if end_date >= today:
                days_left = (end_date - today).days
                active.append({
                    **bonus,
                    "days_remaining": days_left,
                    "urgency": "high" if days_left <= 7 else "medium" if days_left <= 30 else "low",
                })
        return active

    def _get_card_offers(self, user_cards: list[int]) -> list[dict]:
        card_names = self._get_card_names(user_cards)
        offers = []
        for offer in self.promotions.get("card_offers", []):
            if offer["card"] in card_names:
                offers.append({
                    **offer,
                    "applicable": True,
                })
        return offers

    def _match_sweet_spots(self, user_balances: dict) -> list[dict]:
        matches = []
        program_map = {
            "KrisFlyer": "KrisFlyer",
            "British Airways Avios": "British Airways Avios",
            "Flying Blue": "Flying Blue",
            "Turkish Miles&Smiles": "Turkish Miles&Smiles",
            "Emirates Skywards": "Emirates Skywards",
            "United MileagePlus": "United MileagePlus",
        }

        for spot in self.sweet_spots.get("flights", []):
            program = spot["program"]
            points_needed = spot["points"]
            cash_value = spot["typical_cash_inr"]

            can_afford = False
            source_info = None

            if program in user_balances and user_balances[program] >= points_needed:
                can_afford = True
                source_info = f"You have {user_balances[program]:,} {program} (need {points_needed:,})"

            if can_afford:
                matches.append({
                    "type": "flight_sweet_spot",
                    "route": spot["route"],
                    "program": program,
                    "cabin": spot["cabin"],
                    "points_needed": points_needed,
                    "cash_equivalent": cash_value,
                    "cpp_inr": spot["cpp_inr"],
                    "can_afford": True,
                    "source_info": source_info,
                    "notes": spot["notes"],
                    "potential_value_inr": cash_value - 10000,
                })

        return matches

    def _get_point_purchase_deals(self) -> list[dict]:
        deals = []
        for deal in self.promotions.get("point_purchase_deals", []):
            if deal["discount_percent"] >= 30:
                deals.append({
                    **deal,
                    "recommendation": deal["worth_it"],
                })
        return deals

    def _get_card_names(self, card_ids: list[int]) -> list[str]:
        cards_file = Path(__file__).parent.parent / "data" / "cards.json"
        with open(cards_file) as f:
            cards = json.load(f)
        return [c["name"] for c in cards if c["id"] in card_ids]


class ExpiryTracker:
    def check_expiring_points(self, balances: dict, expiry_rules: dict | None = None) -> list[dict]:
        if expiry_rules is None:
            expiry_rules = DEFAULT_EXPIRY_RULES

        alerts = []
        today = datetime.now().date()

        for program, balance in balances.items():
            rule = expiry_rules.get(program)
            if not rule:
                continue

            if rule["type"] == "activity_based":
                alerts.append({
                    "program": program,
                    "balance": balance,
                    "expiry_type": "activity_based",
                    "rule": rule["rule"],
                    "risk": "low",
                    "tip": rule["tip"],
                })
            elif rule["type"] == "time_based":
                expiry_date = today + timedelta(days=rule.get("days_from_earn", 365))
                days_until = rule.get("days_from_earn", 365)
                risk = "high" if days_until <= 90 else "medium" if days_until <= 180 else "low"
                alerts.append({
                    "program": program,
                    "balance": balance,
                    "expiry_type": "time_based",
                    "rule": rule.get("rule", "Time-based expiry"),
                    "estimated_expiry": expiry_date.isoformat(),
                    "days_remaining": days_until,
                    "risk": risk,
                    "tip": rule["tip"],
                })

        alerts.sort(key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["risk"]])
        return alerts


class CardRenewalAnalyzer:
    def __init__(self):
        data_dir = Path(__file__).parent.parent / "data"
        with open(data_dir / "cards.json") as f:
            self.cards = json.load(f)

    def analyze_renewal(self, card_id: int, annual_spend: float, usage_pattern: dict | None = None) -> dict:
        card = next((c for c in self.cards if c["id"] == card_id), None)
        if not card:
            return {"error": "Card not found"}

        fee = card["annual_fee"]
        benefits_value = sum(b["annual_value"] for b in card.get("benefits", []))

        earn_rate = card.get("base_earn_rate", 1.0)
        points_earned = annual_spend * earn_rate / 150
        points_value = points_earned * 0.75

        total_value = benefits_value + points_value
        net_value = total_value - fee

        if net_value > fee * 2:
            recommendation = "RENEW"
            reason = f"Card generates {total_value/fee:.1f}x its fee in value"
        elif net_value > 0:
            recommendation = "RENEW"
            reason = f"Positive ROI of ₹{net_value:,.0f}"
        elif net_value > -fee * 0.3:
            recommendation = "CONSIDER DOWNGRADE"
            reason = f"Marginal value. Consider a lower-fee variant."
        else:
            recommendation = "CANCEL"
            reason = f"Net loss of ₹{abs(net_value):,.0f}. Benefits not being utilized."

        alternatives = self._suggest_alternatives(card, annual_spend)

        return {
            "card_name": card["name"],
            "annual_fee": fee,
            "benefits_value": benefits_value,
            "points_value": round(points_value),
            "total_value": round(total_value),
            "net_value": round(net_value),
            "roi_percentage": round(total_value / fee * 100, 1) if fee > 0 else 0,
            "recommendation": recommendation,
            "reason": reason,
            "annual_spend": annual_spend,
            "points_earned_annually": round(points_earned),
            "alternatives": alternatives,
            "break_even_spend": round(fee / (earn_rate / 150 * 0.75)) if earn_rate > 0 else 0,
        }

    def analyze_all_cards(self, user_cards: list[int], annual_spend_per_card: dict | None = None) -> dict:
        results = []
        total_fees = 0
        total_value = 0

        for card_id in user_cards:
            spend = (annual_spend_per_card or {}).get(str(card_id), 500000)
            analysis = self.analyze_renewal(card_id, spend)
            if "error" not in analysis:
                results.append(analysis)
                total_fees += analysis["annual_fee"]
                total_value += analysis["total_value"]

        return {
            "cards": results,
            "total_annual_fees": total_fees,
            "total_annual_value": round(total_value),
            "net_portfolio_value": round(total_value - total_fees),
            "cards_to_keep": [r for r in results if r["recommendation"] == "RENEW"],
            "cards_to_review": [r for r in results if r["recommendation"] != "RENEW"],
        }

    def _suggest_alternatives(self, card: dict, annual_spend: float) -> list[dict]:
        alternatives = []
        bank = card["bank"]
        fee = card["annual_fee"]

        for alt_card in self.cards:
            if alt_card["id"] == card["id"]:
                continue
            if alt_card["bank"] == bank and alt_card["annual_fee"] < fee:
                alternatives.append({
                    "name": alt_card["name"],
                    "annual_fee": alt_card["annual_fee"],
                    "savings": fee - alt_card["annual_fee"],
                    "trade_off": "Lower benefits but reduced fee",
                })

        return alternatives[:3]


DEFAULT_EXPIRY_RULES = {
    "HDFC Reward Points": {
        "type": "activity_based",
        "rule": "Points expire after 2 years of inactivity",
        "tip": "Any transaction resets the clock. Use card once every 23 months."
    },
    "Amex Membership Rewards": {
        "type": "activity_based",
        "rule": "Points valid as long as card is active",
        "tip": "Points expire only if you cancel the card."
    },
    "Axis EDGE Miles": {
        "type": "activity_based",
        "rule": "Miles valid for 3 years from earning",
        "tip": "Use or transfer before expiry. Activity extends life of recent miles only."
    },
    "KrisFlyer": {
        "type": "time_based",
        "days_from_earn": 1095,
        "rule": "Miles expire 3 years after earning",
        "tip": "Transfer to KrisFlyer from credit cards just before you need them, not in advance."
    },
    "British Airways Avios": {
        "type": "activity_based",
        "rule": "Avios expire after 36 months of inactivity",
        "tip": "Any earning or spending resets the clock. Collect via shopping portal to keep alive."
    },
    "Marriott Bonvoy": {
        "type": "activity_based",
        "rule": "Points expire after 24 months of inactivity",
        "tip": "Any stay, transfer, or credit card earning resets expiry."
    },
    "Emirates Skywards": {
        "type": "time_based",
        "days_from_earn": 1095,
        "rule": "Miles expire 3 years from earning (no activity reset)",
        "tip": "Use oldest miles first. Consider transferring to Skywards only when needed."
    },
    "Flying Blue": {
        "type": "activity_based",
        "rule": "Miles expire after 24 months of inactivity",
        "tip": "Earn miles via shopping or partner to keep active."
    },
}


opportunity_scanner = OpportunityScanner()
expiry_tracker = ExpiryTracker()
card_renewal_analyzer = CardRenewalAnalyzer()
