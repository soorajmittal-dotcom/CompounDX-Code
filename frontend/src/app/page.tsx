"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatPoints } from "@/lib/utils";
import type { PortfolioSummary } from "@/lib/types";

export default function Dashboard() {
  const [data, setData] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.portfolio.getSummary()
      .then((res: any) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const displayData = data || null;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Your points portfolio at a glance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <p className="text-sm opacity-80">Total Points Value</p>
          <p className="text-3xl font-bold mt-1">{displayData?.valuation.total_value_formatted || "₹5.8 Lakh"}</p>
          <p className="text-sm opacity-80 mt-2">{displayData?.valuation.programs_count || 7} active programs</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
          <p className="text-sm opacity-80">Annual Benefits Value</p>
          <p className="text-3xl font-bold mt-1">{formatINR(displayData?.benefits_summary.total_value || 240000)}</p>
          <p className="text-sm opacity-80 mt-2">{displayData?.benefits_summary.roi || 485}% ROI on fees</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <p className="text-sm opacity-80">Elite Statuses</p>
          <p className="text-3xl font-bold mt-1">{Object.keys(displayData?.elite_statuses || {}).length || 3}</p>
          <div className="text-sm opacity-80 mt-2">
            {displayData?.elite_statuses
              ? Object.entries(displayData.elite_statuses).slice(0, 2).map(([prog, tier]) => (
                  <span key={prog} className="mr-2">{prog.split(" ")[0]}: {tier}</span>
                ))
              : <span>Marriott Gold, KrisFlyer Silver</span>
            }
          </div>
        </div>
      </div>

      {/* Points Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Points Inventory</h2>
        <div className="space-y-3">
          {(displayData?.valuation.breakdown || DEMO_BREAKDOWN).map((item: any) => (
            <div key={item.program} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-white text-sm">{item.program}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{item.best_use || item.best}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-slate-900 dark:text-white">{formatPoints(item.balance)} pts</div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  {item.transfer_value_inr ? formatINR(item.transfer_value_inr) : item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/trips", label: "Plan a Trip", icon: "✈️", color: "from-sky-500 to-blue-600" },
          { href: "/optimizer", label: "Optimize Spend", icon: "⚡", color: "from-amber-500 to-orange-600" },
          { href: "/advisor", label: "Ask AI Advisor", icon: "🤖", color: "from-violet-500 to-purple-600" },
          { href: "/portfolio", label: "View Benefits", icon: "🎁", color: "from-rose-500 to-pink-600" },
        ].map((action) => (
          <a
            key={action.href}
            href={action.href}
            className={`bg-gradient-to-br ${action.color} rounded-xl p-4 text-white text-center hover:opacity-90 transition-opacity`}
          >
            <span className="text-2xl block mb-1">{action.icon}</span>
            <span className="text-sm font-medium">{action.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

const DEMO_BREAKDOWN = [
  { program: "HDFC Reward Points", balance: 350000, value: "₹2.6L", best: "Transfer to KrisFlyer" },
  { program: "Amex Membership Rewards", balance: 120000, value: "₹1.0L", best: "Transfer to airlines" },
  { program: "Axis EDGE Miles", balance: 80000, value: "₹1.2L", best: "1:1 to KrisFlyer" },
  { program: "KrisFlyer Miles", balance: 45000, value: "₹67.5K", best: "Business class to SEA" },
  { program: "Marriott Bonvoy Points", balance: 120000, value: "₹96K", best: "5th night free stays" },
  { program: "British Airways Avios", balance: 35000, value: "₹42K", best: "Short-haul flights" },
  { program: "World of Hyatt Points", balance: 25000, value: "₹42.5K", best: "Category 6-8 stays" },
];
