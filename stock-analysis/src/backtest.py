"""Walk-forward backtest of the rotation signal.

Question being tested: if you had sorted stocks into rotation quadrants
(Leading / Improving / Weakening / Lagging, from the monthly momentum score
and its 21-session change) at each rebalance date, did the quadrants
actually separate forward returns?

Method - strictly point-in-time, no lookahead:
  - every 21 trading sessions from early 2022 to (last date - 21 sessions)
  - at each rebalance t: score = M score at t, delta = score(t) - score(t-21)
    -> quadrant, using only information available at t
  - forward return = LTP(t+21) / LTP(t) - 1
  - "excess" = forward return minus the cross-sectional mean that period,
    so a trending market doesn't flatter every bucket equally

Also tests plain momentum-score deciles (top vs bottom) as a simpler
benchmark signal, and a Leading-minus-Lagging long/short spread.

Honest caveats printed with the results:
  - universe = today's F&O list -> survivorship bias (names that fell out of
    F&O over 2022-26 are missing, likely flattering absolute returns)
  - no transaction costs / slippage / borrow costs on the short leg
  - momentum scores themselves are an external vendor's calculation

Usage:
    python src/backtest.py --input data/raw/NIFTY_FO.xlsx [--outdir outputs]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd

from load_data import load_raw, momentum_panel, price_panel
from sectors import INDEX_SYMBOLS

HOLD = 21  # sessions per holding period (~1 month)

QUADRANTS = ["Leading", "Improving", "Weakening", "Lagging"]


def quadrant_of(score: pd.Series, delta: pd.Series) -> pd.Series:
    q = pd.Series(index=score.index, dtype=object)
    q[(score >= 0) & (delta >= 0)] = "Leading"
    q[(score < 0) & (delta >= 0)] = "Improving"
    q[(score >= 0) & (delta < 0)] = "Weakening"
    q[(score < 0) & (delta < 0)] = "Lagging"
    return q


def run_backtest(input_path: str) -> dict:
    df = load_raw(input_path)
    df = df[~df["Symbol"].isin(INDEX_SYMBOLS)]
    price = price_panel(df)
    m = momentum_panel(df, "M").reindex(index=price.index, columns=price.columns)

    dates = price.index
    period_rows = []          # one row per (rebalance, quadrant)
    decile_rows = []          # one row per rebalance: top/bottom decile excess
    spread_curve = []         # per rebalance: Leading mean - Lagging mean

    for t in range(HOLD, len(dates) - HOLD, HOLD):
        d0, d1 = dates[t], dates[t + HOLD]
        score = m.iloc[t]
        delta = m.iloc[t] - m.iloc[t - HOLD]
        fwd = price.iloc[t + HOLD] / price.iloc[t] - 1.0

        ok = score.notna() & delta.notna() & fwd.notna() & (price.iloc[t] > 0)
        if ok.sum() < 50:
            continue
        score, delta, fwd = score[ok], delta[ok], fwd[ok]
        xmean = fwd.mean()
        quad = quadrant_of(score, delta)

        for qname in QUADRANTS:
            members = quad == qname
            if members.sum() == 0:
                continue
            period_rows.append(
                {
                    "date": d0, "quadrant": qname, "n": int(members.sum()),
                    "fwd": float(fwd[members].mean()),
                    "excess": float(fwd[members].mean() - xmean),
                    "hit": float((fwd[members] > xmean).mean()),
                }
            )

        deciles = pd.qcut(score.rank(method="first"), 10, labels=False)
        decile_rows.append(
            {
                "date": d0,
                "top_excess": float(fwd[deciles == 9].mean() - xmean),
                "bottom_excess": float(fwd[deciles == 0].mean() - xmean),
            }
        )
        lead = fwd[quad == "Leading"].mean() if (quad == "Leading").any() else np.nan
        lag = fwd[quad == "Lagging"].mean() if (quad == "Lagging").any() else np.nan
        spread_curve.append({"date": d0, "end": d1, "spread": float(lead - lag)})

    periods = pd.DataFrame(period_rows)
    deciles = pd.DataFrame(decile_rows)
    spread = pd.DataFrame(spread_curve)

    # ---- aggregate ----
    summary = (
        periods.groupby("quadrant")
        .agg(
            periods=("date", "count"),
            avg_n=("n", "mean"),
            mean_fwd=("fwd", "mean"),
            mean_excess=("excess", "mean"),
            excess_std=("excess", "std"),
            hit_rate=("hit", "mean"),
            pct_periods_positive_excess=("excess", lambda s: (s > 0).mean()),
        )
        .reindex(QUADRANTS)
    )
    summary["t_stat_excess"] = (
        summary["mean_excess"] / (summary["excess_std"] / np.sqrt(summary["periods"]))
    )

    n_periods = len(spread)
    spread_mean = float(spread["spread"].mean())
    spread_std = float(spread["spread"].std())
    spread_tstat = spread_mean / (spread_std / np.sqrt(n_periods)) if n_periods else float("nan")
    spread_cum = float((1 + spread["spread"]).prod() - 1)
    spread_ann_sharpe = (spread_mean / spread_std) * np.sqrt(252 / HOLD) if spread_std else float("nan")

    per_year = (
        periods.assign(year=periods["date"].dt.year)
        .pivot_table(index="year", columns="quadrant", values="excess", aggfunc="mean")
        .reindex(columns=QUADRANTS)
        .round(4)
    )

    return {
        "n_rebalances": n_periods,
        "first": str(spread["date"].min().date()),
        "last": str(spread["date"].max().date()),
        "summary": summary.round(4),
        "per_year_excess": per_year,
        "decile": {
            "top_mean_excess": round(float(deciles["top_excess"].mean()), 4),
            "bottom_mean_excess": round(float(deciles["bottom_excess"].mean()), 4),
            "top_pct_positive": round(float((deciles["top_excess"] > 0).mean()), 3),
        },
        "spread": {
            "mean_per_period": round(spread_mean, 4),
            "t_stat": round(spread_tstat, 2),
            "cumulative": round(spread_cum, 3),
            "annualized_sharpe": round(spread_ann_sharpe, 2),
            "worst_period": round(float(spread["spread"].min()), 4),
            "pct_positive": round(float((spread["spread"] > 0).mean()), 3),
        },
        "spread_curve": spread,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="data/raw/NIFTY_FO.xlsx")
    parser.add_argument("--outdir", default="outputs")
    args = parser.parse_args()

    res = run_backtest(args.input)

    print(f"\nWalk-forward backtest: {res['n_rebalances']} monthly rebalances, "
          f"{res['first']} -> {res['last']} (hold {HOLD} sessions)\n")
    print("Forward returns by rotation quadrant (excess = vs. universe mean that period):")
    print(res["summary"].to_string())
    print("\nMean excess by year:")
    print(res["per_year_excess"].to_string())
    print("\nMomentum-score deciles (simpler benchmark signal):")
    print(f"  top decile mean excess:    {res['decile']['top_mean_excess']:+.2%} "
          f"(positive in {res['decile']['top_pct_positive']:.0%} of periods)")
    print(f"  bottom decile mean excess: {res['decile']['bottom_mean_excess']:+.2%}")
    print("\nLeading-minus-Lagging long/short spread:")
    s = res["spread"]
    print(f"  mean {s['mean_per_period']:+.2%}/period · t-stat {s['t_stat']} · "
          f"cumulative {s['cumulative']:+.1%} · ann. Sharpe {s['annualized_sharpe']} · "
          f"worst period {s['worst_period']:+.2%} · positive {s['pct_positive']:.0%} of periods")
    print("\nCaveats: survivorship bias (today's F&O universe applied backwards), "
          "no costs/slippage, vendor-computed momentum scores.")

    out = Path(args.outdir)
    out.mkdir(parents=True, exist_ok=True)
    res["spread_curve"].to_csv(out / "backtest_spread_curve.csv", index=False)
    payload = {k: (v.to_dict() if isinstance(v, pd.DataFrame) else v)
               for k, v in res.items() if k != "spread_curve"}
    with open(out / "backtest_results.json", "w") as f:
        json.dump(payload, f, indent=2, default=str)
    print(f"\nWrote {out/'backtest_results.json'} and {out/'backtest_spread_curve.csv'}")


if __name__ == "__main__":
    main()
