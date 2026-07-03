"""Quadrant transition alerts: what changed over the last week.

The backtest showed the rotation signal lives in the *transitions*, not the
levels - so this compares each stock's quadrant today vs. `lookback_sessions`
ago (default 5, ~1 week) and surfaces the four actionable crossings:

    Improving -> Leading    entry signal (weak name turned strong & rising)
    Lagging   -> Improving  early watchlist (bottoming out)
    Leading   -> Weakening  take-profit warning (strong name rolling over)
    Weakening -> Lagging    exit/avoid confirmation

plus the week's biggest momentum accelerations/decelerations, and
week-over-week changes in the relationship set (newly emerging pairs).
"""

from __future__ import annotations

import pandas as pd

from rotation import stock_rotation
from sectors import INDEX_SYMBOLS

ACTIONABLE = {
    ("Improving", "Leading"): ("entry", "crossed into Leading"),
    ("Lagging", "Improving"): ("watch", "bottoming out - turned Improving"),
    ("Leading", "Weakening"): ("take-profit", "rolling over from Leading"),
    ("Weakening", "Lagging"): ("exit", "broke down into Lagging"),
}


def _rotation_asof(df: pd.DataFrame, sessions_back: int) -> pd.DataFrame:
    """Stock rotation table computed as of N sessions before the last date."""
    if sessions_back == 0:
        return stock_rotation(df)
    dates = sorted(df["Date"].unique())
    if sessions_back >= len(dates):
        return pd.DataFrame()
    cutoff = dates[-(sessions_back + 1)]
    return stock_rotation(df[df["Date"] <= cutoff])


def quadrant_transitions(df: pd.DataFrame, lookback_sessions: int = 5) -> dict:
    df = df[~df["Symbol"].isin(INDEX_SYMBOLS)]
    now = _rotation_asof(df, 0).set_index("Symbol")
    prev = _rotation_asof(df, lookback_sessions).set_index("Symbol")
    common = now.index.intersection(prev.index)

    crossings = []
    for sym in common:
        q_prev, q_now = prev.loc[sym, "quadrant"], now.loc[sym, "quadrant"]
        if q_prev == q_now:
            continue
        kind, label = ACTIONABLE.get((q_prev, q_now), (None, None))
        crossings.append(
            {
                "symbol": sym,
                "sector": now.loc[sym, "sector"],
                "from": q_prev,
                "to": q_now,
                "kind": kind,           # None for non-actionable diagonal moves
                "label": label,
                "score": round(float(now.loc[sym, "score"]), 1),
                "delta": round(float(now.loc[sym, "delta"]), 1),
                "week_change": round(float(now.loc[sym, "score"] - prev.loc[sym, "score"]), 1),
            }
        )
    crossings.sort(key=lambda c: (c["kind"] is None, -abs(c["week_change"])))

    week_move = (now.loc[common, "score"] - prev.loc[common, "score"]).sort_values()
    movers = {
        "accelerating": [
            {"symbol": s, "sector": now.loc[s, "sector"], "change": round(float(v), 1),
             "score": round(float(now.loc[s, "score"]), 1)}
            for s, v in week_move.tail(8).iloc[::-1].items()
        ],
        "decelerating": [
            {"symbol": s, "sector": now.loc[s, "sector"], "change": round(float(v), 1),
             "score": round(float(now.loc[s, "score"]), 1)}
            for s, v in week_move.head(8).items()
        ],
    }

    breadth_now = float((now["score"] >= 0).mean())
    breadth_prev = float((prev.loc[common, "score"] >= 0).mean())

    return {
        "lookbackSessions": lookback_sessions,
        "crossings": crossings,
        "movers": movers,
        "breadth": {"now": round(breadth_now, 3), "prev": round(breadth_prev, 3)},
    }


def edge_changes(edges_now: pd.DataFrame, edges_prev: pd.DataFrame) -> dict:
    """Week-over-week changes in the tagged relationship set."""
    def keyset(e: pd.DataFrame, tag: str) -> set[tuple[str, str]]:
        sub = e[e["tag"] == tag]
        return {tuple(sorted((a, b))) for a, b in zip(sub["a"], sub["b"])}

    new_emerging = keyset(edges_now, "emerging") - keyset(edges_prev, "emerging") - keyset(edges_prev, "stable")
    new_fading = keyset(edges_now, "fading") - keyset(edges_prev, "fading")
    lookup = {tuple(sorted((r["a"], r["b"]))): r for _, r in edges_now.iterrows()}
    fmt = lambda pairs: [
        {"a": a, "b": b,
         "c90": lookup[(a, b)]["corr_short"], "c365": lookup[(a, b)]["corr_long"]}
        for a, b in sorted(pairs)
    ]
    return {"newEmerging": fmt(new_emerging), "newFading": fmt(new_fading)}


def index_relationship_shifts(
    corr_long: pd.DataFrame,
    corr_short: pd.DataFrame,
    index_sym: str = "NIFTY",
    top_n: int = 8,
    min_shift: float = 0.15,
) -> dict:
    """Stocks whose relationship to an index is changing.

    shift = corr(90d) - corr(365d) against the index:
      strongly negative -> decoupling (stock stopped tracking the index -
      idiosyncratic story, event risk, or early sector rotation away)
      strongly positive -> recoupling (stock is being pulled back into the
      index trade - its individual story is fading)
    """
    if index_sym not in corr_long.columns or index_sym not in corr_short.columns:
        return {"index": index_sym, "decoupling": [], "recoupling": []}
    both = [s for s in corr_long.columns
            if s in corr_short.columns and s not in INDEX_SYMBOLS]
    rows = []
    for s in both:
        cl, cs = corr_long.loc[s, index_sym], corr_short.loc[s, index_sym]
        if pd.isna(cl) or pd.isna(cs):
            continue
        rows.append({"symbol": s, "c365": round(float(cl), 3),
                     "c90": round(float(cs), 3), "shift": round(float(cs - cl), 3)})
    rows.sort(key=lambda r: r["shift"])
    dec = [r for r in rows if r["shift"] <= -min_shift][:top_n]
    rec = [r for r in rows[::-1] if r["shift"] >= min_shift][:top_n]
    return {"index": index_sym, "decoupling": dec, "recoupling": rec}


def alerts_markdown(trans: dict, edges: dict, as_of: str, index_shifts: list[dict] | None = None) -> str:
    """Plain-text weekly digest."""
    lines = [f"# Weekly rotation alerts - {as_of}", ""]
    b = trans["breadth"]
    lines.append(f"Breadth: {b['now']:.0%} of stocks with positive momentum "
                 f"({'+' if b['now'] >= b['prev'] else ''}{(b['now']-b['prev'])*100:.0f}pp vs last week)")
    lines.append("")

    by_kind: dict[str, list] = {}
    for c in trans["crossings"]:
        if c["kind"]:
            by_kind.setdefault(c["kind"], []).append(c)
    titles = {"entry": "Entries (Improving -> Leading)",
              "watch": "Watchlist (Lagging -> Improving)",
              "take-profit": "Take-profit warnings (Leading -> Weakening)",
              "exit": "Breakdowns (Weakening -> Lagging)"}
    for kind in ("entry", "watch", "take-profit", "exit"):
        items = by_kind.get(kind, [])
        lines.append(f"## {titles[kind]}")
        if items:
            for c in items:
                lines.append(f"- **{c['symbol']}** ({c['sector']}) - score {c['score']}, "
                             f"{'+' if c['week_change'] >= 0 else ''}{c['week_change']} this week")
        else:
            lines.append("- none")
        lines.append("")

    if edges["newEmerging"]:
        lines.append("## New emerging relationships")
        for e in edges["newEmerging"]:
            lines.append(f"- {e['a']} <-> {e['b']} (90d corr {e['c90']}, 365d {e['c365']})")
        lines.append("")
    if edges["newFading"]:
        lines.append("## Newly decoupling pairs")
        for e in edges["newFading"]:
            lines.append(f"- {e['a']} <-> {e['b']} (was {e['c365']} over 365d, now {e['c90']} over 90d)")
        lines.append("")

    for sh in index_shifts or []:
        if sh["decoupling"]:
            lines.append(f"## Decoupling from {sh['index']} (90d corr well below 365d)")
            for r in sh["decoupling"]:
                lines.append(f"- **{r['symbol']}** - 365d {r['c365']} -> 90d {r['c90']} ({r['shift']:+})")
            lines.append("")
        if sh["recoupling"]:
            lines.append(f"## Recoupling to {sh['index']} (being pulled back into the index trade)")
            for r in sh["recoupling"]:
                lines.append(f"- **{r['symbol']}** - 365d {r['c365']} -> 90d {r['c90']} ({r['shift']:+})")
            lines.append("")
    return "\n".join(lines)
