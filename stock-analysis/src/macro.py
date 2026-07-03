"""Macro factor layer.

Data source reality: this environment cannot call market-data APIs directly
(network policy), but the agent driving the daily refresh CAN read current
readings via web search. So the design is an *accumulating snapshot file*:

    data/macro/macro_history.csv   (one row per refresh day, appended by the
                                    agent during the daily routine)

- The macro strip (levels + day/week changes) works from day one.
- Measured factor->sector sensitivities need overlapping history and switch
  on automatically once there are >= MIN_ROWS_FOR_SENSITIVITY overlapping
  dates with the stock data; until then the dashboard shows the documented
  prior expectations below, clearly labelled as priors.
- If the user can export historical macro series from any terminal or
  broker, dropping a CSV with the same columns into data/macro/ and merging
  unlocks measured sensitivities immediately.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

MACRO_CSV = Path(__file__).parent.parent / "data" / "macro" / "macro_history.csv"
MIN_ROWS_FOR_SENSITIVITY = 60

FACTORS = {
    "brent":  {"label": "Brent crude", "unit": "$", "decimals": 2},
    "usdinr": {"label": "USD/INR", "unit": "₹", "decimals": 2},
    "sp500":  {"label": "S&P 500", "unit": "", "decimals": 0},
    "nasdaq": {"label": "Nasdaq", "unit": "", "decimals": 0},
    "dow":    {"label": "Dow Jones", "unit": "", "decimals": 0},
    "us10y":  {"label": "US 10Y yield", "unit": "%", "decimals": 2},
    "vix":    {"label": "VIX", "unit": "", "decimals": 1},
    "gold":   {"label": "Gold", "unit": "$", "decimals": 0},
}
FLOWS = {
    "fii_cash_cr": {"label": "FII cash (₹ cr)"},
    "dii_cash_cr": {"label": "DII cash (₹ cr)"},
}

# Prior (textbook + India-market experience) factor->sector relationships,
# shown until measured sensitivities take over. Sign is the expected effect
# of the factor RISING on the sector.
PRIOR_SENSITIVITIES = [
    {"factor": "Brent crude ↑", "helps": ["Oil & Gas (upstream: ONGC, OIL)"],
     "hurts": ["Aviation", "Paints/Chemicals (input cost)", "Oil & Gas (OMCs: BPCL/HPCL/IOC)", "Cement (fuel/freight)"]},
    {"factor": "USD/INR ↑ (rupee weakens)", "helps": ["IT (export revenue)", "Pharma (exporters)", "Metals (import parity pricing)"],
     "hurts": ["Aviation (fuel + leases in $)", "Oil & Gas OMCs", "Capital Goods (imported components)"]},
    {"factor": "US 10Y yield ↑", "helps": [],
     "hurts": ["IT (US clients cut spend + valuation de-rating)", "Banking/NBFC (FII outflow pressure)", "Realty (rate-sensitive)"]},
    {"factor": "FII sustained selling", "helps": ["(DII absorption favors largecap quality)"],
     "hurts": ["High-FII-ownership largecaps (Banks, IT)", "High-beta midcaps"]},
    {"factor": "VIX ↑ (global risk-off)", "helps": ["FMCG/Pharma (defensives, relatively)"],
     "hurts": ["High-beta cyclicals", "PSU banks", "Midcap breadth"]},
    {"factor": "Gold ↑", "helps": ["Jewellery retail (inventory gains: Titan, Kalyan)", "Gold-loan NBFCs (Muthoot, Manappuram)"],
     "hurts": []},
    {"factor": "US equities ↑ (S&P/Nasdaq)", "helps": ["IT (sentiment + spend proxy)", "Overall market beta"],
     "hurts": []},
]


def load_history() -> pd.DataFrame:
    if not MACRO_CSV.exists():
        return pd.DataFrame()
    df = pd.read_csv(MACRO_CSV, parse_dates=["date"]).sort_values("date")
    return df.drop_duplicates(subset="date", keep="last").reset_index(drop=True)


def macro_snapshot() -> dict:
    """Latest levels + changes for the dashboard strip."""
    hist = load_history()
    if hist.empty:
        return {"asOf": None, "factors": [], "flows": [], "historyRows": 0}

    latest = hist.iloc[-1]
    prev = hist.iloc[-2] if len(hist) >= 2 else None
    week = hist.iloc[-6] if len(hist) >= 6 else None

    factors = []
    for col, meta in FACTORS.items():
        if col not in hist.columns or pd.isna(latest.get(col)):
            continue
        v = float(latest[col])
        d1 = (v / float(prev[col]) - 1) * 100 if prev is not None and pd.notna(prev.get(col)) else None
        d5 = (v / float(week[col]) - 1) * 100 if week is not None and pd.notna(week.get(col)) else None
        factors.append({
            "key": col, "label": meta["label"], "unit": meta["unit"],
            "value": round(v, meta["decimals"]),
            "chg1": None if d1 is None else round(d1, 2),
            "chg5": None if d5 is None else round(d5, 2),
        })

    flows = []
    for col, meta in FLOWS.items():
        if col not in hist.columns or pd.isna(latest.get(col)):
            continue
        vals = hist[col].dropna()
        flows.append({
            "key": col, "label": meta["label"],
            "value": round(float(latest[col]), 1),
            "sum5": round(float(vals.tail(5).sum()), 1) if len(vals) else None,
            "streak": _streak(vals),
        })

    return {
        "asOf": str(latest["date"].date()),
        "factors": factors,
        "flows": flows,
        "historyRows": int(len(hist)),
        "priorSensitivities": PRIOR_SENSITIVITIES,
    }


def _streak(vals: pd.Series) -> int:
    """Consecutive same-sign days at the end of the series (+3 = 3 buy days)."""
    n = 0
    for v in reversed(list(vals)):
        if v > 0 and n >= 0:
            n += 1
        elif v < 0 and n <= 0:
            n -= 1
        else:
            break
    return n


def measured_sensitivities(returns: pd.DataFrame, sector_of: dict[str, str]) -> list[dict] | None:
    """Correlate sector average daily returns vs factor daily % changes on
    overlapping dates. Returns None until there's enough overlap to be
    worth showing (MIN_ROWS_FOR_SENSITIVITY days)."""
    hist = load_history()
    if len(hist) < MIN_ROWS_FOR_SENSITIVITY:
        return None
    hist = hist.set_index("date")
    factor_chg = hist[[c for c in FACTORS if c in hist.columns]].pct_change().dropna(how="all")

    sect_ret = {}
    for sym, sec in sector_of.items():
        if sym in returns.columns:
            sect_ret.setdefault(sec, []).append(returns[sym])
    sector_avg = pd.DataFrame({s: pd.concat(cols, axis=1).mean(axis=1) for s, cols in sect_ret.items()})

    joined = factor_chg.join(sector_avg, how="inner").dropna(how="all")
    if len(joined) < MIN_ROWS_FOR_SENSITIVITY:
        return None
    out = []
    for f in factor_chg.columns:
        row = {"factor": FACTORS[f]["label"]}
        corrs = {s: joined[f].corr(joined[s]) for s in sector_avg.columns if s in joined}
        ranked = sorted(corrs.items(), key=lambda kv: kv[1] if pd.notna(kv[1]) else 0)
        row["mostNegative"] = [{"sector": s, "corr": round(c, 2)} for s, c in ranked[:3] if pd.notna(c)]
        row["mostPositive"] = [{"sector": s, "corr": round(c, 2)} for s, c in ranked[-3:][::-1] if pd.notna(c)]
        out.append(row)
    return out


def macro_alert_lines(snapshot: dict) -> list[str]:
    """Threshold-based macro flags for the alerts digest."""
    lines = []
    for f in snapshot.get("factors", []):
        chg = f.get("chg1")
        if chg is None:
            continue
        big = {"brent": 3, "usdinr": 0.5, "sp500": 1.5, "nasdaq": 2, "dow": 1.5,
               "us10y": 3, "vix": 12, "gold": 2}.get(f["key"], 3)
        if abs(chg) >= big:
            lines.append(f"- **{f['label']}** moved {chg:+.1f}% to {f['value']}")
    for fl in snapshot.get("flows", []):
        streak = fl.get("streak") or 0
        if streak <= -3:
            lines.append(f"- **{fl['label']}**: {-streak} consecutive selling days "
                         f"(5-day net {fl['sum5']:+,.0f} cr)")
        elif streak >= 5:
            lines.append(f"- **{fl['label']}**: {streak} consecutive buying days "
                         f"(5-day net {fl['sum5']:+,.0f} cr)")
    vix = next((f for f in snapshot.get("factors", []) if f["key"] == "vix"), None)
    if vix and vix["value"] >= 22:
        lines.append(f"- **VIX elevated** at {vix['value']} - risk-off regime, downgrade rotation signals")
    return lines
