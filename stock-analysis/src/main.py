"""End-to-end pipeline: raw NIFTY F&O export -> analysis.json + dashboard.

The analysis is organized around decisions rather than descriptions:

  1. Rotation quadrants (strength vs. 1-month change) per sector and stock
  2. Relationship stability: pairs strong at 90d AND 365d (stable), only
     recently (emerging), or only historically (fading)
  3. Per-stock explorer data: direct partners, indirect "behavioral twins"
     from the autoencoder latent space, and index exposure

Usage:
    python src/main.py --input data/raw/NIFTY_FO.xlsx --outdir outputs
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

from dashboard import build_dashboard_html
from embeddings import build_embeddings, cluster_embeddings, latent_neighbors, sector_cluster_agreement
from load_data import daily_returns, load_raw, price_panel
from relationships import classify_edges, correlation_matrix, index_exposure
from rotation import sector_rotation, stock_rotation
from sector_strength import sector_strength_timeseries
from sectors import INDEX_SYMBOLS, get_sector
from macro import macro_alert_lines, macro_snapshot, measured_sensitivities
from transitions import alerts_markdown, edge_changes, index_relationship_shifts, quadrant_transitions

LONG_WINDOW = 365
SHORT_WINDOW = 90
EDGE_THRESHOLD = 0.55


def build_analysis(input_path: str) -> dict:
    print(f"Loading {input_path} ...")
    df = load_raw(input_path)
    as_of = df["Date"].max()
    print(f"  {len(df):,} rows, {df['Symbol'].nunique()} symbols, "
          f"{df['Date'].min().date()} -> {as_of.date()}")

    price = price_panel(df)
    returns = daily_returns(price)
    r_long = returns[returns.index >= as_of - pd.Timedelta(days=LONG_WINDOW)]
    r_short = returns[returns.index >= as_of - pd.Timedelta(days=SHORT_WINDOW)]

    corr_long = correlation_matrix(r_long, min_obs=120)
    corr_short = correlation_matrix(r_short, min_obs=40)
    print(f"Correlations: {corr_long.shape[0]} symbols @ {LONG_WINDOW}d, "
          f"{corr_short.shape[0]} @ {SHORT_WINDOW}d")

    edges = classify_edges(corr_long, corr_short, threshold=EDGE_THRESHOLD)
    tag_counts = edges["tag"].value_counts().to_dict()
    print(f"Edges: {len(edges)} strong pairs -> {tag_counts}")

    # ---- what changed vs a week ago ----
    print("Computing week-over-week transitions ...")
    trans = quadrant_transitions(df, lookback_sessions=5)
    dates_all = sorted(df["Date"].unique())
    prev_asof = pd.Timestamp(dates_all[-6]) if len(dates_all) > 6 else as_of
    r_long_prev = returns[(returns.index >= prev_asof - pd.Timedelta(days=LONG_WINDOW)) & (returns.index <= prev_asof)]
    r_short_prev = returns[(returns.index >= prev_asof - pd.Timedelta(days=SHORT_WINDOW)) & (returns.index <= prev_asof)]
    edges_prev = classify_edges(
        correlation_matrix(r_long_prev, min_obs=120),
        correlation_matrix(r_short_prev, min_obs=40),
        threshold=EDGE_THRESHOLD,
    )
    edge_delta = edge_changes(edges, edges_prev)
    idx_shifts = [
        index_relationship_shifts(corr_long, corr_short, "NIFTY"),
        index_relationship_shifts(corr_long, corr_short, "BANKNIFTY"),
    ]
    n_action = sum(1 for c in trans["crossings"] if c["kind"])
    print(f"  {n_action} actionable crossings, {len(edge_delta['newEmerging'])} new emerging pairs")

    # ---- rotation ----
    stock_rot = stock_rotation(df, score_col="M", delta_sessions=21)
    stock_rot = stock_rot[~stock_rot["Symbol"].isin(INDEX_SYMBOLS)]
    sector_rot = sector_rotation(stock_rot)

    # ---- embeddings: behavioral twins beyond direct correlation ----
    print("Training autoencoder embeddings ...")
    emb = build_embeddings(corr_long)
    cluster_df = cluster_embeddings(emb)
    agreement = sector_cluster_agreement(cluster_df)
    print(f"  sector/price-behavior agreement (ARI): {agreement:.3f}")

    direct_short: dict[str, set[str]] = {}
    for _, e in edges.iterrows():
        if e["tag"] in ("stable", "emerging"):
            direct_short.setdefault(e["a"], set()).add(e["b"])
            direct_short.setdefault(e["b"], set()).add(e["a"])
    twins = latent_neighbors(emb, exclude=direct_short, k=5)

    # ---- index exposure ----
    idx_exp = index_exposure(r_long, corr_long)

    # ---- per-stock explorer payload ----
    momentum_latest = (
        df.sort_values("Date").groupby("Symbol")[["D", "W", "M", "Q"]].last()
    )
    edge_lookup: dict[str, list[dict]] = {}
    for _, e in edges.iterrows():
        for me, other in ((e["a"], e["b"]), (e["b"], e["a"])):
            edge_lookup.setdefault(me, []).append(
                {"sym": other, "c90": e["corr_short"], "c365": e["corr_long"], "tag": e["tag"]}
            )
    for sym in edge_lookup:
        edge_lookup[sym].sort(key=lambda d: -abs(d["c90"] if d["c90"] is not None else 0))

    stocks = {}
    for sym in corr_long.columns:
        if sym in INDEX_SYMBOLS:
            continue
        sector, industry = get_sector(sym)
        mom = momentum_latest.loc[sym] if sym in momentum_latest.index else None
        rot_row = stock_rot[stock_rot["Symbol"] == sym]
        stocks[sym] = {
            "sector": sector,
            "industry": industry,
            "momentum": {c: (None if mom is None or pd.isna(mom[c]) else float(mom[c])) for c in "DWMQ"},
            "score": None if rot_row.empty else float(rot_row["score"].iloc[0]),
            "delta": None if rot_row.empty else float(rot_row["delta"].iloc[0]),
            "quadrant": None if rot_row.empty else rot_row["quadrant"].iloc[0],
            "partners": edge_lookup.get(sym, [])[:10],
            "twins": [{"sym": s, "sim": v} for s, v in twins.get(sym, [])],
            "corrNifty": _f(idx_exp, sym, "corr_NIFTY"),
            "betaNifty": _f(idx_exp, sym, "beta_NIFTY"),
            "corrBank": _f(idx_exp, sym, "corr_BANKNIFTY"),
            "betaBank": _f(idx_exp, sym, "beta_BANKNIFTY"),
        }

    # ---- sector strength history (monthly) ----
    sector_ts = sector_strength_timeseries(df, col="M").resample("MS").mean().round(1)

    # ---- market breadth tiles ----
    breadth = float((stock_rot["score"] >= 0).mean())
    med_delta = float(stock_rot["delta"].median())

    top_stable = (
        edges[edges["tag"] == "stable"]
        .assign(strength=lambda d: d[["corr_long", "corr_short"]].abs().min(axis=1))
        .sort_values("strength", ascending=False)
        .head(25)
    )
    top_stable = top_stable.assign(
        cross_sector=[get_sector(a)[0] != get_sector(b)[0] for a, b in zip(top_stable["a"], top_stable["b"])]
    )

    return {
        "asOf": str(as_of.date()),
        "windows": {"long": LONG_WINDOW, "short": SHORT_WINDOW, "threshold": EDGE_THRESHOLD},
        "tiles": {
            "nStocks": int(len(stocks)),
            "breadth": round(breadth, 3),
            "medianDelta": round(med_delta, 1),
            "edgeCounts": {k: int(v) for k, v in tag_counts.items()},
            "agreementARI": round(agreement, 3),
        },
        "transitions": trans,
        "edgeChanges": edge_delta,
        "indexShifts": idx_shifts,
        "macro": {
            **macro_snapshot(),
            "measured": measured_sensitivities(
                r_long, {s: get_sector(s)[0] for s in corr_long.columns if s not in INDEX_SYMBOLS}
            ),
        },
        "sectorRotation": sector_rot.to_dict("records"),
        "stockRotation": stock_rot.drop(columns=["industry"]).to_dict("records"),
        "stocks": stocks,
        "topStablePairs": top_stable[["a", "b", "corr_long", "corr_short", "cross_sector"]].to_dict("records"),
        "sectorHeatmap": {
            "months": [d.strftime("%Y-%m") for d in sector_ts.index],
            "sectors": list(sector_ts.columns),
            "values": [[None if pd.isna(v) else float(v) for v in sector_ts[c]] for c in sector_ts.columns],
        },
    }


def _f(frame: pd.DataFrame, sym: str, col: str):
    try:
        v = frame.loc[sym, col]
        return None if pd.isna(v) else round(float(v), 3)
    except KeyError:
        return None


def run(input_path: str, outdir: str) -> None:
    out = Path(outdir)
    out.mkdir(parents=True, exist_ok=True)
    analysis = build_analysis(input_path)

    with open(out / "analysis.json", "w") as f:
        json.dump(analysis, f, separators=(",", ":"))
    print(f"analysis.json: {(out / 'analysis.json').stat().st_size / 1024:.0f} KB")

    digest = alerts_markdown(
        analysis["transitions"], analysis["edgeChanges"], analysis["asOf"], analysis["indexShifts"]
    )
    macro_lines = macro_alert_lines(analysis["macro"])
    if macro_lines:
        digest += "\n## Macro flags\n" + "\n".join(macro_lines) + "\n"
    (out / "alerts.md").write_text(digest)

    build_dashboard_html(analysis, str(out / "dashboard.html"))
    print(f"dashboard.html: {(out / 'dashboard.html').stat().st_size / 1024:.0f} KB")
    print(f"Done. Outputs in {out}/")


def default_input() -> str:
    """Prefer the compact parquet committed to the repo (survives fresh
    clones); fall back to the raw xlsx export."""
    here = Path(__file__).parent.parent
    parquet = here / "data" / "NIFTY_FO.parquet"
    return str(parquet) if parquet.exists() else str(here / "data" / "raw" / "NIFTY_FO.xlsx")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=default_input())
    parser.add_argument("--outdir", default="outputs")
    args = parser.parse_args()
    run(args.input, args.outdir)
