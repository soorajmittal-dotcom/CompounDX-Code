"""Self-contained Plotly HTML dashboard for the relationship analysis."""

from __future__ import annotations

import networkx as nx
import pandas as pd
import plotly.graph_objects as go
from sklearn.decomposition import PCA

SECTOR_PALETTE = [
    "#4C78A8", "#F58518", "#E45756", "#72B7B2", "#54A24B", "#EECA3B",
    "#B279A2", "#FF9DA6", "#9D755D", "#BAB0AC", "#8C564B", "#17BECF",
    "#7F7F7F", "#BCBD22", "#AEC7E8", "#FFBB78", "#98DF8A", "#FF9896",
    "#C5B0D5", "#C49C94", "#F7B6D2",
]


def _sector_color_map(sectors: list[str]) -> dict[str, str]:
    uniq = sorted(set(sectors))
    return {s: SECTOR_PALETTE[i % len(SECTOR_PALETTE)] for i, s in enumerate(uniq)}


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
        line=dict(width=0.4, color="rgba(150,150,150,0.35)"),
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
                marker=dict(
                    size=[16 if g.nodes[n]["is_index"] else 6 + 1.5 * g.degree(n) for n in nodes],
                    color=color_map[sector],
                    line=dict(width=1, color="white"),
                    symbol=["diamond" if g.nodes[n]["is_index"] else "circle" for n in nodes],
                ),
                name=sector,
                hovertext=[f"{n} ({sector})" for n in nodes],
                hoverinfo="text",
            )
        )

    fig = go.Figure(data=traces)
    fig.update_layout(
        title="Stock relationship network (direct co-movement links, diamonds = indices)",
        showlegend=True,
        height=750,
        xaxis=dict(visible=False), yaxis=dict(visible=False),
        plot_bgcolor="white", margin=dict(l=10, r=10, t=50, b=10),
    )
    return fig


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
                marker=dict(size=9, color=color_map.get(sector, "#999")),
                text=sub["Symbol"] + " | cluster " + sub["cluster"].astype("Int64").astype(str),
                hoverinfo="text",
            )
        )
    fig.update_layout(
        title="Stock embedding space (PCA of autoencoder latent space, colored by official sector)",
        height=650, xaxis_title="component 1", yaxis_title="component 2",
        plot_bgcolor="white", margin=dict(l=10, r=10, t=50, b=10),
    )
    return fig


def sector_heatmap(ts: pd.DataFrame) -> go.Figure:
    monthly = ts.resample("MS").mean()
    fig = go.Figure(
        data=go.Heatmap(
            z=monthly.values.T,
            x=monthly.index.strftime("%Y-%m"),
            y=monthly.columns,
            colorscale="RdYlGn",
            zmid=0,
            colorbar=dict(title="momentum"),
        )
    )
    fig.update_layout(
        title="Sector strength over time (monthly avg. momentum score)",
        height=600, margin=dict(l=10, r=10, t=50, b=10),
    )
    return fig


def sector_ranking_bar(ranking: pd.DataFrame, score_col: str) -> go.Figure:
    ranking = ranking.sort_values(score_col)
    colors = ["#E45756" if v < 0 else "#54A24B" for v in ranking[score_col]]
    fig = go.Figure(go.Bar(x=ranking[score_col], y=ranking["sector"], orientation="h", marker_color=colors))
    fig.update_layout(
        title="Current sector ranking (latest monthly momentum score)",
        height=550, margin=dict(l=10, r=10, t=50, b=10),
    )
    return fig


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
) -> None:
    fig1 = network_figure(g)
    fig2 = embedding_scatter(emb, cluster_df)
    fig3 = sector_heatmap(sector_ts)
    fig4 = sector_ranking_bar(sector_ranking, "M_score")

    top_bank = index_exposure.sort_values("corr_BANKNIFTY", ascending=False).head(10)
    top_nifty = index_exposure.sort_values("corr_NIFTY", ascending=False).head(10)

    parts = [
        "<html><head><title>Stock Relationship Analysis</title>",
        "<style>body{font-family:-apple-system,Segoe UI,Arial,sans-serif;margin:24px;background:#fafafa;}",
        "h1{margin-bottom:4px} h2{margin-top:48px} table{border-collapse:collapse;margin-top:12px}",
        "td,th{border:1px solid #ddd;padding:6px 10px;font-size:14px;text-align:left}",
        "th{background:#eee} .note{color:#555;font-size:14px;max-width:900px}</style></head><body>",
        "<h1>NIFTY F&O universe: stock &amp; index relationship analysis</h1>",
        f"<p class='note'>Sector-vs-price-behavior agreement (Adjusted Rand Index): "
        f"<b>{agreement_score:.2f}</b> (1.0 = stocks trade exactly along official sector lines, "
        f"0.0 = price co-movement is unrelated to sector labels).</p>",
    ]
    parts.append(fig1.to_html(full_html=False, include_plotlyjs="inline"))
    parts.append("<h2>Where does price behavior diverge from official sector?</h2>")
    parts.append(fig2.to_html(full_html=False, include_plotlyjs=False))
    parts.append(
        "<p class='note'>Stocks whose price-behavior cluster is dominated by a different sector "
        "than their own label (i.e. trading 'out of sector'):</p>"
    )
    parts.append(outliers.to_html(index=False))

    parts.append("<h2>Sector strength</h2>")
    parts.append(fig3.to_html(full_html=False, include_plotlyjs=False))
    parts.append(fig4.to_html(full_html=False, include_plotlyjs=False))

    parts.append("<h2>Direct relationship to the benchmarks</h2>")
    parts.append("<p class='note'>Top 10 stocks by correlation to NIFTY and to BANKNIFTY over the sample period.</p>")
    parts.append("<div style='display:flex;gap:40px;flex-wrap:wrap'><div>")
    parts.append("<h3>Most NIFTY-correlated</h3>")
    parts.append(top_nifty[["corr_NIFTY", "beta_NIFTY"]].round(3).to_html())
    parts.append("</div><div>")
    parts.append("<h3>Most BANKNIFTY-correlated</h3>")
    parts.append(top_bank[["corr_BANKNIFTY", "beta_BANKNIFTY"]].round(3).to_html())
    parts.append("</div></div>")

    parts.append("</body></html>")

    with open(out_path, "w") as f:
        f.write("\n".join(parts))
