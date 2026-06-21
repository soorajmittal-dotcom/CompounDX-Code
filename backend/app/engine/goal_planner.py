from datetime import datetime, timedelta
from app.engine.transfer_graph import transfer_graph
from app.engine.points_valuator import points_valuator
from app.engine.award_search import AWARD_AVAILABILITY


class GoalPlanner:
    def create_roadmap(
        self,
        destination: str,
        target_date: str,
        cabin: str,
        travelers: int,
        current_balances: dict,
        monthly_spend: dict,
        user_cards: list[int],
    ) -> dict:
        target = datetime.strptime(target_date, "%Y-%m-%d").date()
        today = datetime.now().date()
        months_available = max(1, (target - today).days // 30)

        points_needed = self._estimate_points_needed(destination, cabin, travelers)
        best_program = points_needed["recommended_program"]
        required_points = points_needed["points_required"]

        current_in_program = current_balances.get(best_program, 0)
        transferable = self._calculate_transferable(current_balances, best_program)
        total_available = current_in_program + transferable["total_transferable"]

        gap = max(0, required_points - total_available)
        monthly_earn = self._estimate_monthly_earn(monthly_spend, user_cards, best_program)

        months_to_goal = gap / monthly_earn if monthly_earn > 0 else float("inf")
        achievable = months_to_goal <= months_available

        monthly_plan = self._build_monthly_plan(
            months_available, gap, monthly_earn, best_program, current_balances, user_cards
        )

        return {
            "goal": {
                "destination": destination,
                "target_date": target_date,
                "cabin": cabin,
                "travelers": travelers,
                "months_available": months_available,
            },
            "points_analysis": {
                "program": best_program,
                "points_required": required_points,
                "currently_available": total_available,
                "in_program": current_in_program,
                "transferable_from_other": transferable,
                "gap": gap,
                "monthly_earn_rate": round(monthly_earn),
                "months_to_goal": round(months_to_goal, 1),
                "achievable_by_target": achievable,
            },
            "monthly_roadmap": monthly_plan,
            "recommendations": self._generate_recommendations(
                gap, monthly_earn, months_available, best_program, achievable
            ),
            "alternative_programs": points_needed.get("alternatives", []),
        }

    def _estimate_points_needed(self, destination: str, cabin: str, travelers: int) -> dict:
        dest_map = {
            "Singapore": "India-SEA",
            "Tokyo": "India-East_Asia",
            "Japan": "India-East_Asia",
            "Korea": "India-East_Asia",
            "Seoul": "India-East_Asia",
            "London": "India-Europe",
            "Europe": "India-Europe",
            "Paris": "India-Europe",
            "New York": "India-North_America",
            "USA": "India-North_America",
            "Dubai": "India-Middle_East",
            "Bangkok": "India-SEA",
            "Bali": "India-SEA",
            "Maldives": "India-Middle_East",
        }

        region = dest_map.get(destination, "India-SEA")
        awards = AWARD_AVAILABILITY.get(region, [])

        options = []
        for award in awards:
            pts = award.get(cabin)
            if pts:
                options.append({
                    "program": award["program"],
                    "points_per_person": pts,
                    "total_points": pts * travelers,
                    "airline": award["airline"],
                })

        options.sort(key=lambda x: x["total_points"])

        best = options[0] if options else {"program": "KrisFlyer", "total_points": 62000 * travelers}

        return {
            "recommended_program": best["program"],
            "points_required": best["total_points"],
            "alternatives": options[1:4] if len(options) > 1 else [],
        }

    def _calculate_transferable(self, balances: dict, target_program: str) -> dict:
        transferable = []
        total = 0

        for source, balance in balances.items():
            if source == target_program:
                continue
            path = transfer_graph.find_best_path(source, target_program, balance)
            if path and path.points_delivered > 0:
                transferable.append({
                    "from": source,
                    "balance": balance,
                    "delivers": path.points_delivered,
                    "ratio": path.effective_ratio,
                    "time_days": path.transfer_time_days,
                })
                total += path.points_delivered

        transferable.sort(key=lambda x: x["delivers"], reverse=True)
        return {"sources": transferable, "total_transferable": total}

    def _estimate_monthly_earn(self, monthly_spend: dict, user_cards: list[int], target_program: str) -> float:
        import json
        from pathlib import Path

        data_dir = Path(__file__).parent.parent / "data"
        with open(data_dir / "cards.json") as f:
            cards = json.load(f)
        with open(data_dir / "point_valuations.json") as f:
            valuations = json.load(f)

        available_cards = [c for c in cards if c["id"] in user_cards] if user_cards else cards
        total_monthly_points = 0

        for category, amount in monthly_spend.items():
            best_earn = 0
            best_currency = ""
            for card in available_cards:
                base = card.get("base_earn_rate", 1.0)
                bonus = card.get("bonus_categories", {})
                rate = max(base, bonus.get(category, base), bonus.get("all_spends", base))
                points = amount * rate / 150
                if points > best_earn:
                    best_earn = points
                    best_currency = card["points_currency"]
            total_monthly_points += best_earn

        effective_ratio = 2.0
        for source in [c["points_currency"] for c in available_cards]:
            path = transfer_graph.find_best_path(source, target_program, 1000)
            if path:
                effective_ratio = min(effective_ratio, path.effective_ratio)

        return total_monthly_points / effective_ratio if effective_ratio > 0 else total_monthly_points

    def _build_monthly_plan(self, months: int, gap: int, monthly_earn: float, program: str, balances: dict, cards: list[int]) -> list[dict]:
        plan = []
        remaining_gap = gap
        accumulated = 0

        for month in range(1, min(months + 1, 13)):
            month_date = (datetime.now() + timedelta(days=30 * month)).strftime("%Y-%m")
            earned = round(monthly_earn)
            accumulated += earned
            remaining_gap = max(0, gap - accumulated)

            actions = []
            if month == 1:
                actions.append("Set up optimal card usage per category")
            if month == months - 1 and remaining_gap > 0:
                actions.append(f"Consider transferring existing points to {program}")
            if month == months:
                actions.append("Transfer all accumulated points to target program")
                actions.append("Book award tickets")

            if month <= 3:
                actions.append("Watch for transfer bonuses")
            if month == 6:
                actions.append("Mid-point check: reassess strategy if behind target")

            plan.append({
                "month": month,
                "date": month_date,
                "points_earned": earned,
                "cumulative_points": round(accumulated),
                "remaining_gap": round(remaining_gap),
                "progress_percent": min(100, round(accumulated / gap * 100)) if gap > 0 else 100,
                "actions": actions,
            })

        return plan

    def _generate_recommendations(self, gap: int, monthly_earn: float, months: int, program: str, achievable: bool) -> list[str]:
        recs = []

        if achievable:
            recs.append(f"You can reach your goal by earning ~{round(monthly_earn):,} points/month through optimal card usage.")
        else:
            shortfall = gap - (monthly_earn * months)
            recs.append(f"Gap of ~{round(shortfall):,} points. Consider transferring from other programs or increasing spend.")

        recs.append("Use SmartBuy/travel portals for maximum earning on travel purchases.")
        recs.append(f"Transfer to {program} only when you're ready to book — avoid parking miles that might expire.")
        recs.append("Watch for transfer bonuses that could give 20-40% extra miles.")

        if not achievable:
            recs.append("Consider a lower cabin class or alternate program with fewer points required.")
            recs.append("A targeted credit card sign-up bonus could close the gap quickly.")

        return recs


goal_planner = GoalPlanner()
