"""
Stock/index relationship network.

Builds a correlation graph over daily returns for every symbol in the
universe (216 F&O stocks + the 4 index symbols: NIFTY, BANKNIFTY,
CNXMIDCAP, NIFTYFINSERVICE), then separates that into:

  - direct links   : |correlation| above a threshold -> an edge in the graph
  - indirect links : no direct edge, but connected through shared neighbours
                      (common counterparties, or membership in the same
                      correlation-based community / graph cluster)

This treats the index symbols as regular nodes, so "how is this stock
related to Nifty / Bank Nifty" falls out of the same graph as
stock-to-stock relationships, rather than being a separate sector lookup.
"""

from __future__ import annotations

import networkx as nx
import numpy as np
import pandas as pd

from sectors import INDEX_SYMBOLS, get_sector


def correlation_matrix(returns: pd.DataFrame, min_obs: int = 60) -> pd.DataFrame:
    """Pairwise Pearson correlation of daily returns, symbols with too few
    overlapping observations are dropped."""
    valid_cols = [c for c in returns.columns if returns[c].notna().sum() >= min_obs]
    r = returns[valid_cols]
    corr = r.corr(min_periods=min_obs)
    return corr


def build_graph(corr: pd.DataFrame, direct_threshold: float = 0.55) -> nx.Graph:
    """Nodes = symbols (stocks + indices). Edge if |corr| >= direct_threshold."""
    g = nx.Graph()
    for sym in corr.columns:
        sector, industry = get_sector(sym)
        g.add_node(sym, sector=sector, industry=industry, is_index=sym in INDEX_SYMBOLS)

    cols = corr.columns
    for i, a in enumerate(cols):
        row = corr[a].values
        for j in range(i + 1, len(cols)):
            w = row[j]
            if pd.notna(w) and abs(w) >= direct_threshold:
                g.add_edge(a, cols[j], weight=float(w))
    return g


def indirect_neighbors(g: nx.Graph, symbol: str, max_hops: int = 2) -> dict[str, int]:
    """Symbols reachable within max_hops that are NOT direct neighbours,
    i.e. stocks that are indirectly related through common links."""
    if symbol not in g:
        return {}
    direct = set(g.neighbors(symbol))
    lengths = nx.single_source_shortest_path_length(g, symbol, cutoff=max_hops)
    return {s: d for s, d in lengths.items() if d > 1 and s != symbol}


def communities(g: nx.Graph) -> dict[str, int]:
    """Greedy-modularity communities over the direct-link graph. These are
    the 'natural' groupings implied purely by price co-movement, which may
    cut across (or confirm) the official sector labels."""
    comms = nx.algorithms.community.greedy_modularity_communities(g, weight="weight")
    assignment: dict[str, int] = {}
    for idx, group in enumerate(comms):
        for sym in group:
            assignment[sym] = idx
    return assignment


def index_exposure(returns: pd.DataFrame, corr: pd.DataFrame) -> pd.DataFrame:
    """For every stock: correlation and beta to NIFTY and BANKNIFTY."""
    rows = []
    for sym in corr.columns:
        if sym in INDEX_SYMBOLS:
            continue
        rec = {"Symbol": sym}
        for idx_sym in ("NIFTY", "BANKNIFTY"):
            if idx_sym not in corr.columns:
                continue
            rec[f"corr_{idx_sym}"] = corr.loc[sym, idx_sym] if idx_sym in corr.index else np.nan
            if sym in returns.columns and idx_sym in returns.columns:
                pair = returns[[sym, idx_sym]].dropna()
                if len(pair) >= 60:
                    cov = np.cov(pair[sym], pair[idx_sym])
                    beta = cov[0, 1] / cov[1, 1] if cov[1, 1] != 0 else np.nan
                else:
                    beta = np.nan
                rec[f"beta_{idx_sym}"] = beta
        rows.append(rec)
    return pd.DataFrame(rows).set_index("Symbol")


def centrality_table(g: nx.Graph) -> pd.DataFrame:
    """Degree + weighted-degree centrality: which stocks sit at the middle
    of the relationship web (hub names) vs. the edges (isolated movers)."""
    deg = dict(g.degree())
    wdeg = dict(g.degree(weight="weight"))
    btw = nx.betweenness_centrality(g, weight=None, k=min(150, g.number_of_nodes()) or None, seed=0)
    rows = []
    for sym in g.nodes():
        sector, industry = get_sector(sym)
        rows.append(
            {
                "Symbol": sym,
                "sector": sector,
                "degree": deg.get(sym, 0),
                "weighted_degree": round(wdeg.get(sym, 0.0), 2),
                "betweenness": round(btw.get(sym, 0.0), 4),
            }
        )
    return pd.DataFrame(rows).sort_values("weighted_degree", ascending=False).reset_index(drop=True)
