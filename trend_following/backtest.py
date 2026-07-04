"""Portfolio-level backtest engine for the trend-following strategies.

Every open trade gets the same fixed notional ("equal-weight, fixed
unit per signal", no volatility-based sizing). A cap on concurrent
positions models finite capital: once `max_positions` slots are full,
new signals are skipped until a slot frees up. Positions already open
are never displaced by new signals.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import pandas as pd


@dataclass
class Trade:
    symbol: str
    direction: int  # 1 long, -1 short
    entry_date: pd.Timestamp
    entry_price: float
    exit_date: pd.Timestamp
    exit_price: float
    capital: float

    @property
    def pnl(self) -> float:
        return self.capital * self.direction * (self.exit_price / self.entry_price - 1)

    @property
    def return_pct(self) -> float:
        return self.direction * (self.exit_price / self.entry_price - 1)


@dataclass
class BacktestResult:
    equity_curve: pd.Series
    daily_pnl: pd.Series
    trades: list[Trade]
    stats: dict = field(default_factory=dict)

    def trades_frame(self) -> pd.DataFrame:
        if not self.trades:
            return pd.DataFrame(
                columns=["symbol", "direction", "entry_date", "entry_price",
                         "exit_date", "exit_price", "capital", "pnl", "return_pct"]
            )
        return pd.DataFrame([{
            "symbol": t.symbol,
            "direction": "LONG" if t.direction == 1 else "SHORT",
            "entry_date": t.entry_date,
            "entry_price": t.entry_price,
            "exit_date": t.exit_date,
            "exit_price": t.exit_price,
            "capital": t.capital,
            "pnl": t.pnl,
            "return_pct": t.return_pct,
        } for t in self.trades])


def _cap_positions(raw_pos: pd.DataFrame, max_positions: int) -> pd.DataFrame:
    """Zero out signals beyond the concurrent-position cap. Deterministic
    priority: symbols are considered in column order for new entries;
    already-active symbols are never bumped."""
    dates = raw_pos.index
    symbols = list(raw_pos.columns)
    arr = raw_pos.to_numpy()
    capped = np.zeros_like(arr)
    active = set()

    for i in range(len(dates)):
        row = arr[i]
        for j, sym in enumerate(symbols):
            if sym in active and row[j] == 0:
                active.discard(sym)
        if len(active) < max_positions:
            for j, sym in enumerate(symbols):
                if len(active) >= max_positions:
                    break
                if row[j] != 0 and sym not in active:
                    active.add(sym)
        for j, sym in enumerate(symbols):
            if sym in active:
                capped[i, j] = row[j]

    return pd.DataFrame(capped, index=dates, columns=symbols)


def run_backtest(
    close_panel: pd.DataFrame,
    strategy_fn,
    strategy_params: dict | None = None,
    initial_capital: float = 1_000_000.0,
    max_positions: int = 20,
    min_history: int = 250,
) -> BacktestResult:
    strategy_params = strategy_params or {}
    symbols = [s for s in close_panel.columns if close_panel[s].notna().sum() >= min_history]

    raw_pos = pd.DataFrame(0.0, index=close_panel.index, columns=symbols)
    for sym in symbols:
        series = close_panel[sym].dropna()
        pos = strategy_fn(series, **strategy_params)
        raw_pos.loc[pos.index, sym] = pos

    raw_pos = raw_pos.reindex(columns=sorted(symbols)).fillna(0.0)
    capped_pos = _cap_positions(raw_pos, max_positions)

    capital_per_position = initial_capital / max_positions
    daily_return = close_panel[capped_pos.columns].pct_change().fillna(0.0)
    executed_pos = capped_pos.shift(1).fillna(0.0)  # one-day execution lag
    daily_pnl = (capital_per_position * executed_pos * daily_return).sum(axis=1)
    equity_curve = initial_capital + daily_pnl.cumsum()

    trades: list[Trade] = []
    for sym in capped_pos.columns:
        col = capped_pos[sym]
        prev = 0.0
        entry_date = None
        entry_price = None
        direction = 0
        for date, val in col.items():
            if prev == 0 and val != 0:
                entry_date, entry_price, direction = date, close_panel.loc[date, sym], int(val)
            elif prev != 0 and val == 0:
                exit_date, exit_price = date, close_panel.loc[date, sym]
                trades.append(Trade(sym, direction, entry_date, entry_price,
                                     exit_date, exit_price, capital_per_position))
            prev = val
        if prev != 0:
            exit_date, exit_price = col.index[-1], close_panel.loc[col.index[-1], sym]
            trades.append(Trade(sym, direction, entry_date, entry_price,
                                 exit_date, exit_price, capital_per_position))

    stats = compute_stats(equity_curve, daily_pnl, trades, initial_capital)
    return BacktestResult(equity_curve, daily_pnl, trades, stats)


def compute_stats(equity_curve: pd.Series, daily_pnl: pd.Series, trades: list[Trade],
                   initial_capital: float) -> dict:
    if equity_curve.empty:
        return {}
    years = (equity_curve.index[-1] - equity_curve.index[0]).days / 365.25
    total_return = equity_curve.iloc[-1] / initial_capital - 1
    cagr = (equity_curve.iloc[-1] / initial_capital) ** (1 / years) - 1 if years > 0 else np.nan

    running_max = equity_curve.cummax()
    drawdown = equity_curve / running_max - 1
    max_drawdown = drawdown.min()

    daily_ret = daily_pnl / initial_capital
    sharpe = (daily_ret.mean() / daily_ret.std() * np.sqrt(252)) if daily_ret.std() > 0 else np.nan

    pnls = np.array([t.pnl for t in trades])
    wins = pnls[pnls > 0]
    losses = pnls[pnls <= 0]
    win_rate = len(wins) / len(pnls) if len(pnls) else np.nan
    profit_factor = wins.sum() / abs(losses.sum()) if losses.sum() != 0 else np.nan

    return {
        "total_return_pct": total_return * 100,
        "cagr_pct": cagr * 100 if not np.isnan(cagr) else np.nan,
        "max_drawdown_pct": max_drawdown * 100,
        "sharpe": sharpe,
        "num_trades": len(trades),
        "win_rate_pct": win_rate * 100 if not np.isnan(win_rate) else np.nan,
        "profit_factor": profit_factor,
        "avg_trade_return_pct": np.mean([t.return_pct for t in trades]) * 100 if trades else np.nan,
    }
