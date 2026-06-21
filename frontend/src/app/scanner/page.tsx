"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ScannerPage() {
  const [opportunities, setOpportunities] = useState<any>(null);
  const [expiry, setExpiry] = useState<any>(null);
  const [renewals, setRenewals] = useState<any>(null);
  const [sweetSpots, setSweetSpots] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/scanner/opportunities`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/api/scanner/expiry`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/api/scanner/renewal/all`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/api/scanner/sweet-spots`).then(r => r.json()).catch(() => null),
    ]).then(([opp, exp, ren, spots]) => {
      setOpportunities(opp);
      setExpiry(exp);
      setRenewals(ren);
      setSweetSpots(spots);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Opportunity Scanner</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Active promotions, expiry alerts, and sweet spots</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">Active Opportunities</p>
          <p className="text-3xl font-bold mt-1">{opportunities?.total_opportunities || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">Expiry Alerts</p>
          <p className="text-3xl font-bold mt-1">{expiry?.alerts?.length || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">Portfolio Net Value</p>
          <p className="text-3xl font-bold mt-1">{formatINR(renewals?.net_portfolio_value || 193500)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">Sweet Spots Available</p>
          <p className="text-3xl font-bold mt-1">{sweetSpots?.flights?.length || 10}</p>
        </div>
      </div>

      {/* Transfer Bonuses */}
      {opportunities?.transfer_bonuses?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Active Transfer Bonuses</h2>
          <div className="space-y-3">
            {opportunities.transfer_bonuses.map((bonus: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {bonus.from} → {bonus.to}
                    {bonus.bonus_percent > 0 && (
                      <span className="ml-2 text-xs font-bold bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                        +{bonus.bonus_percent}% BONUS
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{bonus.details}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {bonus.days_remaining} days left
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    bonus.urgency === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                    bonus.urgency === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" :
                    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  }`}>
                    {bonus.urgency} priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiry Alerts */}
      {expiry?.alerts?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Points Expiry Tracker</h2>
          <div className="space-y-3">
            {expiry.alerts.map((alert: any, i: number) => (
              <div key={i} className={`p-4 rounded-lg border ${
                alert.risk === "high" ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" :
                alert.risk === "medium" ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" :
                "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{alert.program}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{alert.rule}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{alert.tip}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">{alert.balance.toLocaleString()} pts</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      alert.risk === "high" ? "bg-red-200 text-red-800" :
                      alert.risk === "medium" ? "bg-yellow-200 text-yellow-800" :
                      "bg-green-200 text-green-800"
                    }`}>
                      {alert.risk} risk
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Renewal Analysis */}
      {renewals?.cards?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Card Renewal Analysis</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 font-medium">Card</th>
                  <th className="pb-3 font-medium">Annual Fee</th>
                  <th className="pb-3 font-medium">Benefits Value</th>
                  <th className="pb-3 font-medium">ROI</th>
                  <th className="pb-3 font-medium">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {renewals.cards.map((card: any, i: number) => (
                  <tr key={i}>
                    <td className="py-3 font-medium text-slate-900 dark:text-white">{card.card_name}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{formatINR(card.annual_fee)}</td>
                    <td className="py-3 text-green-600 dark:text-green-400">{formatINR(card.total_value)}</td>
                    <td className="py-3 font-medium text-blue-600 dark:text-blue-400">{card.roi_percentage}%</td>
                    <td className="py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        card.recommendation === "RENEW"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                      }`}>
                        {card.recommendation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sweet Spots */}
      {sweetSpots?.flights?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Flight Sweet Spots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sweetSpots.flights.slice(0, 6).map((spot: any, i: number) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-900 dark:text-white">{spot.route}</span>
                  <span className="text-xs font-bold text-green-600 dark:text-green-400">{spot.cpp_inr} INR/pt</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{spot.program} • {spot.cabin} • {spot.points.toLocaleString()} pts</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{spot.notes}</p>
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">{spot.availability_tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
