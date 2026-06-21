"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatPoints } from "@/lib/utils";

interface FamilyMember {
  name: string;
  relationship: string;
  cards: number[];
  balances: Record<string, number>;
  elite_statuses: Record<string, string>;
}

interface FamilyData {
  members: FamilyMember[];
  combined_balances: Record<string, number>;
  combined_cards: number[];
  all_statuses: Record<string, Record<string, string>>;
  total_members: number;
}

interface FamilyValuation {
  members: { name: string; relationship: string; value: number; programs: number; cards: number }[];
  total_family_value: number;
  total_family_value_formatted: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [valuation, setValuation] = useState<FamilyValuation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "family" | "spending">("profile");

  useEffect(() => {
    Promise.all([
      api.user.getProfile().catch(() => null),
      api.user.getFamily().catch(() => null),
      api.user.getFamilyValuation().catch(() => null),
    ]).then(([p, f, v]) => {
      setProfile(p || DEMO_PROFILE);
      setFamily(f as FamilyData || DEMO_FAMILY);
      setValuation(v as FamilyValuation || DEMO_VALUATION);
      setLoading(false);
    });
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

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile & Family</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your cards, points, and family pool</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["profile", "family", "spending"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? "bg-primary-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            {tab === "spending" ? "Monthly Spending" : tab}
          </button>
        ))}
      </div>

      {activeTab === "profile" && profile && (
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                {profile.name?.charAt(0) || "U"}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Home Airport: {profile.home_airport}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{profile.cards?.length || 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cards</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{Object.keys(profile.balances || {}).length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Programs</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Object.keys(profile.elite_statuses || {}).length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Elite Statuses</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{profile.memberships?.length || 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Memberships</p>
              </div>
            </div>
          </div>

          {/* Points Balances */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Points Balances</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(profile.balances || {}).map(([program, balance]) => (
                <div key={program} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{program}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formatPoints(balance as number)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Elite Statuses */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Elite Statuses</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(profile.elite_statuses || {}).map(([program, tier]) => (
                <div key={program} className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">{program}</p>
                  <p className="text-lg font-bold text-amber-900 dark:text-amber-100 mt-1">{tier as string}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Memberships */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Memberships</h3>
            <div className="flex flex-wrap gap-2">
              {(profile.memberships || []).map((m: string) => (
                <span key={m} className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Card Renewal Dates */}
          {profile.card_renewal_dates && Object.keys(profile.card_renewal_dates).length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Card Renewal Dates</h3>
              <div className="space-y-2">
                {Object.entries(profile.card_renewal_dates).map(([card, date]) => {
                  const renewalDate = new Date(date as string);
                  const now = new Date();
                  const daysUntil = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysUntil <= 60;
                  return (
                    <div key={card} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{card}</span>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${isUrgent ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
                          {date as string}
                        </span>
                        <span className={`ml-2 text-xs ${isUrgent ? "text-red-500" : "text-slate-400"}`}>
                          ({daysUntil > 0 ? `${daysUntil}d` : "Expired"})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "family" && family && (
        <div className="space-y-6">
          {/* Family Value Summary */}
          {valuation && (
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
              <p className="text-sm opacity-80">Combined Family Points Value</p>
              <p className="text-3xl font-bold mt-1">{valuation.total_family_value_formatted}</p>
              <p className="text-sm opacity-80 mt-2">{valuation.members.length} members pooling points</p>
            </div>
          )}

          {/* Family Members */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {family.members.map((member) => {
              const memberVal = valuation?.members.find(m => m.name === member.name);
              return (
                <div key={member.name} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{member.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{member.relationship}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Cards</span>
                      <span className="font-medium text-slate-900 dark:text-white">{member.cards.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Programs</span>
                      <span className="font-medium text-slate-900 dark:text-white">{Object.keys(member.balances).length}</span>
                    </div>
                    {memberVal && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Value</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{formatINR(memberVal.value)}</span>
                      </div>
                    )}
                  </div>
                  {Object.keys(member.elite_statuses).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                      {Object.entries(member.elite_statuses).map(([prog, tier]) => (
                        <span key={prog} className="inline-block mr-2 mb-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs rounded-full">
                          {prog.split(" ")[0]} {tier}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Combined Balances */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Combined Family Balances</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(family.combined_balances)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([program, balance]) => (
                  <div key={program} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{program}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{formatPoints(balance as number)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Status Overview */}
          {family.all_statuses && Object.keys(family.all_statuses).length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Family Status Overview</h3>
              <div className="space-y-3">
                {Object.entries(family.all_statuses).map(([program, members]) => (
                  <div key={program} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="font-medium text-slate-900 dark:text-white text-sm mb-2">{program}</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(members).map(([name, tier]) => (
                        <span key={name} className="text-xs px-2 py-1 bg-white dark:bg-slate-600 rounded border border-slate-200 dark:border-slate-500 text-slate-700 dark:text-slate-200">
                          {name}: <strong>{tier}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "spending" && profile && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Monthly Spending Pattern</h3>
            <div className="space-y-3">
              {Object.entries(profile.monthly_spend || {})
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([category, amount]) => {
                  const total = Object.values(profile.monthly_spend || {}).reduce((s: number, v: any) => s + v, 0);
                  const pct = total > 0 ? ((amount as number) / total) * 100 : 0;
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{category}</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatINR(amount as number)}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between">
              <span className="font-medium text-slate-900 dark:text-white">Total Monthly</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatINR(Object.values(profile.monthly_spend || {}).reduce((s: number, v: any) => s + v, 0))}
              </span>
            </div>
          </div>

          {/* Category Icons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SPEND_CATEGORIES.map(cat => {
              const amount = profile.monthly_spend?.[cat.key] || 0;
              return (
                <div key={cat.key} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-2xl">{cat.icon}</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-2 capitalize">{cat.key}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatINR(amount)}/mo</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const SPEND_CATEGORIES = [
  { key: "travel", icon: "✈️" },
  { key: "dining", icon: "🍽️" },
  { key: "groceries", icon: "🛒" },
  { key: "fuel", icon: "⛽" },
  { key: "utilities", icon: "💡" },
  { key: "online", icon: "🛍️" },
  { key: "international", icon: "🌍" },
  { key: "entertainment", icon: "🎬" },
];

const DEMO_PROFILE = {
  name: "Default User",
  home_airport: "DEL",
  cards: [1, 2, 4, 6, 7],
  balances: {
    "HDFC Reward Points": 350000,
    "Amex Membership Rewards": 120000,
    "Axis EDGE Miles": 80000,
    "KrisFlyer": 45000,
    "Marriott Bonvoy": 120000,
    "British Airways Avios": 35000,
    "World of Hyatt": 25000,
  },
  elite_statuses: { "Marriott Bonvoy": "Gold", "KrisFlyer": "Silver", "Hilton Honors": "Gold" },
  memberships: ["Priority Pass", "DreamFolks", "Club Marriott"],
  monthly_spend: { travel: 50000, dining: 30000, groceries: 25000, fuel: 10000, utilities: 15000, online: 20000, international: 15000, entertainment: 10000 },
  card_renewal_dates: { "HDFC Infinia": "2027-01-15", "HDFC Diners Black": "2026-11-20", "Axis Atlas": "2027-03-10", "Amex Platinum Travel": "2026-09-01", "Amex MRCC": "2026-12-15" },
};

const DEMO_FAMILY: FamilyData = {
  members: [
    { name: "Self", relationship: "self", cards: [1, 2, 4, 6, 7], balances: { "HDFC Reward Points": 350000, "Amex Membership Rewards": 120000, "Axis EDGE Miles": 80000, "KrisFlyer": 45000 }, elite_statuses: { "Marriott Bonvoy": "Gold", "KrisFlyer": "Silver" } },
    { name: "Spouse", relationship: "spouse", cards: [3, 8], balances: { "ICICI Reward Points": 85000, "SBI Reward Points": 45000, "Marriott Bonvoy": 60000 }, elite_statuses: { "Marriott Bonvoy": "Silver" } },
    { name: "Parent", relationship: "parent", cards: [9], balances: { "ICICI Reward Points": 40000, "Air India": 25000 }, elite_statuses: {} },
  ],
  combined_balances: { "HDFC Reward Points": 350000, "ICICI Reward Points": 125000, "Amex Membership Rewards": 120000, "Axis EDGE Miles": 80000, "Marriott Bonvoy": 60000, "KrisFlyer": 45000, "SBI Reward Points": 45000, "Air India": 25000 },
  combined_cards: [1, 2, 3, 4, 6, 7, 8, 9],
  all_statuses: { "Marriott Bonvoy": { "Self": "Gold", "Spouse": "Silver" }, "KrisFlyer": { "Self": "Silver" } },
  total_members: 3,
};

const DEMO_VALUATION: FamilyValuation = {
  members: [
    { name: "Self", relationship: "self", value: 480000, programs: 4, cards: 5 },
    { name: "Spouse", relationship: "spouse", value: 145000, programs: 3, cards: 2 },
    { name: "Parent", relationship: "parent", value: 62000, programs: 2, cards: 1 },
  ],
  total_family_value: 687000,
  total_family_value_formatted: "₹6,87,000",
};
