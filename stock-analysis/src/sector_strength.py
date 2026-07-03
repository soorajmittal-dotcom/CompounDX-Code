"""Sector-level roll-up of the per-stock momentum scores (D/W/M/Q).

This is one layer of the analysis (not the primary one) - the relationship
graph in relationships.py / embeddings.py is what surfaces direct + indirect
stock-to-stock and stock-to-index links regardless of sector.
"""

from __future__ import annotations

import pandas as pd

from sectors import get_sector


def add_sector_columns(df: pd.DataFrame) -> pd.DataFrame:
    sectors = df["Symbol"].map(lambda s: get_sector(s)[0])
    out = df.copy()
    out["sector"] = sectors
    return out


def sector_strength_timeseries(df: pd.DataFrame, col: str = "M") -> pd.DataFrame:
    """Mean momentum score per sector per date (excludes index rows)."""
    tagged = add_sector_columns(df)
    tagged = tagged[tagged["sector"] != "Index"]
    ts = tagged.groupby(["Date", "sector"])[col].mean().unstack("sector")
    return ts.sort_index()


def latest_sector_ranking(df: pd.DataFrame, col: str = "M") -> pd.DataFrame:
    ts = sector_strength_timeseries(df, col)
    latest_date = ts.index.max()
    latest = ts.loc[latest_date].sort_values(ascending=False)
    prior_idx = ts.index[ts.index <= latest_date - pd.Timedelta(days=30)]
    trend = pd.Series(dtype=float)
    if len(prior_idx):
        prior = ts.loc[prior_idx.max()]
        trend = (latest - prior).rename("change_30d")
    out = latest.rename(f"{col}_score").to_frame()
    if len(trend):
        out = out.join(trend)
    out.index.name = "sector"
    return out.reset_index()
