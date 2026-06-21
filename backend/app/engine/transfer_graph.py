import json
import math
from pathlib import Path
from dataclasses import dataclass

import networkx as nx


@dataclass
class TransferPath:
    route: list[str]
    effective_ratio: float
    points_delivered: int
    transfer_time_days: int
    steps: list[dict]


class TransferGraphEngine:
    def __init__(self):
        self.graph = nx.DiGraph()
        self._load_data()

    def _load_data(self):
        data_dir = Path(__file__).parent.parent / "data"
        with open(data_dir / "transfer_partners.json") as f:
            partners = json.load(f)

        for p in partners:
            self.graph.add_edge(
                p["from"],
                p["to"],
                ratio=p["ratio"],
                ratio_display=p["ratio_display"],
                transfer_time_days=p["transfer_time_days"],
                min_transfer=p["min_transfer"],
                notes=p.get("notes", ""),
                weight=-math.log(1 / p["ratio"]) if p["ratio"] > 0 else float("inf"),
            )

    def find_all_paths(self, source: str, target: str, max_hops: int = 3) -> list[TransferPath]:
        if source not in self.graph or target not in self.graph:
            return []

        paths = []
        try:
            for path in nx.all_simple_paths(self.graph, source, target, cutoff=max_hops):
                effective_ratio = 1.0
                total_time = 0
                steps = []

                for i in range(len(path) - 1):
                    edge = self.graph[path[i]][path[i + 1]]
                    effective_ratio *= edge["ratio"]
                    total_time += edge["transfer_time_days"]
                    steps.append({
                        "from": path[i],
                        "to": path[i + 1],
                        "ratio": edge["ratio"],
                        "ratio_display": edge["ratio_display"],
                        "time_days": edge["transfer_time_days"],
                        "notes": edge["notes"],
                    })

                paths.append(TransferPath(
                    route=path,
                    effective_ratio=effective_ratio,
                    points_delivered=0,
                    transfer_time_days=total_time,
                    steps=steps,
                ))
        except nx.NetworkXError:
            pass

        paths.sort(key=lambda p: p.effective_ratio)
        return paths

    def find_best_path(self, source: str, target: str, source_points: int) -> TransferPath | None:
        paths = self.find_all_paths(source, target)
        if not paths:
            return None

        best = paths[0]
        best.points_delivered = int(source_points / best.effective_ratio)
        return best

    def get_reachable_programs(self, source: str) -> list[dict]:
        if source not in self.graph:
            return []

        reachable = []
        for target in self.graph.nodes():
            if target == source:
                continue
            paths = self.find_all_paths(source, target)
            if paths:
                best = paths[0]
                reachable.append({
                    "program": target,
                    "best_ratio": best.effective_ratio,
                    "hops": len(best.route) - 1,
                    "time_days": best.transfer_time_days,
                })

        reachable.sort(key=lambda x: x["best_ratio"])
        return reachable

    def get_graph_data(self) -> dict:
        nodes = [{"id": n, "type": self._get_node_type(n)} for n in self.graph.nodes()]
        edges = []
        for u, v, data in self.graph.edges(data=True):
            edges.append({
                "source": u,
                "target": v,
                "ratio": data["ratio"],
                "ratio_display": data["ratio_display"],
                "time_days": data["transfer_time_days"],
            })
        return {"nodes": nodes, "edges": edges}

    def _get_node_type(self, name: str) -> str:
        airline_keywords = ["Miles", "Avios", "Skywards", "KrisFlyer", "Flying Blue", "Air India", "MileagePlus", "InterMiles", "Etihad", "Turkish"]
        hotel_keywords = ["Marriott", "Hilton", "Hyatt", "IHG", "ALL Reward", "Accor"]
        for kw in airline_keywords:
            if kw in name:
                return "airline"
        for kw in hotel_keywords:
            if kw in name:
                return "hotel"
        return "bank"

    def calculate_transfer_value(self, source: str, target: str, source_points: int, target_cpp: float) -> dict:
        best_path = self.find_best_path(source, target, source_points)
        if not best_path:
            return {"possible": False}

        delivered = best_path.points_delivered
        value_inr = delivered * target_cpp

        return {
            "possible": True,
            "source_points": source_points,
            "delivered_points": delivered,
            "effective_ratio": best_path.effective_ratio,
            "value_inr": value_inr,
            "path": [s["from"] + " → " + s["to"] for s in best_path.steps],
            "time_days": best_path.transfer_time_days,
        }


transfer_graph = TransferGraphEngine()
