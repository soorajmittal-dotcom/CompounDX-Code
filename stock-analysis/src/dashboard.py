"""Self-contained Plotly HTML dashboard for the relationship analysis.

Design: committed to a single dark "instrument panel" theme (a trading-
terminal aesthetic fits a live market-relationship view better than a
document that has to work in both light and dark reading contexts) so
every chart is themed to match rather than sitting on a mismatched white
card.
"""

from __future__ import annotations

import networkx as nx
import pandas as pd
import plotly.graph_objects as go
from sklearn.decomposition import PCA

# ---- design tokens ----------------------------------------------------
BG = "#0A0D12"
SURFACE = "#11151D"
SURFACE_2 = "#171C26"
BORDER = "#242B38"
TEXT = "#E8ECF3"
TEXT_DIM = "#97A1B3"
TEXT_FAINT = "#5B6478"
ACCENT = "#4F8CFF"
GOOD = "#35C08A"
BAD = "#F0594A"
WARN = "#E8A33D"
FONT_SANS = 'ui-sans-serif, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
FONT_MONO = 'ui-monospace, "SFMono-Regular", "Cascadia Mono", Consolas, "Liberation Mono", monospace'

SECTOR_PALETTE = [
    "#5B9BD5", "#F2A65A", "#E2685A", "#5FC9BF", "#7FC97F", "#F2D06B",
    "#C08FD6", "#F595A6", "#C9A27E", "#9AA5B1", "#B58863", "#4FC3D9",
    "#B0B8C4", "#D9D25C", "#8CB8E8", "#F4B876", "#A8E0A0", "#F4A5A3",
    "#D6BEE8", "#D6B7A3", "#F6C6DC",
]


def _sector_color_map(sectors: list[str]) -> dict[str, str]:
    uniq = sorted(set(sectors))
    return {s: SECTOR_PALETTE[i % len(SECTOR_PALETTE)] for i, s in enumerate(uniq)}


def _themed(fig: go.Figure, height: int, title: str) -> go.Figure:
    fig.update_layout(
        title=dict(text=title, font=dict(size=15, color=TEXT, family=FONT_SANS), x=0),
        height=height,
        paper_bgcolor=SURFACE,
        plot_bgcolor=SURFACE,
        font=dict(color=TEXT_DIM, family=FONT_SANS, size=12),
        legend=dict(font=dict(color=TEXT_DIM, size=11), bgcolor="rgba(0,0,0,0)"),
        margin=dict(l=16, r=16, t=48, b=16),
        hoverlabel=dict(bgcolor=SURFACE_2, font=dict(color=TEXT, family=FONT_MONO)),
    )
    return fig


def network_figure(g: nx.Graph, seed: int = 0) -> go.Figure:
    pos = nx.spring_layout(g, k=1.4 / max(len(g) ** 0.5, 1), seed=seed, weight="weight")
    sectors = [g.nodes[n]["sector"] for n in g.nodes()]
    color_map = _sector_color_map(sectors)

    edge_x, edge_y = [], []
    for a, b in g.edges():
        x0, y0 = pos[a]
        x1, y1 = pos[b]
        edge_x += [x0, x1, None]
        edge_y += [y0, y1, None]
    edge_trace = go.Scatter(
        x=edge_x, y=edge_y, mode="lines",
        line=dict(width=0.4, color="rgba(151,161,179,0.25)"),
        hoverinfo="none", showlegend=False,
    )

    traces = [edge_trace]
    for sector in sorted(color_map):
        nodes = [n for n in g.nodes() if g.nodes[n]["sector"] == sector]
        traces.append(
            go.Scatter(
                x=[pos[n][0] for n in nodes],
                y=[pos[n][1] for n in nodes],
                mode="markers+text" if any(g.nodes[n]["is_index"] for n in nodes) else "markers",
                text=[n if g.nodes[n]["is_index"] else "" for n in nodes],
                textposition="top center",
                textfont=dict(color=TEXT, size=11, family=FONT_MONO),
                marker=dict(
                    size=[18 if g.nodes[n]["is_index"] else 6 + 1.5 * g.degree(n) for n in nodes],
                    color=color_map[sector],
                    line=dict(width=1, color=SURFACE),
                    symbol=["diamond" if g.nodes[n]["is_index"] else "circle" for n in nodes],
                ),
                name=sector,
                hovertext=[f"{n} &middot; {sector}" for n in nodes],
                hoverinfo="text",
            )
        )

    fig = go.Figure(data=traces)
    fig.update_layout(showlegend=True, xaxis=dict(visible=False), yaxis=dict(visible=False))
    return _themed(fig, 760, "RELATIONSHIP NETWORK &mdash; direct co-movement links (&#9670; = index)")


def embedding_scatter(emb: pd.DataFrame, cluster_df: pd.DataFrame) -> go.Figure:
    pca = PCA(n_components=2, random_state=0)
    xy = pca.fit_transform(emb.values)
    plot_df = pd.DataFrame(xy, index=emb.index, columns=["x", "y"]).reset_index(names="Symbol")
    plot_df = plot_df.merge(cluster_df, on="Symbol", how="left")
    color_map = _sector_color_map(plot_df["sector"].fillna("Index").tolist())

    fig = go.Figure()
    for sector, sub in plot_df.groupby(plot_df["sector"].fillna("Index")):
        fig.add_trace(
            go.Scatter(
                x=sub["x"], y=sub["y"], mode="markers", name=sector,
                marker=dict(size=9, color=color_map.get(sector, "#999"), line=dict(width=1, color=SURFACE)),
                text=sub["Symbol"] + " &middot; cluster " + sub["cluster"].astype("Int64").astype(str),
                hoverinfo="text",
            )
        )
    fig.update_layout(
        xaxis=dict(title="component 1", gridcolor=BORDER, zerolinecolor=BORDER),
        yaxis=dict(title="component 2", gridcolor=BORDER, zerolinecolor=BORDER),
    )
    return _themed(fig, 620, "PRICE-BEHAVIOR EMBEDDING &mdash; autoencoder latent space (PCA), colored by official sector")


def sector_heatmap(ts: pd.DataFrame) -> go.Figure:
    monthly = ts.resample("MS").mean()
    fig = go.Figure(
        data=go.Heatmap(
            z=monthly.values.T,
            x=monthly.index.strftime("%Y-%m"),
            y=monthly.columns,
            colorscale=[[0, BAD], [0.5, SURFACE_2], [1, GOOD]],
            zmid=0,
            colorbar=dict(title=dict(text="momentum", font=dict(color=TEXT_DIM)), tickfont=dict(color=TEXT_DIM)),
        )
    )
    fig.update_layout(
        xaxis=dict(gridcolor=BORDER), yaxis=dict(gridcolor=BORDER, autorange="reversed"),
    )
    return _themed(fig, 600, "SECTOR STRENGTH OVER TIME &mdash; monthly avg. momentum score")


def sector_ranking_bar(ranking: pd.DataFrame, score_col: str) -> go.Figure:
    ranking = ranking.sort_values(score_col)
    colors = [BAD if v < 0 else GOOD for v in ranking[score_col]]
    fig = go.Figure(go.Bar(x=ranking[score_col], y=ranking["sector"], orientation="h", marker_color=colors))
    fig.update_layout(
        xaxis=dict(gridcolor=BORDER, zerolinecolor=TEXT_FAINT), yaxis=dict(gridcolor=BORDER),
    )
    return _themed(fig, 560, "CURRENT SECTOR RANKING &mdash; latest monthly momentum score")


def _df_table(df: pd.DataFrame, index: bool = False) -> str:
    return df.to_html(index=index, border=0, classes="datatable", escape=True)


def _stat_tile(label: str, value: str, sub: str = "", tone: str = "") -> str:
    tone_class = f" tone-{tone}" if tone else ""
    sub_html = f"<div class='tile-sub'>{sub}</div>" if sub else ""
    return (
        f"<div class='tile'><div class='tile-label'>{label}</div>"
        f"<div class='tile-value{tone_class}'>{value}</div>{sub_html}</div>"
    )


def build_dashboard_html(
    g: nx.Graph,
    emb: pd.DataFrame,
    cluster_df: pd.DataFrame,
    sector_ts: pd.DataFrame,
    sector_ranking: pd.DataFrame,
    agreement_score: float,
    outliers: pd.DataFrame,
    index_exposure: pd.DataFrame,
    out_path: str,
    as_of: str = "",
    lookback_days: int = 365,
) -> None:
    fig1 = network_figure(g)
    fig2 = embedding_scatter(emb, cluster_df)
    fig3 = sector_heatmap(sector_ts)
    fig4 = sector_ranking_bar(sector_ranking, "M_score")

    top_bank = index_exposure.sort_values("corr_BANKNIFTY", ascending=False).head(10)
    top_nifty = index_exposure.sort_values("corr_NIFTY", ascending=False).head(10)

    agreement_word = "weak" if agreement_score < 0.35 else ("moderate" if agreement_score < 0.6 else "strong")

    style = f"""
<style>
  :root {{
    --bg: {BG}; --surface: {SURFACE}; --surface-2: {SURFACE_2}; --border: {BORDER};
    --text: {TEXT}; --text-dim: {TEXT_DIM}; --text-faint: {TEXT_FAINT};
    --accent: {ACCENT}; --good: {GOOD}; --bad: {BAD}; --warn: {WARN};
    --font-sans: {FONT_SANS}; --font-mono: {FONT_MONO};
  }}
  * {{ box-sizing: border-box; }}
  body {{
    background: var(--bg); color: var(--text-dim); font-family: var(--font-sans);
    margin: 0; padding: 32px clamp(16px, 4vw, 48px) 64px; line-height: 1.5;
  }}
  .wrap {{ max-width: 1180px; margin: 0 auto; }}
  header {{ margin-bottom: 28px; }}
  .eyebrow {{
    font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.14em;
    color: var(--accent); text-transform: uppercase; margin: 0 0 8px;
  }}
  h1 {{
    color: var(--text); font-size: clamp(22px, 3vw, 30px); font-weight: 600;
    margin: 0 0 6px; text-wrap: balance; letter-spacing: -0.01em;
  }}
  .subtitle {{ color: var(--text-faint); font-size: 14px; max-width: 720px; margin: 0; }}
  .tiles {{
    display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1px; background: var(--border); border: 1px solid var(--border);
    border-radius: 8px; overflow: hidden; margin: 28px 0;
  }}
  .tile {{ background: var(--surface); padding: 16px 18px; }}
  .tile-label {{
    font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--text-faint); margin-bottom: 8px;
  }}
  .tile-value {{
    font-family: var(--font-mono); font-variant-numeric: tabular-nums;
    font-size: 22px; color: var(--text); font-weight: 600;
  }}
  .tile-value.tone-good {{ color: var(--good); }}
  .tile-value.tone-bad {{ color: var(--bad); }}
  .tile-value.tone-warn {{ color: var(--warn); }}
  .tile-sub {{ font-size: 11.5px; color: var(--text-faint); margin-top: 4px; }}
  section {{ margin-top: 40px; }}
  .card {{
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
    padding: 8px; margin-bottom: 20px;
  }}
  .note {{ color: var(--text-faint); font-size: 13px; max-width: 760px; margin: 10px 2px 16px; }}
  .cols {{ display: grid; grid-template-columns: 1fr; gap: 20px; }}
  @media (min-width: 900px) {{ .cols-2 {{ grid-template-columns: 1fr 1fr; }} }}
  h2 {{
    color: var(--text); font-size: 16px; font-weight: 600; margin: 0 0 4px;
    display: flex; align-items: center; gap: 8px;
  }}
  h2::before {{ content: ""; width: 3px; height: 15px; background: var(--accent); border-radius: 2px; display: inline-block; }}
  h3 {{ color: var(--text); font-size: 13px; font-weight: 600; margin: 0 0 8px; }}
  .table-wrap {{ overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }}
  table.datatable {{ border-collapse: collapse; width: 100%; font-size: 13px; }}
  table.datatable th {{
    text-align: left; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--text-faint); background: var(--surface-2);
    padding: 9px 12px; border-bottom: 1px solid var(--border); white-space: nowrap;
  }}
  table.datatable td {{
    padding: 8px 12px; border-bottom: 1px solid var(--border); color: var(--text-dim);
    font-variant-numeric: tabular-nums; white-space: nowrap;
  }}
  table.datatable td:first-child, table.datatable th:first-child {{ color: var(--text); font-weight: 500; }}
  table.datatable tr:last-child td {{ border-bottom: none; }}
  table.datatable tr:hover td {{ background: var(--surface-2); }}
  footer {{ margin-top: 48px; color: var(--text-faint); font-size: 12px; border-top: 1px solid var(--border); padding-top: 16px; }}
</style>
"""

    parts = [style, "<div class='wrap'>", "<header>",
             "<p class='eyebrow'>NIFTY F&amp;O UNIVERSE &middot; RELATIONSHIP TERMINAL</p>",
             "<h1>Stock &amp; index relationship analysis</h1>",
             "<p class='subtitle'>Direct and indirect co-movement across the F&amp;O universe and the "
             "NIFTY / BANKNIFTY / CNXMIDCAP / NIFTYFINSERVICE benchmarks, plus where price behavior "
             "agrees or disagrees with official sector labels.</p>",
             "</header>"]

    parts.append("<div class='tiles'>")
    parts.append(_stat_tile("As of", as_of or "&mdash;"))
    parts.append(_stat_tile("Universe", str(g.number_of_nodes()), "stocks + indices"))
    parts.append(_stat_tile("Direct edges", str(g.number_of_edges()), f"lookback {lookback_days}d"))
    parts.append(_stat_tile(
        "Sector agreement", f"{agreement_score:.2f}", f"{agreement_word} (Adjusted Rand Index, 0&ndash;1)",
        tone="good" if agreement_score >= 0.6 else ("warn" if agreement_score >= 0.35 else "bad"),
    ))
    parts.append(_stat_tile("Out-of-sector", str(len(outliers)), "stocks trading unlike their sector", tone="warn"))
    parts.append("</div>")

    parts.append("<section><h2>Relationship network</h2>")
    parts.append("<p class='note'>Every stock and every index is a node in the same graph. An edge means "
                 "the two moved together above the correlation threshold over the lookback window &mdash; "
                 "diamonds are the four index symbols, so a stock sitting near NIFTY/BANKNIFTY has a direct "
                 "measured relationship to the benchmark, not just sector membership.</p>")
    parts.append(f"<div class='card'>{fig1.to_html(full_html=False, include_plotlyjs='inline', config={'displaylogo': False})}</div>")
    parts.append("</section>")

    parts.append("<section><h2>Where price behavior diverges from official sector</h2>")
    parts.append("<p class='note'>Each stock's correlation-fingerprint is compressed through a small "
                 "autoencoder into a latent space, then clustered &mdash; stocks land together here if they "
                 "<em>behave</em> alike, whether or not they're directly correlated with each other. The table "
                 "lists stocks whose cluster is dominated by a different sector than their own label.</p>")
    parts.append("<div class='cols cols-2'>")
    parts.append(f"<div class='card'>{fig2.to_html(full_html=False, include_plotlyjs=False, config={'displaylogo': False})}</div>")
    parts.append(f"<div class='table-wrap' style='max-height:620px;overflow-y:auto'>{_df_table(outliers)}</div>")
    parts.append("</div></section>")

    parts.append("<section><h2>Sector strength</h2>")
    parts.append("<p class='note'>Secondary view: mean monthly momentum score per sector, for a quick "
                 "read on which groups are currently in favor.</p>")
    parts.append(f"<div class='card'>{fig3.to_html(full_html=False, include_plotlyjs=False, config={'displaylogo': False})}</div>")
    parts.append(f"<div class='card'>{fig4.to_html(full_html=False, include_plotlyjs=False, config={'displaylogo': False})}</div>")
    parts.append("</section>")

    parts.append("<section><h2>Direct relationship to the benchmarks</h2>")
    parts.append("<p class='note'>Top 10 stocks by correlation to NIFTY and to BANKNIFTY over the sample period, with beta (sensitivity, not just co-movement).</p>")
    parts.append("<div class='cols cols-2'>")
    parts.append(f"<div><h3>Most NIFTY-correlated</h3><div class='table-wrap'>{_df_table(top_nifty[['corr_NIFTY', 'beta_NIFTY']].round(3), index=True)}</div></div>")
    parts.append(f"<div><h3>Most BANKNIFTY-correlated</h3><div class='table-wrap'>{_df_table(top_bank[['corr_BANKNIFTY', 'beta_BANKNIFTY']].round(3), index=True)}</div></div>")
    parts.append("</div></section>")

    parts.append("<footer>Generated from NIFTY F&amp;O daily export &middot; correlation-based inference, not causal &middot; "
                  "sector labels are a best-effort mapping, see README for caveats.</footer>")
    parts.append("</div>")

    with open(out_path, "w") as f:
        f.write("\n".join(parts))
