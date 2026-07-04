"""Loads the NIFTY F&O price file into a per-symbol close-price panel.

The source file has one row per (date, symbol) with columns:
Date, Symbol, LTP, D, W, M, Q
D/W/M/Q are NSE-style relative-strength scores (day/week/month/quarter);
they are kept as auxiliary signals but are not required by the core
trend-following logic, which only needs the close price (LTP) series
since no OHLC data is available.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

DEFAULT_DATA_PATH = Path(__file__).parent / "data" / "NIFTY_FO.xlsx"


def load_raw(path: Path = DEFAULT_DATA_PATH) -> pd.DataFrame:
    df = pd.read_excel(path, sheet_name=0)
    df.columns = ["date", "symbol", "close", "rs_day", "rs_week", "rs_month", "rs_quarter"]
    df = df.dropna(subset=["date", "symbol", "close"])
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["symbol", "date"]).reset_index(drop=True)
    return df


def to_close_panel(df: pd.DataFrame) -> pd.DataFrame:
    """Pivot to a date x symbol matrix of close prices, forward-filled per symbol."""
    panel = df.pivot_table(index="date", columns="symbol", values="close")
    return panel.sort_index()


def load_close_panel(path: Path = DEFAULT_DATA_PATH) -> pd.DataFrame:
    return to_close_panel(load_raw(path))
