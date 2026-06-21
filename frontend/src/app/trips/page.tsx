"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatPoints } from "@/lib/utils";
import type { TripOption } from "@/lib/types";

const AIRPORTS = [
  { code: "DEL", name: "New Delhi" },
  { code: "BOM", name: "Mumbai" },
  { code: "BLR", name: "Bangalore" },
  { code: "MAA", name: "Chennai" },
  { code: "HYD", name: "Hyderabad" },
];

const DESTINATIONS = [
  { code: "SIN", name: "Singapore" },
  { code: "NRT", name: "Tokyo" },
  { code: "ICN", name: "Seoul" },
  { code: "BKK", name: "Bangkok" },
  { code: "DXB", name: "Dubai" },
  { code: "LHR", name: "London" },
  { code: "JFK", name: "New York" },
];

export default function TripsPage() {
  const [origin, setOrigin] = useState("DEL");
  const [destination, setDestination] = useState("SIN");
  const [nights, setNights] = useState(5);
  const [travelers, setTravelers] = useState(1);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await api.trips.plan(origin, destination, nights, travelers);
      setResults(res);
    } catch {
      setResults(null);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trip Planner</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Get 3 optimized options for your next trip</p>
      </div>

      {/* Search Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">From</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white"
            >
              {AIRPORTS.map((a) => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">To</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white"
            >
              {DESTINATIONS.map((a) => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nights</label>
            <input
              type="number"
              value={nights}
              onChange={(e) => setNights(Number(e.target.value))}
              min={1}
              max={30}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
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
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Searching..." : "Find Options"}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {results.origin} → {results.destination} ({results.nights} nights, {results.travelers} traveler{results.travelers > 1 ? "s" : ""})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {results.options.map((option: TripOption, idx: number) => (
              <TripOptionCard key={idx} option={option} rank={idx} />
            ))}
          </div>
        </div>
      )}

      {!results && !loading && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <p className="text-4xl mb-4">✈️</p>
          <p className="text-lg font-medium">Where are you headed?</p>
          <p className="text-sm mt-2">Select your trip details above to see optimized options</p>
        </div>
      )}
    </div>
  );
}

function TripOptionCard({ option, rank }: { option: TripOption; rank: number }) {
  const colors = [
    "border-amber-400 dark:border-amber-500",
    "border-blue-400 dark:border-blue-500",
    "border-green-400 dark:border-green-500",
  ];
  const badges = [
    { label: "Luxury", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
    { label: "Best Value", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    { label: "Min Cash", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  ];

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl p-5 border-2 ${colors[rank]} border-slate-200 dark:border-slate-700`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white">{option.name}</h3>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${badges[rank].color}`}>
          {badges[rank].label}
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{option.description}</p>

      {/* Flights */}
      {option.flights.map((f, i) => (
        <div key={i} className="mb-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{f.airline}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{f.cabin} • {f.program}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{formatPoints(f.points)} pts</p>
              <p className="text-xs text-slate-500">+ {formatINR(f.taxes)} taxes</p>
            </div>
          </div>
        </div>
      ))}

      {/* Hotels */}
      {option.hotels.map((h, i) => (
        <div key={i} className="mb-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{h.hotel}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {h.nights} nights {h.fifth_night_free && "• 5th night FREE"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{formatPoints(h.points)} pts</p>
              <p className="text-xs text-slate-500">{h.cpp} INR/pt</p>
            </div>
          </div>
        </div>
      ))}

      {/* Totals */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Total Points</span>
          <span className="font-bold text-slate-900 dark:text-white">{formatPoints(option.total_points)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-slate-600 dark:text-slate-400">Cash Outflow</span>
          <span className="font-medium text-slate-900 dark:text-white">{formatINR(option.total_cash_inr)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-slate-600 dark:text-slate-400">Cash Price Would Be</span>
          <span className="line-through text-slate-400">{formatINR(option.total_value_if_cash)}</span>
        </div>
        <div className="flex justify-between text-sm mt-2 pt-2 border-t border-slate-100 dark:border-slate-600">
          <span className="text-green-600 dark:text-green-400 font-medium">You Save</span>
          <span className="font-bold text-green-600 dark:text-green-400">{formatINR(option.savings_inr)}</span>
        </div>
      </div>
    </div>
  );
}
