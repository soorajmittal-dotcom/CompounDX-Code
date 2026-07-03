"""Momentum rotation: strength vs. direction quadrants.

The D/W/M/Q columns are already relative-strength scores, so the classic
rotation read falls straight out of the data:

    x = current score       (where the stock/sector stands)
    y = change in score     (which way it is moving)

    strong & rising   -> Leading
    strong & falling  -> Weakening
    weak & rising     -> Improving
    weak & falling    -> Lagging

The same table is computed per stock and aggregated per sector. Zero is the
natural strength boundary (scores are signed around a neutral market).
"""

from __future__ import annotations

import pandas as pd

from sectors import get_sector

QUADRANTS = {
    (True, True): "Leading",
    (True, False): "Weakening",
    (False, True): "Improving",
    (False, False): "Lagging",
}


def stock_rotation(df: pd.DataFrame, score_col: str = "M", delta_sessions: int = 21) -> pd.DataFrame:
    """Per stock: latest score, change over ~1 month of sessions, quadrant."""
    rows = []
    for sym, sub in df.groupby("Symbol"):
        s = sub.sort_values("Date")[score_col].dropna()
        if len(s) < delta_sessions + 1:
            continue
        latest = float(s.iloc[-1])
        prior = float(s.iloc[-(delta_sessions + 1)])
        delta = latest - prior
        sector, industry = get_sector(sym)
        rows.append(
            {
                "Symbol": sym,
                "sector": sector,
                "industry": industry,
                "score": latest,
                "delta": round(delta, 1),
                "quadrant": QUADRANTS[(latest >= 0, delta >= 0)],
            }
        )
    return pd.DataFrame(rows)


def sector_rotation(stock_rot: pd.DataFrame) -> pd.DataFrame:
    """Sector-level rotation: mean score/delta of members (indices excluded)."""
    members = stock_rot[stock_rot["sector"] != "Index"]
    agg = members.groupby("sector").agg(
        score=("score", "mean"), delta=("delta", "mean"), n=("Symbol", "count")
    )
    agg["score"] = agg["score"].round(1)
    agg["delta"] = agg["delta"].round(1)
    agg["quadrant"] = [
        QUADRANTS[(s >= 0, d >= 0)] for s, d in zip(agg["score"], agg["delta"])
    ]
    return agg.reset_index().sort_values("score", ascending=False)
