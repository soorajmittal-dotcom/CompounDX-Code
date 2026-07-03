"""End-to-end pipeline: raw NIFTY F&O export -> relationship graph, NN
embeddings/clusters, sector strength ranking, and an HTML dashboard.

Usage:
    python src/main.py --input data/raw/NIFTY_FO.xlsx --outdir outputs --lookback-days 365
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

from dashboard import build_dashboard_html
from embeddings import build_embeddings, cluster_embeddings, outlier_stocks, sector_cluster_agreement
from load_data import daily_returns, load_raw, price_panel
from relationships import build_graph, centrality_table, communities, correlation_matrix, index_exposure
from sector_strength import latest_sector_ranking, sector_strength_timeseries


def run(input_path: str, outdir: str, lookback_days: int, direct_threshold: float) -> None:
    out = Path(outdir)
    out.mkdir(parents=True, exist_ok=True)

    print(f"Loading {input_path} ...")
    df = load_raw(input_path)
    print(f"  {len(df):,} rows, {df['Symbol'].nunique()} symbols, "
          f"{df['Date'].min().date()} -> {df['Date'].max().date()}")

    price = price_panel(df)
    returns_full = daily_returns(price)
    cutoff = returns_full.index.max() - pd.Timedelta(days=lookback_days)
    returns = returns_full[returns_full.index >= cutoff]
    print(f"Using last {lookback_days} days ({returns.index.min().date()} -> {returns.index.max().date()}) "
          f"for the relationship graph")

    corr = correlation_matrix(returns)
    print(f"Correlation matrix: {corr.shape[0]} symbols with enough history")

    g = build_graph(corr, direct_threshold=direct_threshold)
    print(f"Graph: {g.number_of_nodes()} nodes, {g.number_of_edges()} direct edges "
          f"(|corr| >= {direct_threshold})")

    comm = communities(g)
    cent = centrality_table(g)
    idx_exp = index_exposure(returns, corr)

    print("Training autoencoder embeddings + clustering ...")
    emb = build_embeddings(corr)
    cluster_df = cluster_embeddings(emb)
    agreement = sector_cluster_agreement(cluster_df)
    outliers = outlier_stocks(cluster_df)
    print(f"  Sector/price-behavior agreement (ARI): {agreement:.3f}")
    print(f"  {len(outliers)} stocks trading 'out of sector'")

    sector_ts = sector_strength_timeseries(df, col="M")
    ranking = latest_sector_ranking(df, col="M")

    # ---- write tabular outputs ----
    cent.to_csv(out / "centrality.csv", index=False)
    idx_exp.round(4).to_csv(out / "index_exposure.csv")
    cluster_df.assign(community=cluster_df["Symbol"].map(comm)).to_csv(out / "clusters.csv", index=False)
    outliers.to_csv(out / "sector_outliers.csv", index=False)
    ranking.to_csv(out / "sector_ranking.csv", index=False)

    summary = {
        "as_of": str(df["Date"].max().date()),
        "n_symbols": int(df["Symbol"].nunique()),
        "n_direct_edges": int(g.number_of_edges()),
        "sector_price_agreement_ari": round(agreement, 4),
        "n_out_of_sector_stocks": int(len(outliers)),
        "top_5_strongest_sectors": ranking.head(5).to_dict("records"),
        "top_5_weakest_sectors": ranking.tail(5).to_dict("records"),
        "top_10_hub_stocks": cent.head(10)["Symbol"].tolist(),
    }
    with open(out / "summary.json", "w") as f:
        json.dump(summary, f, indent=2, default=str)

    print("Building dashboard ...")
    build_dashboard_html(
        g=g, emb=emb, cluster_df=cluster_df, sector_ts=sector_ts,
        sector_ranking=ranking, agreement_score=agreement, outliers=outliers,
        index_exposure=idx_exp, out_path=str(out / "dashboard.html"),
    )
    print(f"Done. Outputs written to {out}/")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="data/raw/NIFTY_FO.xlsx")
    parser.add_argument("--outdir", default="outputs")
    parser.add_argument("--lookback-days", type=int, default=365)
    parser.add_argument("--direct-threshold", type=float, default=0.55)
    args = parser.parse_args()
    run(args.input, args.outdir, args.lookback_days, args.direct_threshold)
