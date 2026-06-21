"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";

const DEMO_SPEND = {
  travel: 50000,
  dining: 30000,
  groceries: 25000,
  fuel: 10000,
  utilities: 15000,
  online: 20000,
  international: 15000,
};

export default function RecommendCardsPage() {
  const [spend, setSpend] = useState(DEMO_SPEND);
  const [currentCards, setCurrentCards] = useState([1, 2, 4, 6, 7]);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRecommend = async () => {
    setLoading(true);
    try {
      const res = await api.cards.recommend(spend, currentCards);
      setResults(res);
    } catch {
      setResults(DEMO_RESULTS);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Card Recommendations</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Find the next card to apply for based on your spending</p>
      </div>

      {/* Spending Input */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Your Monthly Spending</h2>
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
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Monthly Spend</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {formatINR(Object.values(spend).reduce((s, v) => s + v, 0))}
          </span>
        </div>
        <button
          onClick={handleRecommend}
          disabled={loading}
          className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Getting Recommendations..." : "Get Card Recommendations"}
        </button>
      </div>

      {/* Results */}
      {results && results.recommendations && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">Based on your ₹{Object.values(spend).reduce((s, v) => s + v, 0).toLocaleString()}/month spend</p>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-1">
              Apply for these cards to earn an additional {formatINR(results.recommendations.reduce((s: any, r: any) => s + r.estimated_annual_value, 0))} annually
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {results.recommendations.map((rec: any, i: number) => (
              <div key={rec.card_id} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block w-8 h-8 rounded-full text-center font-bold text-sm" style={{ backgroundColor: rec.image_color, color: "white" }}>
                        {i + 1}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{rec.card_name}</h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{rec.bank}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Annual Fee</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{formatINR(rec.annual_fee)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-700 dark:text-green-300">Annual Value</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">
                      {formatINR(rec.estimated_annual_value)}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">Net Value</p>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                      {formatINR(rec.net_value)}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-700 dark:text-purple-300">ROI</p>
                    <p className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                      {rec.roi_percent}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Why this card:</p>
                  {rec.top_reasons.map((reason: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              <h3 className="font-semibold text-slate-900 dark:text-white">All Recommendations Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Card</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Bank</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Annual Fee</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Value</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Net Value</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {results.recommendations.map((rec: any) => (
                    <tr key={rec.card_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{rec.card_name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{rec.bank}</td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatINR(rec.annual_fee)}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                        {formatINR(rec.estimated_annual_value)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatINR(rec.net_value)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-blue-600 dark:text-blue-400">
                        {rec.roi_percent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {!results && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Card Selection Tips</h3>
          <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
            <li>✓ Calculate net value (annual benefits - fees) not just gross benefits</li>
            <li>✓ Look for cards with 2X/3X bonus on your top spending categories</li>
            <li>✓ Consider milestone rewards & travel credits that offset fees</li>
            <li>✓ Evaluate transfer partners to realize points value outside reward rate</li>
            <li>✓ Check lounge access, concierge, and insurance benefits</li>
          </ul>
        </div>
      )}
    </div>
  );
}

const DEMO_RESULTS = {
  recommendations: [
    {
      card_id: 5,
      card_name: "Amex Platinum Travel",
      bank: "American Express",
      annual_fee: 60000,
      estimated_annual_value: 180000,
      net_value: 120000,
      roi_percent: 200,
      image_color: "#02b8e8",
      top_reasons: ["5X on Amex Travel", "6K travel credit", "Covers international spend"],
      score: 145,
    },
    {
      card_id: 3,
      card_name: "ICICI Sapphiro",
      bank: "ICICI Bank",
      annual_fee: 50000,
      estimated_annual_value: 140000,
      net_value: 90000,
      roi_percent: 180,
      image_color: "#d32f2f",
      top_reasons: ["4X on dining & travel", "Bonus milestone rewards", "Rare card with high caps"],
      score: 125,
    },
    {
      card_id: 8,
      card_name: "SBI Aurum",
      bank: "SBI",
      annual_fee: 25000,
      estimated_annual_value: 95000,
      net_value: 70000,
      roi_percent: 280,
      image_color: "#1e40af",
      top_reasons: ["4X on travel", "Lounge access", "Lower fee, great ROI"],
      score: 105,
    },
  ],
  based_on_spend: DEMO_SPEND,
  current_cards_count: 5,
};
