"""Pluggable trend-following signal generators.

Both strategies work off close-price-only data (no OHLC available), so
"N" (average true range) is approximated as the rolling mean of the
absolute day-over-day close change. Position is expressed per date as
+1 (long), -1 (short), 0 (flat) and is decided using data available
through that date only (no lookahead); the backtester applies a
one-day execution lag when computing P&L.
"""
from __future__ import annotations

import numpy as np
import pandas as pd


def atr_proxy(close: pd.Series, window: int = 20) -> pd.Series:
    return close.diff().abs().rolling(window).mean()


def turtle_positions(
    close: pd.Series,
    entry_window: int = 20,
    exit_window: int = 10,
    atr_window: int = 20,
    stop_atr_mult: float = 2.0,
    allow_short: bool = True,
) -> pd.Series:
    """Classic Turtle System 1 style: N-day Donchian breakout entry,
    opposite M-day channel exit, plus a fixed 2N stop-loss from entry.
    """
    high_channel = close.shift(1).rolling(entry_window).max()
    low_channel = close.shift(1).rolling(entry_window).min()
    exit_high = close.shift(1).rolling(exit_window).max()
    exit_low = close.shift(1).rolling(exit_window).min()
    atr = atr_proxy(close, atr_window)

    n = len(close)
    pos = np.zeros(n)
    current = 0
    stop_price = np.nan
    c = close.to_numpy()
    hc, lc = high_channel.to_numpy(), low_channel.to_numpy()
    eh, el = exit_high.to_numpy(), exit_low.to_numpy()
    a = atr.to_numpy()

    for i in range(n):
        if current == 0:
            if not np.isnan(hc[i]) and c[i] > hc[i]:
                current = 1
                stop_price = c[i] - stop_atr_mult * a[i] if not np.isnan(a[i]) else -np.inf
            elif allow_short and not np.isnan(lc[i]) and c[i] < lc[i]:
                current = -1
                stop_price = c[i] + stop_atr_mult * a[i] if not np.isnan(a[i]) else np.inf
        elif current == 1:
            channel_exit = not np.isnan(el[i]) and c[i] < el[i]
            stop_hit = c[i] < stop_price
            if channel_exit or stop_hit:
                current = 0
        elif current == -1:
            channel_exit = not np.isnan(eh[i]) and c[i] > eh[i]
            stop_hit = c[i] > stop_price
            if channel_exit or stop_hit:
                current = 0
        pos[i] = current

    return pd.Series(pos, index=close.index, name="position")


def seykota_positions(
    close: pd.Series,
    fast: int = 50,
    slow: int = 200,
    atr_window: int = 20,
    stop_atr_mult: float = 3.0,
    allow_short: bool = True,
) -> pd.Series:
    """Long-term MA-crossover trend following in the Seykota mold: stay
    with the trend defined by fast/slow MA relationship, protected by
    an ATR trailing stop that ratchets in the direction of the trade
    (never loosens) rather than a fixed exit channel.
    """
    fast_ma = close.rolling(fast).mean()
    slow_ma = close.rolling(slow).mean()
    atr = atr_proxy(close, atr_window)

    n = len(close)
    pos = np.zeros(n)
    current = 0
    stop_price = np.nan
    c = close.to_numpy()
    fm, sm, a = fast_ma.to_numpy(), slow_ma.to_numpy(), atr.to_numpy()

    for i in range(n):
        if np.isnan(fm[i]) or np.isnan(sm[i]):
            pos[i] = current
            continue
        bullish = fm[i] > sm[i]
        bearish = fm[i] < sm[i]

        if current == 0:
            if bullish:
                current = 1
                stop_price = c[i] - stop_atr_mult * a[i] if not np.isnan(a[i]) else -np.inf
            elif allow_short and bearish:
                current = -1
                stop_price = c[i] + stop_atr_mult * a[i] if not np.isnan(a[i]) else np.inf
        elif current == 1:
            if not np.isnan(a[i]):
                stop_price = max(stop_price, c[i] - stop_atr_mult * a[i])
            if bearish or c[i] < stop_price:
                current = 0
        elif current == -1:
            if not np.isnan(a[i]):
                stop_price = min(stop_price, c[i] + stop_atr_mult * a[i])
            if bullish or c[i] > stop_price:
                current = 0
        pos[i] = current

    return pd.Series(pos, index=close.index, name="position")


STRATEGIES = {
    "turtle": turtle_positions,
    "seykota": seykota_positions,
}
