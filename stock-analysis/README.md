# NIFTY F&O Rotation & Relationship Terminal

Standalone Python pipeline (separate from the Next.js app in this repo) that
turns a NIFTY F&O daily export — `{Date, Symbol, LTP, D, W, M, Q}` where
D/W/M/Q are relative-strength momentum scores — into a decision-oriented
dashboard: where money is rotating, and what moves with what, across 216
stocks and the NIFTY / BANKNIFTY / CNXMIDCAP / NIFTYFINSERVICE benchmarks.

## The three analyses

1. **Rotation quadrants** (`rotation.py`) — the D/W/M/Q columns are already
   relative-strength scores, so the classic rotation read falls straight out:
   x = current monthly score (strength), y = change over 21 sessions
   (direction). Strong & rising = *Leading*, strong & falling = *Weakening*,
   weak & rising = *Improving*, weak & falling = *Lagging*. Computed per
   stock and aggregated per sector.

2. **Relationship stability** (`relationships.py`) — pairwise return
   correlations at two windows (365d and 90d). Pairs strong in both are
   **stable** (structural); strong recently with a clear long-window gap are
   **emerging** (new theme / regime change); strong historically but
   decoupled recently are **fading**. The gap requirements matter — without
   them a pair at 0.56/0.54 straddling the cutoff gets flagged as a regime
   change when it's just noise.

3. **Indirect relationships via a neural net** (`embeddings.py`) — each
   stock's correlation fingerprint (its row in the correlation matrix) is
   compressed by a small bottleneck autoencoder; nearest neighbours in the
   latent space *that are not direct correlation partners* are its
   "behavioral twins" — indirectly related names the correlation graph
   can't see. Index symbols are regular nodes throughout, so stock↔index
   relationships come from the same machinery.

## Running it

```bash
cd stock-analysis
pip install -r requirements.txt
python src/main.py --input data/raw/NIFTY_FO.xlsx --outdir outputs
```

Outputs:
- `outputs/dashboard.html` — self-contained interactive page (~200 KB, no
  external dependencies): sector + stock rotation quadrants with
  search/filter, a per-stock explorer (momentum term structure, direct
  partners with stability tags, behavioral twins, index correlation/beta),
  the strongest stable pairs, and a sector-strength history heatmap.
- `outputs/analysis.json` — the full computed payload, if you want to build
  something else on top of it.

The dashboard charts are hand-rolled SVG/canvas (template in
`src/template.html`, data injected by `src/dashboard.py`) — an earlier
plotly version weighed 5 MB and failed to open reliably.

## Known limitations / highest-leverage next steps

- **`src/sectors.py` is a best-effort NSE sector map**, not an official
  master file. Recently listed/demerged names (`TMPV`, `LTM`, `GVT&D`,
  `VMM`, `PREMIERENE`, `WAAREEENER`, `SAMMAANCAP`) are educated guesses.
- **Price + momentum only.** F&O open interest, volume, and delivery %
  would sharpen both "relationship" and "strength" — the highest-leverage
  data addition if available.
- **Co-movement, not causality.** A stable pair tells you two names move
  together, not which one leads. A lead-lag / cross-correlation-at-lag pass
  would be the natural next analysis if directionality matters.
- Correlation windows (365d/90d) and the 0.55 edge threshold are set in
  `main.py` constants; the emerging/fading gap rules are in
  `relationships.classify_edges`.
