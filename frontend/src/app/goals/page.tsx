"use client";

import { useState } from "react";
import { formatINR, formatPoints } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DESTINATIONS = [
  "Singapore", "Tokyo", "Japan", "Korea", "Seoul", "London",
  "Europe", "Paris", "New York", "USA", "Dubai", "Bangkok", "Bali", "Maldives",
];

export default function GoalsPage() {
  const [destination, setDestination] = useState("Singapore");
  const [targetDate, setTargetDate] = useState("2027-03-15");
  const [cabin, setCabin] = useState("business");
  const [travelers, setTravelers] = useState(2);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePlan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/scanner/goal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, target_date: targetDate, cabin, travelers }),
      });
      setRoadmap(await res.json());
    } catch {
      setRoadmap(null);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Goal-Based Planning</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Set a travel goal and get a month-by-month roadmap to achieve it</p>
      </div>

      {/* Goal Input */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Set Your Goal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white"
            >
              {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cabin</label>
            <select
              value={cabin}
              onChange={(e) => setCabin(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white"
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Travelers</label>
            <input
              type="number"
              value={travelers}
              onChange={(e) => setTravelers(Number(e.target.value))}
              min={1}
              max={8}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handlePlan}
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Planning..." : "Create Roadmap"}
            </button>
          </div>
        </div>
      </div>

      {/* Roadmap Results */}
      {roadmap && (
        <div className="space-y-6">
          {/* Status */}
          <div className={`rounded-xl p-6 border-2 ${
            roadmap.points_analysis.achievable_by_target
              ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
              : "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700"
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{roadmap.points_analysis.achievable_by_target ? "✅" : "⚠️"}</span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {roadmap.points_analysis.achievable_by_target ? "Goal Achievable!" : "Stretch Goal — Needs Extra Effort"}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {destination} in {cabin} class for {travelers} — {roadmap.goal.months_available} months to go
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Points Needed</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatPoints(roadmap.points_analysis.points_required)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Currently Available</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatPoints(roadmap.points_analysis.currently_available)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Gap to Fill</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatPoints(roadmap.points_analysis.gap)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Monthly Earn Rate</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatPoints(roadmap.points_analysis.monthly_earn_rate)}/mo</p>
              </div>
            </div>
          </div>

          {/* Transferable Points */}
          {roadmap.points_analysis.transferable_from_other?.sources?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Available Transfer Sources</h2>
              <div className="space-y-2">
                {roadmap.points_analysis.transferable_from_other.sources.map((src: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{src.from}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Ratio: {src.ratio}:1 • {src.time_days} days transfer time</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600 dark:text-slate-300">{formatPoints(src.balance)} → <span className="font-bold text-green-600 dark:text-green-400">{formatPoints(src.delivers)}</span></p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Total transferable: {formatPoints(roadmap.points_analysis.transferable_from_other.total_transferable)} {roadmap.points_analysis.program}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Roadmap */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Month-by-Month Roadmap</h2>
            <div className="space-y-3">
              {roadmap.monthly_roadmap.map((month: any) => (
                <div key={month.month} className="relative">
                  <div className="flex items-center gap-4">
                    <div className="w-16 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Month {month.month}</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{month.date}</p>
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${month.progress_percent}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-20 text-right">
                      <p className="text-xs font-bold text-primary-600 dark:text-primary-400">{month.progress_percent}%</p>
                    </div>
                  </div>
                  {month.actions.length > 0 && (
                    <div className="ml-20 mt-1 space-y-0.5">
                      {month.actions.map((action: string, j: number) => (
                        <p key={j} className="text-xs text-slate-500 dark:text-slate-400">• {action}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recommendations</h2>
            <div className="space-y-2">
              {roadmap.recommendations.map((rec: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-primary-500 mt-0.5">→</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!roadmap && !loading && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <p className="text-4xl mb-4">🎯</p>
          <p className="text-lg font-medium">Set a travel goal</p>
          <p className="text-sm mt-2">Choose your dream destination and target date. We&apos;ll create a month-by-month plan to get you there using points.</p>
        </div>
      )}
    </div>
  );
}
