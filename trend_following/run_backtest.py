"""CLI entry point: run Turtle and Seykota trend-following backtests over
the NIFTY F&O universe and produce a comparison report.

Usage:
    python -m trend_following.run_backtest
"""
from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

from trend_following.backtest import run_backtest
from trend_following.data_loader import DEFAULT_DATA_PATH, load_close_panel
from trend_following.strategies import STRATEGIES

OUTPUT_DIR = Path(__file__).parent / "output"

STRATEGY_PARAMS = {
    "turtle": dict(entry_window=20, exit_window=10, stop_atr_mult=2.0, allow_short=True),
    "seykota": dict(fast=50, slow=200, stop_atr_mult=3.0, allow_short=True),
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_PATH)
    parser.add_argument("--initial-capital", type=float, default=1_000_000.0)
    parser.add_argument("--max-positions", type=int, default=20)
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(exist_ok=True)
    close_panel = load_close_panel(args.data)
    print(f"Loaded {close_panel.shape[1]} symbols, {close_panel.shape[0]} trading days "
          f"({close_panel.index.min().date()} to {close_panel.index.max().date()})")

    summary_rows = []
    for name, strategy_fn in STRATEGIES.items():
        params = STRATEGY_PARAMS[name]
        print(f"\nRunning {name} strategy with params {params} ...")
        result = run_backtest(
            close_panel, strategy_fn, params,
            initial_capital=args.initial_capital,
            max_positions=args.max_positions,
        )

        trades_path = OUTPUT_DIR / f"{name}_trades.csv"
        result.trades_frame().to_csv(trades_path, index=False)

        equity_path = OUTPUT_DIR / f"{name}_equity_curve.png"
        plt.figure(figsize=(10, 5))
        result.equity_curve.plot(title=f"{name.title()} strategy — equity curve")
        plt.ylabel("Equity (INR)")
        plt.tight_layout()
        plt.savefig(equity_path)
        plt.close()

        stats = {"strategy": name, **result.stats}
        summary_rows.append(stats)
        print(f"  trades:        {stats['num_trades']}")
        print(f"  total return:  {stats['total_return_pct']:.1f}%")
        print(f"  CAGR:          {stats['cagr_pct']:.1f}%")
        print(f"  max drawdown:  {stats['max_drawdown_pct']:.1f}%")
        print(f"  sharpe:        {stats['sharpe']:.2f}")
        print(f"  win rate:      {stats['win_rate_pct']:.1f}%")
        print(f"  profit factor: {stats['profit_factor']:.2f}")
        print(f"  -> trades saved to {trades_path}")
        print(f"  -> equity curve saved to {equity_path}")

    summary = pd.DataFrame(summary_rows).set_index("strategy")
    summary_path = OUTPUT_DIR / "summary.csv"
    summary.to_csv(summary_path)
    print(f"\nSummary comparison written to {summary_path}:\n")
    print(summary.round(2).to_string())


if __name__ == "__main__":
    main()
