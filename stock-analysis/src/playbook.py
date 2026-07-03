"""Generate the team playbook: backtest results, trading rules, and a
section-by-section reading guide for the rotation terminal.

Regenerated on every refresh so the backtest numbers always reflect the
full data in the current export.

Usage:
    python src/playbook.py [--input data/NIFTY_FO.parquet] [--outdir outputs]
"""

from __future__ import annotations

import argparse
from pathlib import Path

from backtest import HOLD, run_backtest
from main import default_input

CSS = """
<style>
  :root {
    --bg:#0A0D12; --surface:#11151D; --surface-2:#171C26; --border:#242B38;
    --text:#E8ECF3; --dim:#97A1B3; --faint:#5B6478; --accent:#4F8CFF;
    --good:#199e70; --warn:#c98500; --bad:#e66767; --blue:#3987e5;
    --sans:ui-sans-serif,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    --mono:ui-monospace,"SFMono-Regular","Cascadia Mono",Consolas,monospace;
  }
  * { box-sizing:border-box; }
  html { background:var(--bg); }
  body { background:var(--bg); color:var(--dim); font-family:var(--sans);
         margin:0; padding:36px clamp(16px,5vw,56px) 80px; line-height:1.62; font-size:14.5px; }
  .wrap { max-width:820px; margin:0 auto; }
  .eyebrow { font-family:var(--mono); font-size:11.5px; letter-spacing:.15em; color:var(--accent); margin:0 0 8px; }
  h1 { color:var(--text); font-size:clamp(22px,3.4vw,30px); font-weight:650; margin:0 0 8px; letter-spacing:-.01em; text-wrap:balance; }
  h2 { color:var(--text); font-size:17px; font-weight:650; margin:44px 0 10px; display:flex; align-items:center; gap:9px; }
  h2::before { content:""; width:3px; height:15px; background:var(--accent); border-radius:2px; }
  h3 { color:var(--text); font-size:14px; font-weight:600; margin:22px 0 6px; }
  p { max-width:72ch; margin:10px 0; }
  li { margin:5px 0; max-width:70ch; }
  b, strong { color:var(--text); font-weight:600; }
  .lede { font-size:15.5px; color:var(--dim); }
  .asof { font-family:var(--mono); font-size:12px; color:var(--faint); margin-top:10px; }
  .callout { background:var(--surface); border:1px solid var(--border); border-left:3px solid var(--accent);
             border-radius:8px; padding:14px 18px; margin:16px 0; }
  .callout.warn { border-left-color:var(--warn); }
  .callout.bad { border-left-color:var(--bad); }
  .callout.good { border-left-color:var(--good); }
  table { border-collapse:collapse; width:100%; font-size:13px; font-variant-numeric:tabular-nums; margin:14px 0; }
  th { text-align:left; font:10.5px var(--mono); letter-spacing:.07em; text-transform:uppercase; color:var(--faint);
       background:var(--surface-2); padding:8px 11px; border-bottom:1px solid var(--border); }
  td { padding:8px 11px; border-bottom:1px solid var(--border); }
  td:first-child { color:var(--text); font-weight:500; }
  tr:last-child td { border-bottom:none; }
  .table-wrap { overflow-x:auto; border:1px solid var(--border); border-radius:8px; background:var(--surface); margin:14px 0; }
  .table-wrap table { margin:0; }
  .pos { color:var(--good); } .neg { color:var(--bad); }
  .chip { display:inline-block; font:10px var(--mono); letter-spacing:.05em; text-transform:uppercase;
          padding:2px 8px; border-radius:99px; border:1px solid; margin-right:4px; }
  .chip.g { color:var(--good); border-color:var(--good); }
  .chip.b { color:var(--blue); border-color:var(--blue); }
  .chip.w { color:var(--warn); border-color:var(--warn); }
  .chip.r { color:var(--bad); border-color:var(--bad); }
  .dodont { display:grid; grid-template-columns:1fr; gap:14px; margin:16px 0; }
  @media (min-width:720px){ .dodont { grid-template-columns:1fr 1fr; } }
  .dodont > div { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:14px 18px; }
  .dodont h3 { margin-top:0; font-family:var(--mono); font-size:11px; letter-spacing:.1em; text-transform:uppercase; }
  .dodont .do h3, .do h3 { color:var(--good); }
  .dodont .dont h3, .dont h3 { color:var(--bad); }
  .dodont ul { margin:8px 0 0; padding-left:18px; }
  code { font-family:var(--mono); font-size:12.5px; background:var(--surface-2); border:1px solid var(--border);
         border-radius:4px; padding:1px 5px; color:var(--text); }
  .spark { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:14px; margin:14px 0; }
  footer { margin-top:56px; color:var(--faint); font-size:12px; border-top:1px solid var(--border); padding-top:16px; max-width:72ch; }
</style>
"""


def spread_svg(spread_df) -> str:
    """Cumulative Leading-minus-Lagging equity curve as a small inline SVG."""
    curve, acc = [], 1.0
    for _, r in spread_df.iterrows():
        acc *= 1 + r["spread"]
        curve.append((r["date"], acc))
    W, H, ML, MB = 760, 190, 46, 24
    ys = [v for _, v in curve]
    y0, y1 = min(ys) * 0.98, max(ys) * 1.02
    n = len(curve)
    sx = lambda i: ML + i / (n - 1) * (W - ML - 10)
    sy = lambda v: 10 + (1 - (v - y0) / (y1 - y0)) * (H - MB - 10)
    pts = " ".join(f"{sx(i):.1f},{sy(v):.1f}" for i, (_, v) in enumerate(curve))
    yrs, seen = [], set()
    for i, (d, _) in enumerate(curve):
        if d.year not in seen:
            seen.add(d.year)
            yrs.append((i, d.year))
    s = f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="Cumulative Leading minus Lagging spread" style="width:100%;height:auto">'
    for gv in (1.0, (y0 + y1) / 2, y1 * 0.99):
        s += f'<line x1="{ML}" y1="{sy(gv):.1f}" x2="{W-10}" y2="{sy(gv):.1f}" stroke="#242B38" stroke-width="1"/>'
        s += f'<text x="{ML-6}" y="{sy(gv)+3:.1f}" fill="#5B6478" font-size="9.5" font-family="monospace" text-anchor="end">{gv:.2f}</text>'
    for i, yr in yrs[1:]:
        s += f'<text x="{sx(i):.1f}" y="{H-6}" fill="#5B6478" font-size="9.5" font-family="monospace" text-anchor="middle">{yr}</text>'
    s += f'<polyline points="{pts}" fill="none" stroke="#199e70" stroke-width="2"/>'
    fx, fv = sx(n - 1), curve[-1][1]
    s += f'<circle cx="{fx:.1f}" cy="{sy(fv):.1f}" r="3.5" fill="#199e70"/>'
    s += f'<text x="{fx-6:.1f}" y="{sy(fv)-9:.1f}" fill="#E8ECF3" font-size="11" font-family="monospace" text-anchor="end">{(fv-1)*100:+.0f}%</text>'
    s += "</svg>"
    return s


def pct(v, d=2):
    return f"{v*100:+.{d}f}%"


def build_playbook(input_path: str) -> str:
    res = run_backtest(input_path)
    s = res["summary"]
    sp = res["spread"]
    dec = res["decile"]
    py = res["per_year_excess"]

    quad_rows = ""
    chip = {"Leading": "g", "Improving": "b", "Weakening": "w", "Lagging": "r"}
    for q in s.index:
        r = s.loc[q]
        cls = "pos" if r["mean_excess"] > 0 else "neg"
        quad_rows += (
            f'<tr><td><span class="chip {chip[q]}">{q}</span></td>'
            f'<td>{r["avg_n"]:.0f}</td><td>{pct(r["mean_fwd"])}</td>'
            f'<td class="{cls}">{pct(r["mean_excess"])}</td>'
            f'<td>{r["hit_rate"]*100:.0f}%</td><td>{r["t_stat_excess"]:.2f}</td></tr>'
        )

    year_head = "".join(f"<th>{q}</th>" for q in py.columns)
    year_rows = ""
    for yr, row in py.iterrows():
        cells = "".join(
            f'<td class="{"pos" if (v or 0) > 0 else "neg"}">{pct(v)}</td>' if v == v else "<td>–</td>"
            for v in row
        )
        year_rows += f"<tr><td>{yr}</td>{cells}</tr>"

    html = f"""{CSS}
<div class="wrap">
<header>
  <p class="eyebrow">NIFTY F&amp;O ROTATION TERMINAL · TEAM PLAYBOOK</p>
  <h1>System rules, backtest evidence, and how to read the terminal</h1>
  <p class="lede">This document is regenerated with every data refresh, so the backtest numbers below always
    cover the full history in the current export. Read it once end-to-end before using the terminal;
    after that, the daily workflow is the <b>What changed this week</b> section plus these rules.</p>
  <p class="asof">Backtest window: {res['first']} → {res['last']} · {res['n_rebalances']} rebalances ·
    hold {HOLD} sessions (~1 month) · universe = current F&amp;O list</p>
</header>

<h2>1 · The system in one paragraph</h2>
<p>Every stock gets a momentum score (the vendor's D/W/M/Q relative-strength numbers, signed around zero).
Two things about that score matter: <b>where it is</b> (strength) and <b>which way it's moving</b>
(its change over 21 sessions). That splits the universe into four quadrants —
<span class="chip g">Leading</span> strong &amp; rising,
<span class="chip w">Weakening</span> strong but rolling over,
<span class="chip b">Improving</span> weak but turning up,
<span class="chip r">Lagging</span> weak &amp; falling.
The evidence says the money is made at the <b>transitions between quadrants</b>, and lost by holding
Lagging names. Correlation analysis (what moves with what, and with NIFTY/BANKNIFTY) is the risk overlay:
it tells you when five positions are secretly one bet, and when a stock has stopped trading on its own story.</p>

<h2>2 · Backtest evidence</h2>
<p>Method: strictly point-in-time. Every 21 sessions since Feb&nbsp;2022, stocks are sorted into quadrants using
only data available that day; we then measure the next 21 sessions' return against the universe average
("excess"). No lookahead, no fitting — this is the simplest honest test of the idea.</p>

<div class="table-wrap"><table>
<thead><tr><th>Quadrant</th><th>Avg # stocks</th><th>Mean fwd return</th><th>Mean excess</th><th>Hit rate</th><th>t-stat</th></tr></thead>
<tbody>{quad_rows}</tbody></table></div>

<p><b>How to read this:</b> the ordering is exactly what the theory predicts — Leading best, Lagging worst,
about {pct(s.loc['Leading','mean_excess'] - s.loc['Lagging','mean_excess'], 1)} of monthly separation between them.
A hypothetical long-Leading / short-Lagging portfolio made <b>{pct(sp['mean_per_period'])} per period</b>
({sp['cumulative']*100:+.0f}% cumulative, Sharpe ≈ {sp['annualized_sharpe']}, positive in {sp['pct_positive']*100:.0f}%
of periods, worst single period {pct(sp['worst_period'])}). The simpler top-vs-bottom momentum decile shows the
same picture: top decile {pct(dec['top_mean_excess'])}, bottom {pct(dec['bottom_mean_excess'])} per period.</p>

<div class="spark">{spread_svg(res['spread_curve'])}
<p style="margin:8px 0 0;font-size:12px;color:var(--faint)">Cumulative Leading-minus-Lagging spread, one point per rebalance. Note the drawdowns — this is a tilt, not a money machine.</p></div>

<h3>By year (mean excess per period)</h3>
<div class="table-wrap"><table>
<thead><tr><th>Year</th>{year_head}</tr></thead>
<tbody>{year_rows}</tbody></table></div>

<div class="callout warn"><b>Statistical honesty.</b> The Leading t-stat is {s.loc['Leading','t_stat_excess']:.2f} —
right direction, but on ~{res['n_rebalances']} periods this is a <b>tendency, not a certainty</b>. Three biases all
flatter these numbers: <b>survivorship</b> (today's F&amp;O list applied backwards — stocks that fell out are missing),
<b>zero costs</b> (real slippage would eat a meaningful part of ~0.7%/month), and vendor-computed scores.
Treat the system as a <b>tilt and a filter</b>: it improves the odds of what you pick and stops you holding
deteriorating names. It is not a standalone strategy to be levered.</div>

<h2>3 · Trading rules</h2>
<p>These follow mechanically from the backtest. The terminal surfaces the candidates every refresh in
<b>What changed this week</b>; these rules say what to do with them.</p>

<h3>Signal rules</h3>
<ul>
  <li><b>New longs come from the Entries list</b> (Improving → Leading crossings). Before acting, open the stock
      in the explorer and check: (a) its sector is not in the Lagging quadrant, (b) it isn't just a high-beta
      index proxy (corr to NIFTY &gt; 0.8 with beta &gt; 1.3 means you're buying the index with extra risk).</li>
  <li><b>The Watchlist (Lagging → Improving) is not a buy list.</b> It's where next month's entries come from.
      Track it; act only when a name crosses into Leading, or when the whole sector turns (3+ names from one
      sector on the watchlist together — like a cement pack — is a sector-rotation signal worth more than any single name).</li>
  <li><b>Take-profit list (Leading → Weakening): trim, don't necessarily exit.</b> Strong names wobble. But a
      position appearing here two refreshes in a row, or with a large negative weekly change, gets reduced.</li>
  <li><b>Breakdowns (Weakening → Lagging) are exits.</b> The backtest's clearest result is that Lagging
      underperforms ({pct(s.loc['Lagging','mean_excess'])}/period, hit rate {s.loc['Lagging','hit_rate']*100:.0f}%).
      Never initiate a long in Lagging; don't hold one hoping it turns — wait for it to earn its way back through Improving.</li>
</ul>

<h3>Risk rules (the correlation overlay)</h3>
<ul>
  <li><b>Count bets, not positions.</b> Before adding a name, check its direct partners and behavioral twins in
      the explorer. If it's stable-linked (corr ≥ 0.7) to something you already hold, you are adding size to an
      existing bet, not diversifying.</li>
  <li><b>Size by beta.</b> A beta-1.6 name and a beta-0.7 name are different position sizes for the same conviction.
      Beta to NIFTY/BANKNIFTY is in the explorer for every stock.</li>
  <li><b>Respect decoupling alerts.</b> A stock decoupling from NIFTY is trading on its own story — that cuts both
      ways: your index hedge won't protect it, and index moves won't carry it. Recoupling means the individual
      story is fading; momentum entries on recoupling names are usually just index beta.</li>
  <li><b>Watch breadth for regime.</b> Breadth (tile at the top of the terminal) above ~60% with positive drift =
      rotation signals are trustworthy. Breadth collapsing toward 30–40% = correlations are rising, everything is
      one trade, and this tool's stock-level signals matter less than index-level decisions.</li>
</ul>

<h3>Discipline rules</h3>
<ul>
  <li>The signal horizon is <b>~21 sessions</b>. This is a monthly-rhythm system checked daily for transitions —
      not an intraday tool. Acting on every daily wiggle will churn away the edge.</li>
  <li>Expect to be wrong ~45% of the time on individual names (hit rates above). The edge is portfolio-level
      and shows up over quarters, not weeks.</li>
  <li>When the terminal and your fundamental view disagree, that's information, not a malfunction — the terminal
      measures money flow, not value. A great business in Lagging just means the market isn't paying for it <i>yet</i>.</li>
</ul>

<h2>4 · How to read each section of the terminal</h2>

<h3>Header tiles</h3>
<p><b>Breadth</b> = share of stocks with positive momentum; <b>21-session drift</b> = median momentum change
(market direction); <b>Relationships</b> = count of stable / emerging / fading pairs. Read these first —
they set how much to trust everything below (see regime rule above).</p>

<h3>What changed this week</h3>
<p>The action section — four tables of quadrant crossings (the rules in §3 map one-to-one onto them) plus
index decoupling/recoupling shifts. Symbols are clickable and open the explorer. If you read one section per
day, read this one.</p>
<div class="dodont">
<div class="do"><h3>Do</h3><ul><li>Cross-check every entry candidate in the explorer before acting</li>
<li>Treat 3+ names from one sector appearing together as a sector signal</li></ul></div>
<div class="dont"><h3>Don't</h3><ul><li>Buy the Watchlist — it's early, that's the point</li>
<li>Panic-exit on a single Take-profit appearance; look for persistence</li></ul></div>
</div>

<h3>Sector rotation quadrant</h3>
<p>Each bubble is a sector (size = member count). Position tells you the sector's state; the interesting
reads are sectors near a boundary — about to cross zero on either axis. Top-right far corner = crowded
strength (late); top-left = early strength (where next quarter's leaders come from).</p>

<h3>Stock rotation quadrant</h3>
<p>Same picture, every stock. Use the search box to locate a holding instantly, the sector filter to see a
theme's internal dispersion (a "strong" sector where half the members are Weakening is weaker than it looks).
Click any dot to open it in the explorer.</p>

<h3>Stock explorer</h3>
<p>One stock's full profile: momentum term structure (D/W/M/Q — a positive M with a negative D/W means a
strong trend having a bad week; all four negative is a downtrend, not a dip), direct partners with stability
tags, behavioral twins (indirect relationships — names that behave alike without moving together daily;
this is where hidden portfolio overlap shows up), and index correlation/beta for sizing and hedging.</p>

<h3>Strongest stable relationships</h3>
<p>The structural backbone — pairs holding ≥0.55 correlation in both the 365-day and 90-day windows.
Uses: hedging (short the partner instead of the index), substitution (the partner with the better quadrant),
and divergence watching (a stable pair gapping apart = a trade or a warning).
<span class="chip" style="color:var(--accent);border-color:var(--accent)">cross-sector</span> pairs are
relationships sector labels would never show you.</p>

<h3>Sector strength history</h3>
<p>The heatmap gives the regime memory: how long the current leaders have been leading. A sector green for
18+ months is a mature trend (trim into strength); one flipping red→green in the last 2–3 columns is a fresh
rotation (the ones worth chasing). Sustained whole-map color shifts mark regime changes.</p>

<h2>5 · Master do &amp; don't</h2>
<div class="dodont">
<div class="do"><h3>Do</h3><ul>
<li>Check the as-of date before every use — signals from stale data are noise</li>
<li>Read tiles → What changed → explorer, in that order</li>
<li>Enter through Improving → Leading crossings; exit through Weakening → Lagging</li>
<li>Count behavioral bets via twins/partners before adding a position</li>
<li>Size by beta; hedge with stable partners</li>
<li>Judge the system on quarters of portfolio results, not single names</li>
</ul></div>
<div class="dont"><h3>Don't</h3><ul>
<li>Don't initiate longs in Lagging, ever — the backtest's strongest result</li>
<li>Don't treat correlation as causation or as a lead-lag prediction</li>
<li>Don't lever the long/short spread — Sharpe ≈ {sp['annualized_sharpe']} before costs doesn't survive leverage and slippage</li>
<li>Don't override the 21-session horizon with intraday reactions</li>
<li>Don't trust sector labels over behavior — several names are mapped best-effort and the market disagrees with the official sector for dozens of stocks</li>
<li>Don't use this as the only input — it measures flow, not fundamentals, news, or valuations</li>
</ul></div>
</div>

<h2>6 · Data &amp; refresh</h2>
<p>The terminal refreshes <b>daily at 08:00 IST</b> when a new vendor export has been provided; the as-of date
in the header tiles is the truth about freshness. Momentum scores (D/W/M/Q) come from the vendor export;
prices (LTP) drive the correlation work. The universe is the current F&amp;O list (~216 names + NIFTY,
BANKNIFTY, CNXMIDCAP, NIFTYFINSERVICE as first-class nodes).</p>

<footer><b>Disclaimer:</b> internal research and decision-support tooling, not investment advice. Backtest
results are hypothetical, gross of all costs, affected by survivorship bias, and past relationships —
statistical or otherwise — do not guarantee future ones. Every rule above is a probabilistic tilt observed
over {res['n_rebalances']} periods, not a certainty. Positions, sizing, and risk remain human decisions.</footer>
</div>
"""
    return html


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=default_input())
    parser.add_argument("--outdir", default="outputs")
    args = parser.parse_args()
    out = Path(args.outdir)
    out.mkdir(parents=True, exist_ok=True)
    html = build_playbook(args.input)
    (out / "playbook.html").write_text(html)
    print(f"playbook.html: {(out / 'playbook.html').stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
