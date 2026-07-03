"""
Neural-network embeddings of "relationship fingerprints".

Each stock's fingerprint = its row in the correlation matrix (how it
co-moves with every other stock/index). Two stocks that are highly similar
in *how they relate to everything else* end up close together in the
embedding even if they are not directly correlated with each other - this
is what captures "indirect" relationships (e.g. two mid-cap auto-ancillary
names that both track BHARATFORG and the auto index, without necessarily
being correlated with each other directly).

A small bottleneck autoencoder (sklearn MLPRegressor, input -> narrow
hidden layer -> output, trained to reconstruct its own input) compresses
that fingerprint into a handful of latent dimensions. KMeans on the latent
space then gives "natural" stock groupings driven purely by price behavior,
which can be compared against the official sector labels to see where the
market is trading a stock like its sector peers vs. like something else.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import adjusted_rand_score
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler

from sectors import get_sector


def build_embeddings(
    corr: pd.DataFrame,
    latent_dim: int = 8,
    random_state: int = 0,
) -> pd.DataFrame:
    """Autoencoder embedding of each symbol's correlation fingerprint."""
    fingerprints = corr.fillna(0.0)
    scaler = StandardScaler()
    x = scaler.fit_transform(fingerprints.values)

    hidden = max(latent_dim * 2, 16)
    autoencoder = MLPRegressor(
        hidden_layer_sizes=(hidden, latent_dim, hidden),
        activation="tanh",
        solver="adam",
        max_iter=2000,
        random_state=random_state,
        early_stopping=True,
        n_iter_no_change=25,
    )
    autoencoder.fit(x, x)

    # latent representation = activations at the bottleneck layer
    activations = x
    for i, (w, b) in enumerate(zip(autoencoder.coefs_, autoencoder.intercepts_)):
        activations = np.tanh(activations @ w + b)
        if i == 1:  # index of the bottleneck layer (hidden, latent, hidden)
            latent = activations
            break

    emb = pd.DataFrame(
        latent,
        index=fingerprints.index,
        columns=[f"z{i}" for i in range(latent.shape[1])],
    )
    return emb


def cluster_embeddings(emb: pd.DataFrame, n_clusters: int = 14, random_state: int = 0) -> pd.DataFrame:
    km = KMeans(n_clusters=n_clusters, n_init=10, random_state=random_state)
    labels = km.fit_predict(emb.values)

    rows = []
    for sym, cluster in zip(emb.index, labels):
        sector, industry = get_sector(sym)
        rows.append({"Symbol": sym, "cluster": int(cluster), "sector": sector, "industry": industry})
    return pd.DataFrame(rows)


def sector_cluster_agreement(cluster_df: pd.DataFrame) -> float:
    """Adjusted Rand Index between price-behavior clusters and official
    sector labels. ~0 = clusters look nothing like sectors (price action is
    driven by something else - theme, index membership, event risk), ~1 =
    stocks trade almost exactly along sector lines."""
    non_index = cluster_df[cluster_df["sector"] != "Index"]
    return float(adjusted_rand_score(non_index["sector"], non_index["cluster"]))


def outlier_stocks(cluster_df: pd.DataFrame) -> pd.DataFrame:
    """Stocks whose price-behavior cluster is dominated by a different
    sector than their own label - i.e. names trading 'out of sector'."""
    non_index = cluster_df[cluster_df["sector"] != "Index"].copy()
    cluster_majority = (
        non_index.groupby("cluster")["sector"]
        .agg(lambda s: s.value_counts().idxmax())
        .rename("cluster_majority_sector")
    )
    non_index = non_index.join(cluster_majority, on="cluster")
    return non_index[non_index["sector"] != non_index["cluster_majority_sector"]][
        ["Symbol", "sector", "cluster", "cluster_majority_sector"]
    ].reset_index(drop=True)
