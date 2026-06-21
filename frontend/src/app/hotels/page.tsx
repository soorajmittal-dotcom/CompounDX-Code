"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatPoints } from "@/lib/utils";

const CITIES = [
  "Singapore", "Bangkok", "Dubai", "Tokyo", "London",
  "Bali", "Maldives", "Paris", "New York", "Goa",
  "Jaipur", "Mumbai", "Delhi", "Udaipur", "Shimla",
];

export default function HotelsPage() {
  const [city, setCity] = useState("Singapore");
  const [nights, setNights] = useState(5);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    setLoading(true);
    try {
      const res = await api.optimizer.compareHotels(city, nights);
      setResults(res);
    } catch {
      setResults(DEMO_RESULTS);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hotel Comparison</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Compare points vs cash across hotel programs</p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white"
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nights</label>
            <input
              type="number"
              min={1}
              max={30}
              value={nights}
              onChange={(e) => setNights(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCompare}
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Comparing..." : "Compare Hotels"}
            </button>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {results && results.recommendations && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {results.recommendations.best_value && (
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
              <p className="text-sm opacity-80">Best Value (Highest CPP)</p>
              <p className="text-lg font-bold mt-1">{results.recommendations.best_value.program}</p>
              <p className="text-sm opacity-90">{results.recommendations.best_value.category}</p>
              <p className="text-2xl font-bold mt-2">{results.recommendations.best_value.cpp_value} cpp</p>
              <p className="text-xs opacity-80 mt-1">{formatPoints(results.recommendations.best_value.total_points)} points needed</p>
            </div>
          )}
          {results.recommendations.cheapest_points && (
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
              <p className="text-sm opacity-80">Fewest Points Needed</p>
              <p className="text-lg font-bold mt-1">{results.recommendations.cheapest_points.program}</p>
              <p className="text-sm opacity-90">{results.recommendations.cheapest_points.category}</p>
              <p className="text-2xl font-bold mt-2">{formatPoints(results.recommendations.cheapest_points.total_points)}</p>
              <p className="text-xs opacity-80 mt-1">Cash value: {formatINR(results.recommendations.cheapest_points.total_cash)}</p>
            </div>
          )}
          {results.recommendations.with_free_nights?.length > 0 && (
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white">
              <p className="text-sm opacity-80">Free Night Bonus</p>
              <p className="text-lg font-bold mt-1">{results.recommendations.with_free_nights[0].program}</p>
              <p className="text-sm opacity-90">{results.recommendations.with_free_nights[0].nights_free} night(s) free!</p>
              <p className="text-2xl font-bold mt-2">{formatINR(results.recommendations.with_free_nights[0].savings_from_free_nights)}</p>
              <p className="text-xs opacity-80 mt-1">saved with 5th-night-free</p>
            </div>
          )}
        </div>
      )}

      {/* Full comparison table */}
      {results && results.options && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              All Options — {results.city}, {results.nights} nights
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Points/Night</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Total Points</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Cash Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Total Cash</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">CPP Value</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">Free Night</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {results.options.map((opt: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{opt.program}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{opt.category}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatPoints(opt.points_per_night)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">{formatPoints(opt.total_points)}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatINR(opt.cash_rate_per_night)}/n</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatINR(opt.total_cash)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${opt.cpp_value >= 1.0 ? "text-green-600 dark:text-green-400" : "text-slate-600 dark:text-slate-400"}`}>
                        {opt.cpp_value}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {opt.fifth_night_free ? (
                        <span className="inline-block px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                          {opt.nights_free}N Free
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tips */}
      {!results && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Hotel Points Tips</h3>
          <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <li>Marriott Bonvoy: 5th night free on award stays (book 5, pay 4)</li>
            <li>Hilton Honors: 5th night free for all members</li>
            <li>IHG One Rewards: 4th night free for Platinum Elite+</li>
            <li>World of Hyatt: Best cpp value, especially at Category 1-4 properties</li>
            <li>Always compare cpp (cents per point) — above 1.0 is good, above 1.5 is excellent</li>
          </ul>
        </div>
      )}
    </div>
  );
}

const DEMO_RESULTS = {
  city: "Singapore",
  nights: 5,
  recommendations: {
    best_value: { program: "World of Hyatt", category: "Category 4", total_points: 60000, total_cash: 112500, cpp_value: 1.88 },
    cheapest_points: { program: "Hilton Honors", category: "Standard", total_points: 40000, total_cash: 62500, cpp_value: 1.56 },
    with_free_nights: [{ program: "Marriott Bonvoy", category: "Category 5", nights_free: 1, savings_from_free_nights: 18000, total_points: 100000 }],
  },
  options: [
    { program: "World of Hyatt", category: "Category 4", points_per_night: 15000, total_points: 60000, cash_rate_per_night: 22500, total_cash: 112500, cpp_value: 1.88, fifth_night_free: false, nights_free: 0 },
    { program: "Hilton Honors", category: "Standard", points_per_night: 10000, total_points: 40000, cash_rate_per_night: 12500, total_cash: 62500, cpp_value: 1.56, fifth_night_free: true, nights_free: 1 },
    { program: "Marriott Bonvoy", category: "Category 5", points_per_night: 25000, total_points: 100000, cash_rate_per_night: 18000, total_cash: 90000, cpp_value: 0.9, fifth_night_free: true, nights_free: 1 },
    { program: "Marriott Bonvoy", category: "Category 6", points_per_night: 40000, total_points: 160000, cash_rate_per_night: 28000, total_cash: 140000, cpp_value: 0.88, fifth_night_free: true, nights_free: 1 },
    { program: "IHG One Rewards", category: "Premium", points_per_night: 35000, total_points: 140000, cash_rate_per_night: 15000, total_cash: 75000, cpp_value: 0.54, fifth_night_free: false, nights_free: 0 },
  ],
};
