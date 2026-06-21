"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import type { GraphData } from "@/lib/types";

interface NodePosition {
  id: string;
  type: string;
  x: number;
  y: number;
}

const TYPE_COLORS: Record<string, string> = {
  credit_card: "#3b82f6",
  airline: "#ef4444",
  hotel: "#10b981",
  general: "#8b5cf6",
};

const TYPE_LABELS: Record<string, string> = {
  credit_card: "Credit Card Points",
  airline: "Airline Miles",
  hotel: "Hotel Points",
  general: "Other",
};

export default function TransferGraph() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    api.optimizer.getTransferGraph()
      .then((res: any) => setGraphData(res))
      .catch(() => setGraphData(DEMO_GRAPH))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse h-[500px] bg-slate-200 dark:bg-slate-700 rounded-xl" />
    );
  }

  if (!graphData) return null;

  const positions = computeLayout(graphData);
  const activeNodeId = selectedNode || hoveredNode;
  const connectedEdges = activeNodeId
    ? graphData.edges.filter(e => e.source === activeNodeId || e.target === activeNodeId)
    : [];
  const connectedNodeIds = new Set(connectedEdges.flatMap(e => [e.source, e.target]));

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 items-center">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
            <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Graph */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 900 600"
          className="w-full h-[500px]"
          style={{ userSelect: "none" }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
            </marker>
            <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
            </marker>
          </defs>

          {/* Edges */}
          {graphData.edges.map((edge, i) => {
            const source = positions.find(p => p.id === edge.source);
            const target = positions.find(p => p.id === edge.target);
            if (!source || !target) return null;

            const isActive = connectedEdges.includes(edge);
            const isHighlighted = activeNodeId ? isActive : true;
            const opacity = activeNodeId ? (isHighlighted ? 1 : 0.1) : 0.4;

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const nodeRadius = 22;
            const sx = source.x + (dx / dist) * nodeRadius;
            const sy = source.y + (dy / dist) * nodeRadius;
            const tx = target.x - (dx / dist) * (nodeRadius + 8);
            const ty = target.y - (dy / dist) * (nodeRadius + 8);

            const midX = (sx + tx) / 2;
            const midY = (sy + ty) / 2;
            const offsetX = -dy / dist * 15;
            const offsetY = dx / dist * 15;

            return (
              <g key={i} opacity={opacity}>
                <path
                  d={`M ${sx} ${sy} Q ${midX + offsetX} ${midY + offsetY} ${tx} ${ty}`}
                  fill="none"
                  stroke={isActive ? "#3b82f6" : "#94a3b8"}
                  strokeWidth={isActive ? 2 : 1}
                  markerEnd={isActive ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                />
                {isActive && (
                  <text
                    x={midX + offsetX * 0.6}
                    y={midY + offsetY * 0.6}
                    textAnchor="middle"
                    className="text-[9px] fill-blue-600 dark:fill-blue-400 font-medium"
                  >
                    {edge.ratio_display}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {positions.map((node) => {
            const isActive = activeNodeId === node.id;
            const isConnected = connectedNodeIds.has(node.id);
            const opacity = activeNodeId ? (isActive || isConnected ? 1 : 0.2) : 1;
            const color = TYPE_COLORS[node.type] || TYPE_COLORS.general;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                opacity={opacity}
                cursor="pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
              >
                <circle
                  r={isActive ? 26 : 22}
                  fill={color}
                  opacity={0.15}
                  stroke={color}
                  strokeWidth={isActive ? 3 : 1.5}
                />
                <circle r={isActive ? 10 : 8} fill={color} />
                <text
                  y={35}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-700 dark:fill-slate-300 font-medium"
                >
                  {shortenName(node.id)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node Info Panel */}
      {selectedNode && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[graphData.nodes.find(n => n.id === selectedNode)?.type || "general"] }} />
            <h3 className="font-semibold text-slate-900 dark:text-white">{selectedNode}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {connectedEdges.map((edge, i) => {
              const isOutgoing = edge.source === selectedNode;
              return (
                <div key={i} className="text-sm p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                  <span className={isOutgoing ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"}>
                    {isOutgoing ? "→" : "←"}
                  </span>{" "}
                  <span className="text-slate-700 dark:text-slate-300">
                    {isOutgoing ? edge.target : edge.source}
                  </span>
                  <span className="text-slate-400 ml-2">({edge.ratio_display}, {edge.time_days}d)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function shortenName(name: string): string {
  return name
    .replace(" Reward Points", " RP")
    .replace(" Membership Rewards", " MR")
    .replace(" EDGE Miles", " Miles")
    .replace(" Miles", "")
    .replace(" Points", "")
    .replace("British Airways", "BA")
    .replace("Flying Blue", "FlyBlue")
    .replace("Emirates Skywards", "Emirates")
    .replace("United MileagePlus", "United");
}

function computeLayout(graph: GraphData): NodePosition[] {
  const typeGroups: Record<string, typeof graph.nodes> = {};
  graph.nodes.forEach(n => {
    if (!typeGroups[n.type]) typeGroups[n.type] = [];
    typeGroups[n.type].push(n);
  });

  const positions: NodePosition[] = [];
  const centerX = 450;
  const centerY = 300;

  const typeConfig: Record<string, { radius: number; startAngle: number }> = {
    credit_card: { radius: 100, startAngle: -Math.PI / 2 },
    airline: { radius: 240, startAngle: -Math.PI / 3 },
    hotel: { radius: 240, startAngle: Math.PI / 2 },
    general: { radius: 180, startAngle: Math.PI },
  };

  Object.entries(typeGroups).forEach(([type, nodes]) => {
    const config = typeConfig[type] || { radius: 200, startAngle: 0 };
    const angleSpan = (Math.PI * 2) / Object.keys(typeGroups).length;
    const typeIndex = Object.keys(typeGroups).indexOf(type);
    const baseAngle = (typeIndex * angleSpan) - Math.PI / 2;

    nodes.forEach((node, i) => {
      const angleDelta = nodes.length > 1 ? (angleSpan * 0.8) * (i / (nodes.length - 1) - 0.5) : 0;
      const angle = baseAngle + angleDelta;
      const r = config.radius + (i % 2 === 0 ? 0 : 30);
      positions.push({
        id: node.id,
        type: node.type,
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
      });
    });
  });

  return positions;
}

const DEMO_GRAPH: GraphData = {
  nodes: [
    { id: "HDFC Reward Points", type: "credit_card" },
    { id: "Amex Membership Rewards", type: "credit_card" },
    { id: "Axis EDGE Miles", type: "credit_card" },
    { id: "ICICI Reward Points", type: "credit_card" },
    { id: "SBI Reward Points", type: "credit_card" },
    { id: "KrisFlyer", type: "airline" },
    { id: "British Airways Avios", type: "airline" },
    { id: "Flying Blue", type: "airline" },
    { id: "Air India", type: "airline" },
    { id: "Emirates Skywards", type: "airline" },
    { id: "Marriott Bonvoy", type: "hotel" },
    { id: "Hilton Honors", type: "hotel" },
    { id: "World of Hyatt", type: "hotel" },
    { id: "InterMiles", type: "general" },
  ],
  edges: [
    { source: "HDFC Reward Points", target: "KrisFlyer", ratio: 0.4, ratio_display: "10:4", time_days: 3 },
    { source: "HDFC Reward Points", target: "Air India", ratio: 1, ratio_display: "1:1", time_days: 2 },
    { source: "HDFC Reward Points", target: "Marriott Bonvoy", ratio: 1, ratio_display: "1:1", time_days: 3 },
    { source: "HDFC Reward Points", target: "British Airways Avios", ratio: 0.4, ratio_display: "10:4", time_days: 3 },
    { source: "Amex Membership Rewards", target: "KrisFlyer", ratio: 1, ratio_display: "1:1", time_days: 5 },
    { source: "Amex Membership Rewards", target: "British Airways Avios", ratio: 1, ratio_display: "1:1", time_days: 5 },
    { source: "Amex Membership Rewards", target: "Marriott Bonvoy", ratio: 1.2, ratio_display: "1:1.2", time_days: 5 },
    { source: "Axis EDGE Miles", target: "KrisFlyer", ratio: 1, ratio_display: "1:1", time_days: 2 },
    { source: "Axis EDGE Miles", target: "Flying Blue", ratio: 1, ratio_display: "1:1", time_days: 2 },
    { source: "Axis EDGE Miles", target: "Emirates Skywards", ratio: 1, ratio_display: "1:1", time_days: 2 },
    { source: "ICICI Reward Points", target: "InterMiles", ratio: 0.5, ratio_display: "2:1", time_days: 3 },
    { source: "SBI Reward Points", target: "Air India", ratio: 1, ratio_display: "1:1", time_days: 3 },
    { source: "Marriott Bonvoy", target: "KrisFlyer", ratio: 0.33, ratio_display: "3:1", time_days: 5 },
    { source: "Marriott Bonvoy", target: "British Airways Avios", ratio: 0.33, ratio_display: "3:1", time_days: 5 },
  ],
};
