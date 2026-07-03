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
    # a period can lack Leading or Lagging members entirely -> NaN spread
    spread = pd.DataFrame(spread_curve).dropna(subset=["spread"]).reset_index(drop=True)

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


def conviction_backtest(input_path: str, top_n: int = 15, short_n: int = 10) -> dict:
    """Walk-forward test of the conviction leaderboard as displayed.

    Point-in-time version of the score (alignment + quadrant + freshness +
    sector support; the live partner-confirmation component is omitted
    because correlations at every historical date would be prohibitively
    slow - so the live score has one component this test doesn't cover).

    At each rebalance: build the top-N long list and top-N short list the
    same way the dashboard does, then measure forward 21-session excess
    return vs the universe mean.
    """
    df = load_raw(input_path)
    df = df[~df["Symbol"].isin(INDEX_SYMBOLS)]
    price = price_panel(df)
    panels = {c: momentum_panel(df, c).reindex(index=price.index, columns=price.columns) for c in "DWMQ"}
    from sectors import get_sector
    sector_of = {s: get_sector(s)[0] for s in price.columns}

    dates = price.index
    long_rows, short_rows = [], []
    for t in range(HOLD + 5, len(dates) - HOLD, HOLD):
        m_now = panels["M"].iloc[t]
        m_prev21 = panels["M"].iloc[t - HOLD]
        m_prev5 = panels["M"].iloc[t - 5]
        d_prev5_21 = m_prev5 - panels["M"].iloc[t - 5 - HOLD] if t - 5 - HOLD >= 0 else m_prev5 * float("nan")
        fwd = price.iloc[t + HOLD] / price.iloc[t] - 1.0
        ok = m_now.notna() & m_prev21.notna() & fwd.notna()
        if ok.sum() < 80:
            continue
        delta = m_now - m_prev21
        quad_now = quadrant_of(m_now[ok], delta[ok])
        quad_prev = quadrant_of(m_prev5[ok], d_prev5_21[ok]) if d_prev5_21.notna().any() else quad_now

        sec_series = pd.Series({s: sector_of.get(s, "?") for s in m_now[ok].index})
        sec_m = m_now[ok].groupby(sec_series).mean()
        sec_d = delta[ok].groupby(sec_series).mean()
        sec_quad = quadrant_of(sec_m, sec_d)

        scores = {}
        for sym in m_now[ok].index:
            sign = 1 if m_now[sym] >= 0 else -1
            agree = sum(1 for c in "DWMQ"
                        if pd.notna(panels[c].iloc[t].get(sym)) and sign * float(panels[c].iloc[t][sym]) > 0)
            alignment = {4: 30, 3: 20, 2: 10}.get(agree, 0)
            qmap = ({"Leading": 25, "Improving": 15, "Weakening": 5, "Lagging": 0} if sign > 0
                    else {"Lagging": 25, "Weakening": 15, "Improving": 5, "Leading": 0})
            qpts = qmap.get(quad_now.get(sym), 0)
            fresh = 0
            if sign > 0 and quad_prev.get(sym) == "Improving" and quad_now.get(sym) == "Leading":
                fresh = 15
            elif sign < 0 and quad_prev.get(sym) == "Weakening" and quad_now.get(sym) == "Lagging":
                fresh = 15
            spts = round(qmap.get(sec_quad.get(sector_of.get(sym, "?")), 0) * 15 / 25)
            scores[sym] = (sign, alignment + qpts + fresh + spts)

        xmean = fwd[ok].mean()
        longs = sorted((s for s, (sg, sc) in scores.items() if sg > 0), key=lambda s: -scores[s][1])[:top_n]
        shorts = sorted((s for s, (sg, sc) in scores.items() if sg < 0), key=lambda s: -scores[s][1])[:short_n]
        if longs:
            long_rows.append({"date": dates[t], "excess": float(fwd[longs].mean() - xmean)})
        if shorts:
            short_rows.append({"date": dates[t], "excess": float(fwd[shorts].mean() - xmean)})

    def agg(rows):
        s = pd.DataFrame(rows)["excess"]
        return {
            "periods": len(s), "mean_excess": round(float(s.mean()), 4),
            "t_stat": round(float(s.mean() / (s.std() / len(s) ** 0.5)), 2) if len(s) > 1 else None,
            "pct_positive": round(float((s > 0).mean()), 3),
        }
    return {"top_long": agg(long_rows), "top_short": agg(short_rows),
            "note": "short excess should be NEGATIVE if the short list works"}


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
    print("\nConviction leaderboard test (as displayed on the dashboard, PIT, partner component excluded):")
    cb = conviction_backtest(args.input)
    print(f"  top-15 long list:  {cb['top_long']['mean_excess']:+.2%}/period excess, "
          f"t {cb['top_long']['t_stat']}, positive {cb['top_long']['pct_positive']:.0%} of periods")
    print(f"  top-10 short list: {cb['top_short']['mean_excess']:+.2%}/period excess "
          f"(negative = shorts underperform = working), t {cb['top_short']['t_stat']}")
    res["conviction_leaderboard"] = cb

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
