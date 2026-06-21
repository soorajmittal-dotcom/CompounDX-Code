"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatPoints } from "@/lib/utils";
import type { SpendRecommendation } from "@/lib/types";
import TransferGraph from "@/components/optimizer/TransferGraph";

const DEFAULT_SPEND = {
  travel: 50000,
  dining: 30000,
  groceries: 25000,
  fuel: 10000,
  utilities: 15000,
  online: 20000,
  international: 15000,
  entertainment: 10000,
};

export default function OptimizerPage() {
  const [spend, setSpend] = useState(DEFAULT_SPEND);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"spend" | "transfer" | "graph">("spend");

  const [transferSource, setTransferSource] = useState("HDFC Reward Points");
  const [transferTarget, setTransferTarget] = useState("KrisFlyer Miles");
  const [transferPoints, setTransferPoints] = useState(100000);
  const [transferResult, setTransferResult] = useState<any>(null);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const res = await api.optimizer.optimizeSpend(spend);
      setResults(res);
    } catch {
      setResults(null);
    }
    setLoading(false);
  };

  const handleTransferSearch = async () => {
    setLoading(true);
    try {
      const res = await api.optimizer.getTransferPath(transferSource, transferTarget, transferPoints);
      setTransferResult(res);
    } catch {
      setTransferResult(null);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Optimizer</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Maximize every rupee and point</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("spend")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "spend"
              ? "bg-primary-600 text-white"
              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}
        >
          Card Spend Optimizer
        </button>
        <button
          onClick={() => setActiveTab("transfer")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "transfer"
              ? "bg-primary-600 text-white"
              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}
        >
          Transfer Path Finder
        </button>
        <button
          onClick={() => setActiveTab("graph")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "graph"
              ? "bg-primary-600 text-white"
              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}
        >
          Transfer Network
        </button>
      </div>

      {activeTab === "spend" && (
        <>
          {/* Spend Input */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Monthly Spending</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(spend).map(([category, amount]) => (
                <div key={category}>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 capitalize">
                    {category}
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setSpend({ ...spend, [category]: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleOptimize}
              disabled={loading}
              className="mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Optimizing..." : "Optimize My Spend"}
            </button>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300">Annual Rewards Value</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                    {formatINR(results.total_annual_value_inr)}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">Net After Fees</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                    {formatINR(results.net_annual_value)}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-purple-700 dark:text-purple-300">Monthly Points</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                    {formatPoints(results.monthly_points_total)}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recommended Cards by Category</h2>
                <div className="space-y-3">
                  {results.recommendations.map((rec: SpendRecommendation) => (
                    <div key={rec.category} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rec.image_color }} />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white capitalize">{rec.category}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">₹{rec.monthly_spend.toLocaleString()}/mo</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{rec.recommended_card}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{rec.earn_rate}x points</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatINR(rec.annual_value_inr)}/yr</p>
                        <p className="text-xs text-slate-500">{formatPoints(rec.monthly_points)} pts/mo</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "graph" && (
        <TransferGraph />
      )}

      {activeTab === "transfer" && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Find Transfer Path</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">From Program</label>
                <select
                  value={transferSource}
                  onChange={(e) => setTransferSource(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white"
                >
                  {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">To Program</label>
                <select
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white"
                >
                  {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Points to Transfer</label>
                <input
                  type="number"
                  value={transferPoints}
                  onChange={(e) => setTransferPoints(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleTransferSearch}
                  disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? "Searching..." : "Find Path"}
                </button>
              </div>
            </div>
          </div>

          {transferResult && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Transfer Results</h2>
              {transferResult.best_path ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="font-medium text-green-800 dark:text-green-200">Best Path Found</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {formatPoints(transferResult.source_points)} → {formatPoints(transferResult.best_path.points_delivered)} points delivered
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Effective ratio: {transferResult.best_path.effective_ratio}:1 • Transfer time: {transferResult.best_path.time_days} days
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Transfer Steps:</p>
                    {transferResult.best_path.steps.map((step: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-slate-900 dark:text-white">{step.from} → {step.to}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Ratio: {step.ratio_display} • {step.time_days} days {step.notes && `• ${step.notes}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {transferResult.all_paths.length > 1 && (
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white mt-4 mb-2">Alternative Paths:</p>
                      {transferResult.all_paths.slice(1).map((path: any, i: number) => (
                        <div key={i} className="text-sm text-slate-600 dark:text-slate-400 py-1">
                          {path.route.join(" → ")} (ratio: {path.effective_ratio}:1, {path.time_days} days)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No transfer path found between these programs.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const PROGRAMS = [
  "HDFC Reward Points",
  "Amex Membership Rewards",
  "Axis EDGE Miles",
  "ICICI Reward Points",
  "SBI Reward Points",
  "IndusInd Reward Points",
  "KrisFlyer Miles",
  "British Airways Avios",
  "Flying Blue Miles",
  "Emirates Skywards Miles",
  "Air India Miles",
  "Turkish Miles",
  "Etihad Guest Miles",
  "United MileagePlus Miles",
  "Marriott Bonvoy Points",
  "Hilton Honors Points",
  "World of Hyatt Points",
  "InterMiles",
];
