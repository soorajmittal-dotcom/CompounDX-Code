"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import type { CreditCard } from "@/lib/types";

export default function CardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);

  useEffect(() => {
    api.cards.list()
      .then((res: any) => setCards(res.cards || []))
      .catch(() => setCards(DEMO_CARDS as any))
      .finally(() => setLoading(false));
  }, []);

  const displayCards = cards.length > 0 ? cards : DEMO_CARDS;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cards & Programs</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Explore credit cards and their transfer partners</p>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayCards.map((card: any) => (
          <div
            key={card.id}
            onClick={() => setSelectedCard(card)}
            className="cursor-pointer group"
          >
            <div
              className="rounded-xl p-5 text-white transition-transform group-hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${card.image_color}, ${card.image_color}dd)` }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm opacity-80">{card.bank}</p>
                  <p className="text-lg font-bold mt-1">{card.name}</p>
                </div>
                <p className="text-xs opacity-70">{card.network}</p>
              </div>
              <div className="mt-6 flex justify-between items-end">
                <div>
                  <p className="text-xs opacity-70">Annual Fee</p>
                  <p className="font-semibold">{formatINR(card.annual_fee)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-70">Base Earn</p>
                  <p className="font-semibold">{card.base_earn_rate}x</p>
                </div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(card.transfer_partners || []).slice(0, 3).map((p: string) => (
                <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {p}
                </span>
              ))}
              {(card.transfer_partners || []).length > 3 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                  +{card.transfer_partners.length - 3} more
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCard(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedCard.bank}</p>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedCard.name}</h2>
              </div>
              <button onClick={() => setSelectedCard(null)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400">Annual Fee</p>
                <p className="font-bold text-slate-900 dark:text-white">{formatINR(selectedCard.annual_fee)}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400">Points Currency</p>
                <p className="font-bold text-slate-900 dark:text-white text-xs">{selectedCard.points_currency}</p>
              </div>
            </div>

            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Bonus Categories</h3>
            <div className="space-y-1 mb-4">
              {Object.entries(selectedCard.bonus_categories || {}).map(([cat, rate]) => (
                <div key={cat} className="flex justify-between text-sm py-1">
                  <span className="text-slate-600 dark:text-slate-300 capitalize">{cat.replace(/_/g, " ")}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{rate}x</span>
                </div>
              ))}
            </div>

            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Benefits</h3>
            <div className="space-y-2 mb-4">
              {(selectedCard.benefits || []).map((b: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm py-1">
                  <span className="text-slate-600 dark:text-slate-300">{b.description}</span>
                  <span className="text-green-600 dark:text-green-400 font-medium whitespace-nowrap ml-2">
                    {formatINR(b.annual_value)}
                  </span>
                </div>
              ))}
            </div>

            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Transfer Partners</h3>
            <div className="flex flex-wrap gap-2">
              {(selectedCard.transfer_partners || []).map((p: string) => (
                <span key={p} className="text-xs px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DEMO_CARDS = [
  { id: 1, name: "HDFC Infinia", bank: "HDFC", network: "Visa Infinite", annual_fee: 12500, points_currency: "HDFC Reward Points", base_earn_rate: 3.33, bonus_categories: { smartbuy: 33, travel: 3.33, dining: 3.33 }, benefits: [{ type: "lounge", description: "Unlimited lounge access", annual_value: 50000 }, { type: "golf", description: "Golf rounds (6/yr)", annual_value: 30000 }], transfer_partners: ["KrisFlyer", "Flying Blue", "Emirates", "Avios", "Marriott"], image_color: "#1a237e" },
  { id: 2, name: "HDFC Diners Black", bank: "HDFC", network: "Diners Club", annual_fee: 10000, points_currency: "HDFC Reward Points", base_earn_rate: 3.33, bonus_categories: { smartbuy_10x: 33, dining: 3.33 }, benefits: [{ type: "lounge", description: "Unlimited lounge", annual_value: 40000 }], transfer_partners: ["KrisFlyer", "Flying Blue", "Emirates", "Avios", "Marriott"], image_color: "#212121" },
  { id: 4, name: "Axis Atlas", bank: "Axis", network: "Visa Infinite", annual_fee: 5000, points_currency: "Axis EDGE Miles", base_earn_rate: 5.0, bonus_categories: { travel_portals: 15, all_spends: 5 }, benefits: [{ type: "lounge", description: "16 lounge visits/yr", annual_value: 20000 }, { type: "forex", description: "0% forex markup", annual_value: 20000 }], transfer_partners: ["KrisFlyer", "Flying Blue", "Emirates", "Turkish", "Etihad"], image_color: "#880e4f" },
  { id: 5, name: "Axis Magnus", bank: "Axis", network: "Visa Infinite", annual_fee: 12500, points_currency: "Axis EDGE Rewards", base_earn_rate: 12.0, bonus_categories: { travel: 35, all_spends: 12 }, benefits: [{ type: "lounge", description: "Unlimited lounge", annual_value: 50000 }, { type: "meet_greet", description: "Airport meet & greet", annual_value: 20000 }], transfer_partners: ["KrisFlyer", "Flying Blue", "Emirates"], image_color: "#4a148c" },
  { id: 6, name: "Amex Platinum Travel", bank: "American Express", network: "Amex", annual_fee: 5000, points_currency: "Amex MR", base_earn_rate: 5.0, bonus_categories: { travel_amex: 15, all_spends: 5 }, benefits: [{ type: "lounge", description: "Priority Pass", annual_value: 20000 }, { type: "travel_credit", description: "₹6K travel credit", annual_value: 6000 }], transfer_partners: ["KrisFlyer", "Avios", "Emirates", "Marriott", "Hilton"], image_color: "#006064" },
  { id: 7, name: "Amex MRCC", bank: "American Express", network: "Amex", annual_fee: 3500, points_currency: "Amex MR", base_earn_rate: 2.0, bonus_categories: { groceries: 5, departmental: 5 }, benefits: [{ type: "milestone", description: "Bonus MR at milestones", annual_value: 8000 }], transfer_partners: ["KrisFlyer", "Avios", "Emirates", "Marriott", "Hilton"], image_color: "#1b5e20" },
];
