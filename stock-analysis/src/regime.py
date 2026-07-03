"""Market regime dial: one verdict that gates everything below it.

Inspired by full macro regime classifiers, but restricted to what our data
can honestly support. Each component reads -1 (risk-off), 0 (neutral), or
+1 (risk-on); only components with available data vote. Verdict:

    net score >= +2  ->  RISK-ON    trust rotation entries at full size
    net score <= -2  ->  RISK-OFF   entries need extra confirmation, smaller size,
                                    index-level decisions dominate stock-picking
    otherwise        ->  NEUTRAL

Components (data source in brackets):
    breadth      % of stocks with positive momentum          [stock export]
    drift        median 21-session momentum change            [stock export]
    dispersion   avg pairwise 90d correlation - when it rises
                 toward the 365d level everything becomes one
                 trade and stock-picking stops paying          [stock export]
    vix          CBOE VIX level                                [macro history]
    fii          FII cash flow streak                          [macro history]
    rupee        USD/INR 5-day change                          [macro history]

A verdict history is appended to data/macro/regime_history.csv on each
pipeline run so regime CHANGES can be alerted, which matters more than
the level.
"""

from __future__ import annotations

from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd

REGIME_CSV = Path(__file__).parent.parent / "data" / "macro" / "regime_history.csv"


def _avg_offdiag(corr: pd.DataFrame) -> float:
    vals = corr.values
    mask = ~np.eye(len(vals), dtype=bool)
    return float(np.nanmean(vals[mask]))


def regime_dial(
    breadth: float,
    median_drift: float,
    corr_short: pd.DataFrame,
    corr_long: pd.DataFrame,
    macro_snapshot: dict,
) -> dict:
    components = []

    def vote(name: str, value: str, v: int, why: str):
        components.append({"name": name, "reading": value, "vote": v, "why": why})

    vote("Breadth", f"{breadth:.0%}",
         1 if breadth >= 0.60 else (-1 if breadth <= 0.40 else 0),
         "share of stocks with positive momentum")

    vote("Drift", f"{median_drift:+.0f}",
         1 if median_drift >= 10 else (-1 if median_drift <= -10 else 0),
         "median 21-session momentum change")

    ac_short = _avg_offdiag(corr_short)
    ac_long = _avg_offdiag(corr_long)
    disp_vote = -1 if (ac_short >= 0.40 or ac_short - ac_long >= 0.08) else (1 if ac_short <= 0.25 else 0)
    vote("Dispersion", f"corr {ac_short:.2f} (365d {ac_long:.2f})", disp_vote,
         "avg pairwise correlation - high/rising = one-trade market")

    factors = {f["key"]: f for f in macro_snapshot.get("factors", [])}
    if "vix" in factors:
        v = factors["vix"]["value"]
        vote("VIX", f"{v}", 1 if v < 15 else (-1 if v >= 22 else 0), "CBOE VIX level")
    if macro_snapshot.get("flows"):
        fii = next((f for f in macro_snapshot["flows"] if f["key"] == "fii_cash_cr"), None)
        if fii is not None:
            streak = fii.get("streak") or 0
            vote("FII flows", f"{streak:+d}d streak",
                 1 if streak >= 3 else (-1 if streak <= -3 else 0),
                 "consecutive net buy/sell days in cash")
    if "usdinr" in factors and factors["usdinr"].get("chg5") is not None:
        c5 = factors["usdinr"]["chg5"]
        vote("Rupee", f"{c5:+.1f}% 5d",
             -1 if c5 >= 0.5 else (1 if c5 <= -0.3 else 0),
             "USD/INR 5-day change - fast weakening = outflow pressure")

    score = sum(c["vote"] for c in components)
    verdict = "RISK-ON" if score >= 2 else ("RISK-OFF" if score <= -2 else "NEUTRAL")
    guidance = {
        "RISK-ON": "rotation entries at normal size; breadth supports stock-picking",
        "NEUTRAL": "trade the entries list selectively; keep gross exposure moderate",
        "RISK-OFF": "downgrade all entries one notch, cut size, prefer index-level decisions; cash is a position",
    }[verdict]

    prev = _last_recorded()
    changed = prev is not None and prev != verdict
    _record(verdict, score)

    return {
        "verdict": verdict, "score": int(score), "nVoting": len(components),
        "components": components, "guidance": guidance,
        "changedFrom": prev if changed else None,
    }


def _last_recorded() -> str | None:
    if not REGIME_CSV.exists():
        return None
    hist = pd.read_csv(REGIME_CSV)
    return str(hist.iloc[-1]["verdict"]) if len(hist) else None


def _record(verdict: str, score: int) -> None:
    REGIME_CSV.parent.mkdir(parents=True, exist_ok=True)
    today = str(date.today())
    if REGIME_CSV.exists():
        hist = pd.read_csv(REGIME_CSV)
        hist = hist[hist["date"] != today]
    else:
        hist = pd.DataFrame(columns=["date", "verdict", "score"])
    hist = pd.concat([hist, pd.DataFrame([{"date": today, "verdict": verdict, "score": score}])])
    hist.to_csv(REGIME_CSV, index=False)
