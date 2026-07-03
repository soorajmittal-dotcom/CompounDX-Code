"""Load the raw NIFTY F&O export into a tidy long-format DataFrame."""

from pathlib import Path

import pandas as pd


def load_raw(path: str | Path) -> pd.DataFrame:
    """Read the {Date, Symbol, LTP, D, W, M, Q} export.

    D/W/M/Q are momentum/relative-strength scores over daily/weekly/monthly/
    quarterly lookbacks (roughly -500..+500), not returns.
    """
    path = Path(path)
    if path.suffix == ".parquet":
        df = pd.read_parquet(path)
    else:
        df = pd.read_excel(path, sheet_name=0)
    df.columns = [str(c).strip() for c in df.columns]
    df = df.rename(columns={df.columns[1]: "Symbol"})
    df["Date"] = pd.to_datetime(df["Date"])
    for col in ("LTP", "D", "W", "M", "Q"):
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna(subset=["Symbol", "LTP"]).copy()
    df = df.sort_values(["Symbol", "Date"]).reset_index(drop=True)
    return df


def price_panel(df: pd.DataFrame) -> pd.DataFrame:
    """Wide Date x Symbol panel of LTP (forward-filled for sparse listings)."""
    panel = df.pivot(index="Date", columns="Symbol", values="LTP").sort_index()
    return panel


def momentum_panel(df: pd.DataFrame, col: str) -> pd.DataFrame:
    """Wide Date x Symbol panel for one of the D/W/M/Q momentum columns."""
    panel = df.pivot(index="Date", columns="Symbol", values=col).sort_index()
    return panel


def daily_returns(price: pd.DataFrame) -> pd.DataFrame:
    return price.pct_change().replace([float("inf"), float("-inf")], pd.NA)
