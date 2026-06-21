"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function SweetSpotsPage() {
  const [sweetSpots, setSweetSpots] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "transfers" | "airlines" | "hotels">("all");

  useEffect(() => {
    api.scanner.getSweetSpots()
      .then((res: any) => setSweetSpots(res))
      .catch(() => setSweetSpots(DEMO_SWEET_SPOTS))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />;
  }

  if (!sweetSpots) return null;

  const allSpots = [
    ...(sweetSpots.transfer_sweet_spots || []).map((s: any) => ({ ...s, category: "transfers" })),
    ...(sweetSpots.airline_sweet_spots || []).map((s: any) => ({ ...s, category: "airlines" })),
    ...(sweetSpots.hotel_sweet_spots || []).map((s: any) => ({ ...s, category: "hotels" })),
  ];

  const filtered = filter === "all" ? allSpots : allSpots.filter(s => s.category === filter);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sweet Spots</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">High-value redemption opportunities across programs</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "transfers", "airlines", "hotels"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f
                ? "bg-primary-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((spot: any, i: number) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${
                    spot.category === "transfers" ? "bg-blue-500" :
                    spot.category === "airlines" ? "bg-red-500" :
                    "bg-green-500"
                  }`}>
                    {spot.category.slice(0, 3).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{spot.name || spot.airline || spot.program}</h3>
              </div>
              <span className="text-2xl">
                {spot.category === "transfers" ? "🔄" :
                 spot.category === "airlines" ? "✈️" :
                 "🏨"}
              </span>
            </div>

            {/* Details */}
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
              {spot.description || spot.sweet_spot}
            </p>

            {/* Value */}
            <div className="space-y-2">
              {spot.value_proposition && (
                <div className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded p-2 font-medium">
                  {spot.value_proposition}
                </div>
              )}
              {spot.points_needed && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Points needed:</span> {spot.points_needed.toLocaleString()}
                </div>
              )}
              {spot.distance && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Route:</span> {spot.distance}
                </div>
              )}
              {spot.cpp && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">cpp:</span> {spot.cpp}
                </div>
              )}
            </div>

            {/* Why section */}
            {spot.why && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Why it&apos;s great:</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{spot.why}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">No sweet spots in this category yet</p>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What makes a sweet spot?</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>✓ <strong>High cpp:</strong> Redemption value significantly above program average</li>
          <li>✓ <strong>Availability:</strong> Reasonable award availability at key dates</li>
          <li>✓ <strong>Efficiency:</strong> Lower points needed than comparable redemptions</li>
          <li>✓ <strong>Partners:</strong> Using transfer partners to maximize value</li>
        </ul>
      </div>
    </div>
  );
}

const DEMO_SWEET_SPOTS = {
  transfer_sweet_spots: [
    {
      name: "HDFC to KrisFlyer",
      description: "Transfer HDFC Reward Points to KrisFlyer at 2:1 (or 10:4 with SmartBuy premium)",
      value_proposition: "Effective 0.4 ratio for direct transfers, best for airline bookings",
      why: "KrisFlyer has excellent premium cabin availability on Singapore Airlines and partner airlines",
      category: "transfers",
    },
    {
      name: "Amex to Avios 40% Bonus",
      description: "Transfer Amex MR to British Airways Avios during promotional period",
      value_proposition: "Get 1400 Avios per 1000 MR (+40% bonus)",
      why: "Avios value skyrockets during bonus periods, excellent for short-haul flights",
      category: "transfers",
    },
    {
      name: "Marriott to Airlines 3:1",
      description: "Transfer Marriott Bonvoy to multiple airlines at 3:1 ratio",
      value_proposition: "Get airline miles while keeping hotel benefits",
      why: "Flexible way to convert hotel points if you have excess before expiry",
      category: "transfers",
    },
  ],
  airline_sweet_spots: [
    {
      airline: "Singapore Airlines KrisFlyer",
      description: "Business class awards to London & Europe",
      distance: "DEL-LHR Business",
      points_needed: "75000 miles",
      cpp: "2.0+ cpp",
      value_proposition: "Premium cabin on world-class airline",
      why: "Only 75K for long-haul business on partner airlines, normally ₹2L+ cash",
      category: "airlines",
    },
    {
      airline: "Turkish Airlines",
      description: "Unlimited free stopovers on round-trip awards",
      distance: "Multi-city",
      points_needed: "70000 miles",
      cpp: "1.8+ cpp",
      value_proposition: "Visit multiple cities on one award",
      why: "Can visit 2-3 countries without extra miles — best for overland itineraries",
      category: "airlines",
    },
    {
      airline: "ANA (All Nippon Airways)",
      description: "F class awards to US at reasonable rates",
      distance: "DEL-SFO First",
      points_needed: "110000 miles",
      cpp: "2.5+ cpp",
      value_proposition: "First class to US cheaper than biz elsewhere",
      why: "Exceptional first class product at premium economy rates",
      category: "airlines",
    },
  ],
  hotel_sweet_spots: [
    {
      program: "World of Hyatt",
      description: "Category 1-4 properties in tier 1 destinations",
      distance: "5,000-15,000 points/night",
      cpp: "1.5-2.0+",
      value_proposition: "Best cpp values among hotel programs",
      why: "Hyatt portfolio includes high-quality properties in India & key destinations",
      category: "hotels",
    },
    {
      program: "Marriott Bonvoy",
      description: "Off-peak category 5 (5th night free)",
      distance: "50,000 points + 1 free",
      cpp: "1.0-1.2",
      value_proposition: "Free night effectively reduces points cost",
      why: "Fill off-peak dates with free 5th night to maximize value",
      category: "hotels",
    },
  ],
};
