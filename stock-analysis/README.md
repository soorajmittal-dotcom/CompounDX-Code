# Stock / Index Relationship Analysis

Standalone Python pipeline (kept separate from the `src/` Next.js app in this
repo) that turns a NIFTY F&O daily export into a relationship graph across
stocks *and* indices (NIFTY, BANKNIFTY, CNXMIDCAP, NIFTYFINSERVICE), plus a
sector-strength view layered on top.

The organizing idea is deliberately **not** "group everything by sector."
The core deliverable is a correlation-based graph where every stock and
every index is a node, so a stock's relationships to other stocks and to
the benchmarks fall out of the same structure — direct links (price
co-movement above a threshold) and indirect links (connected through shared
neighbours / shared latent behavior, even with no direct correlation).
Sector labels are used only as an overlay/coloring, and to check where price
behavior *disagrees* with the official sector a stock is filed under.

## What it does

1. **`load_data.py`** — reads the raw `{Date, Symbol, LTP, D, W, M, Q}` export.
   `D/W/M/Q` are momentum/relative-strength scores (roughly -500..+500) over
   daily/weekly/monthly/quarterly lookbacks, not returns.
2. **`relationships.py`** — builds a correlation matrix of daily returns
   across all 216 stocks + the 4 index symbols, then:
   - **direct graph**: an edge where `|correlation| >= threshold`
   - **indirect relationships**: multi-hop neighbours in that graph, and
     `greedy_modularity_communities` (natural groupings implied purely by
     co-movement, independent of sector labels)
   - **index exposure**: each stock's correlation + beta to NIFTY and BANKNIFTY
   - **centrality**: which stocks are "hub" names sitting in the middle of
     the relationship web vs. more isolated movers
3. **`embeddings.py`** — the neural-network piece. Each stock's row in the
   correlation matrix (its "fingerprint" of how it relates to everything
   else) is compressed through a small bottleneck autoencoder
   (`sklearn.neural_network.MLPRegressor`) into ~8 latent dimensions, then
   clustered with KMeans. Two stocks land close together if they *behave*
   alike, even without being directly correlated with each other — this is
   what captures the "indirect relationship" the graph misses on its own.
   We also compute the Adjusted Rand Index between these price-behavior
   clusters and the official sector labels, and list stocks whose cluster
   is dominated by a different sector than their own ("trading out of
   sector").
4. **`sector_strength.py`** — a secondary, simpler view: mean `M` momentum
   score per sector per date, current ranking, and 30-day change.
5. **`dashboard.py` / `main.py`** — runs the whole thing and writes a
   self-contained `outputs/dashboard.html` (network graph, embedding
   scatter, sector heatmap/ranking, index-correlation tables) plus CSV/JSON
   outputs for further analysis.

## Running it

```bash
cd stock-analysis
pip install -r requirements.txt
python src/main.py --input data/raw/NIFTY_FO.xlsx --outdir outputs --lookback-days 365
```

Key flags:
- `--lookback-days` — how much recent history to use for the correlation
  graph (default 365; relationships between stocks are not stationary, so a
  full 4.5-year correlation would blur regime changes — e.g. IT stocks'
  relationship to NIFTY today isn't the same as in 2022).
- `--direct-threshold` — minimum `|correlation|` to draw a direct edge
  (default 0.55).

Outputs land in `outputs/`:
- `dashboard.html` — the interactive view
- `centrality.csv` — hub-ness of each stock in the relationship graph
- `index_exposure.csv` — correlation/beta of every stock to NIFTY & BANKNIFTY
- `clusters.csv` — price-behavior cluster + community per stock
- `sector_outliers.csv` — stocks trading unlike their official sector
- `sector_ranking.csv` — current sector strength ranking
- `summary.json` — headline numbers

## Known limitations / what would materially improve this

- **`src/sectors.py` is a best-effort NSE sector map**, filled in from
  general knowledge, not an official NSE master file. A few recently
  listed/demerged names (`TMPV`, `LTM`, `GVT&D`, `VMM`, `PREMIERENE`,
  `WAAREEENER`, `SAMMAANCAP`, `NAM-INDIA`) are educated guesses — worth
  spot-checking if sector-level conclusions matter to a decision.
- **Only price + momentum score, no volume/OI/fundamentals.** F&O open
  interest and volume would meaningfully sharpen "relationship" and
  "strength" — right now everything is inferred from price co-movement
  alone. If you have OI/volume/delivery-% data for the same symbols, that's
  the highest-leverage next addition.
- **Correlation is regime-dependent.** The `--lookback-days` window matters
  a lot; worth re-running at a few window lengths (90/180/365) and looking
  at which links are stable vs. which appear/disappear — those are
  different signals (structural relationship vs. transient co-movement).
- **This is inference from co-movement, not causality.** "Stock A and Stock
  B are related" here means "they moved together" — it doesn't tell you
  which one leads, or why. If decision-making needs directionality (e.g.
  does a BANKNIFTY move predict a specific stock a day later), that needs a
  lead-lag / Granger-causality pass, which isn't in this version.
- The autoencoder is intentionally small (sklearn `MLPRegressor`, no GPU/
  PyTorch) given ~216 stocks × ~4 features — this is the right scale for
  this amount of data; a bigger deep model would just overfit.
