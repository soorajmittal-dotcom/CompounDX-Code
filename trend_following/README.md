# Trend Following Backtest (Turtle / Seykota style)

Backtests two classic trend-following systems over the NIFTY F&O
universe (216 symbols, daily close, 2022–2026), using the price data
in `data/NIFTY_FO.xlsx`.

## Data

The source file has one row per (date, symbol): `Date, Symbol, LTP, D, W, M, Q`.
Only `Date`/`Symbol`/`LTP` (close price) are used by the strategies —
there's no OHLC in the file, so ATR ("N" in turtle terms) is
approximated as the rolling mean of the absolute daily close-to-close
change. `D/W/M/Q` are NSE-style relative-strength scores and are
loaded but not currently used by the signal logic.

## Strategies (`strategies.py`)

- **`turtle_positions`** — classic Donchian breakout: enter long on a
  close above the prior 20-day high, enter short on a close below the
  prior 20-day low; exit on the opposite 10-day channel or a fixed
  stop at 2N from entry. One unit per signal (no pyramiding).
- **`seykota_positions`** — long-term MA trend: long while the 50-day
  MA is above the 200-day MA (short in the opposite case), protected
  by an ATR trailing stop that only ratchets in the trade's favor
  (never loosens) — closer to Seykota's "ride the trend until it
  ends" style than a fixed exit channel.

Both are long/short (futures allow shorting) and decide today's
position from data available through today; the backtester applies a
one-day execution lag before computing P&L.

## Backtest engine (`backtest.py`)

Portfolio-level simulation, not per-symbol in isolation:

- **Equal-weight, fixed unit per signal** — every open trade gets the
  same fixed notional (`initial_capital / max_positions`), no
  volatility-based position sizing.
- **`max_positions`** caps concurrent open trades to model finite
  capital. Once full, new signals are skipped (not queued) until a
  slot frees up; existing positions are never displaced.
- Produces a daily mark-to-market equity curve, a full trade log, and
  summary stats: total return, CAGR, max drawdown, Sharpe, win rate,
  profit factor.

## Running it

```bash
pip install -r trend_following/requirements.txt
python -m trend_following.run_backtest
```

Flags: `--data <path>` (defaults to the bundled file), `--initial-capital`,
`--max-positions` (default 20).

Outputs go to `trend_following/output/` (gitignored — regenerate by
rerunning):
- `<strategy>_trades.csv` — full trade log
- `<strategy>_equity_curve.png` — equity curve chart
- `summary.csv` — side-by-side stats for both strategies

## Caveats

- Close-only data means entries/exits/ATR are all approximations of
  what a real turtle/Seykota system would compute from intraday
  highs/lows — treat results as directional, not exact.
- Fixed capital-per-slot is non-compounding within a trade but the
  portfolio equity curve does compound across time as P&L accrues.
- No transaction costs, slippage, margin, or F&O contract-specific
  mechanics (lot sizes, expiries, rollover) are modeled — this trades
  the underlying cash price series as a proxy for the futures.
