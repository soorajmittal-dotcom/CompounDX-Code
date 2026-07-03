"""Conviction engine: one score per stock, in the spirit of a multi-
timeframe trade comparator, built from what our daily data can honestly
support.

The D/W/M/Q momentum columns are four lookback horizons - a natural
timeframe cascade (Q/M = higher timeframe, W = medium, D = lower). The
score rewards the same things a discretionary multi-timeframe read does:

    alignment   (0-30)  how many of D/W/M/Q agree with the direction
    quadrant    (0-25)  rotation state (Leading best for longs, Lagging for shorts)
    freshness   (0-15)  crossed into that quadrant within the last 5 sessions
    sector      (0-15)  the stock's sector is in a supportive quadrant
    partners    (0-15)  share of its stable partners moving the same way

Direction is taken from the monthly score's sign; the score is computed
for that side (a bearish stock scores high as a SHORT candidate, and the
dashboard labels it that way).

Grades (set from the observed score distribution so they discriminate -
median sits in C, A and above is the top decile):
A+ >= 92, A >= 85, B >= 70, C >= 55, else D.

Trade levels are volatility-based (stop = 2 x 20-day sigma from daily
closes, target = 2R) - deliberately simple, because we have daily LTP
only. They size the risk honestly; they are NOT intraday structure levels
and the dashboard says so.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

GRADE_BANDS = [(92, "A+"), (85, "A"), (70, "B"), (55, "C"), (-1, "D")]

QUAD_POINTS_LONG = {"Leading": 25, "Improving": 15, "Weakening": 5, "Lagging": 0}
QUAD_POINTS_SHORT = {"Lagging": 25, "Weakening": 15, "Improving": 5, "Leading": 0}


def grade_of(score: float) -> str:
    for cutoff, g in GRADE_BANDS:
        if score >= cutoff:
            return g
    return "D"


def conviction_table(
    momentum_latest: pd.DataFrame,      # index Symbol, cols D/W/M/Q
    stock_rot: pd.DataFrame,            # Symbol, sector, score, delta, quadrant
    sector_rot: pd.DataFrame,           # sector, quadrant
    crossings: list[dict],              # transitions.quadrant_transitions()["crossings"]
    partners: dict[str, list[dict]],    # per-symbol stable/emerging partner list
    price: pd.DataFrame,                # Date x Symbol LTP panel
) -> pd.DataFrame:
    rot = stock_rot.set_index("Symbol")
    sector_quad = dict(zip(sector_rot["sector"], sector_rot["quadrant"]))
    fresh = {c["symbol"]: c for c in crossings if c.get("kind")}

    ret20 = price.pct_change().tail(20)
    sigma20 = ret20.std()
    latest_px = price.ffill().iloc[-1]

    quad_by_sym = rot["quadrant"].to_dict()

    rows = []
    for sym in rot.index:
        mom = momentum_latest.loc[sym] if sym in momentum_latest.index else None
        if mom is None or pd.isna(mom.get("M")):
            continue
        direction = "long" if float(mom["M"]) >= 0 else "short"
        sign = 1 if direction == "long" else -1

        vals = [mom.get(c) for c in "DWMQ"]
        agree = sum(1 for v in vals if pd.notna(v) and sign * float(v) > 0)
        alignment = {4: 30, 3: 20, 2: 10}.get(agree, 0)
        confluence = round(agree / 4 * 100)

        quad = rot.loc[sym, "quadrant"]
        quad_pts = (QUAD_POINTS_LONG if direction == "long" else QUAD_POINTS_SHORT).get(quad, 0)

        freshness = 0
        cx = fresh.get(sym)
        if cx:
            if direction == "long" and cx["kind"] == "entry":
                freshness = 15
            elif direction == "long" and cx["kind"] == "watch":
                freshness = 8
            elif direction == "short" and cx["kind"] == "exit":
                freshness = 15
            elif direction == "short" and cx["kind"] == "take-profit":
                freshness = 8

        sec = rot.loc[sym, "sector"]
        sq = sector_quad.get(sec)
        sector_pts_map = QUAD_POINTS_LONG if direction == "long" else QUAD_POINTS_SHORT
        sector_pts = round(sector_pts_map.get(sq, 0) * 15 / 25)

        plist = [p for p in partners.get(sym, []) if p["tag"] in ("stable", "emerging")]
        if plist:
            same_side = 0
            for p in plist:
                pq = quad_by_sym.get(p["sym"])
                good = (pq in ("Leading", "Improving")) if direction == "long" else (pq in ("Lagging", "Weakening"))
                if good:
                    same_side += 1
            partner_pts = round(same_side / len(plist) * 15)
            partner_pct = round(same_side / len(plist) * 100)
        else:
            partner_pts, partner_pct = 7, None  # no information, neutral

        total = alignment + quad_pts + freshness + sector_pts + partner_pts

        px = float(latest_px.get(sym, np.nan))
        sig = float(sigma20.get(sym, np.nan))
        if np.isfinite(px) and np.isfinite(sig) and sig > 0:
            risk = 2 * sig * px
            stop = px - sign * risk
            target = px + sign * 2 * risk
            levels = {"entry": round(px, 1), "stop": round(stop, 1),
                      "target": round(target, 1), "rr": "1:2"}
        else:
            levels = None

        rows.append({
            "Symbol": sym, "sector": sec, "direction": direction,
            "score": int(total), "grade": grade_of(total),
            "confluence": confluence, "quadrant": quad,
            "components": {"alignment": alignment, "quadrant": quad_pts,
                           "freshness": freshness, "sector": sector_pts,
                           "partners": partner_pts},
            "partnerAgreePct": partner_pct,
            "biasCascade": {c: (None if pd.isna(mom.get(c)) else ("bull" if float(mom[c]) > 0 else "bear"))
                            for c in "DWMQ"},
            "levels": levels,
        })

    out = pd.DataFrame(rows).sort_values("score", ascending=False).reset_index(drop=True)
    return out
