"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";

export default function PortfolioPage() {
  const [benefits, setBenefits] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.portfolio.getBenefits()
      .then((res: any) => setBenefits(res))
      .catch(() => setBenefits(null))
      .finally(() => setLoading(false));
  }, []);

  const displayBenefits = benefits || DEMO_BENEFITS;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Portfolio & Benefits</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track all card benefits and their annual value</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Benefits Value</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {formatINR(displayBenefits.total_annual_value)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Annual Fees</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatINR(displayBenefits.total_annual_fees)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Net Value</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {formatINR(displayBenefits.net_value)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">ROI on Fees</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {displayBenefits.roi_percentage}%
          </p>
        </div>
      </div>

      {/* Benefits by Type */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Benefits by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(displayBenefits.by_type || {}).map(([type, items]: [string, any]) => (
            <div key={type} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-slate-900 dark:text-white capitalize">{type.replace(/_/g, " ")}</h3>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  {formatINR(items.reduce((sum: number, b: any) => sum + b.annual_value, 0))}
                </span>
              </div>
              <div className="space-y-1">
                {items.slice(0, 3).map((benefit: any, i: number) => (
                  <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex justify-between">
                    <span className="truncate mr-2">{benefit.card_name}: {benefit.description}</span>
                    <span className="text-slate-500 whitespace-nowrap">{formatINR(benefit.annual_value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Benefits List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">All Card Benefits</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="pb-3 font-medium">Card</th>
                <th className="pb-3 font-medium">Benefit</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium text-right">Annual Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {(displayBenefits.benefits || []).slice(0, 20).map((b: any, i: number) => (
                <tr key={i}>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.image_color || "#3b82f6" }} />
                      <span className="font-medium text-slate-900 dark:text-white">{b.card_name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{b.description}</td>
                  <td className="py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
                      {b.type}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium text-green-600 dark:text-green-400">{formatINR(b.annual_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const DEMO_BENEFITS = {
  total_annual_value: 243000,
  total_annual_fees: 49500,
  net_value: 193500,
  roi_percentage: 490.9,
  by_type: {
    lounge: [
      { card_name: "HDFC Infinia", description: "Unlimited domestic & international lounge access", annual_value: 50000, image_color: "#1a237e" },
      { card_name: "HDFC Diners Black", description: "Unlimited lounge access", annual_value: 40000, image_color: "#212121" },
      { card_name: "Axis Atlas", description: "8 international + 8 domestic visits/year", annual_value: 20000, image_color: "#880e4f" },
    ],
    golf: [
      { card_name: "HDFC Infinia", description: "Complimentary golf rounds (6/year)", annual_value: 30000, image_color: "#1a237e" },
      { card_name: "HDFC Diners Black", description: "Complimentary golf (6/year)", annual_value: 30000, image_color: "#212121" },
    ],
    insurance: [
      { card_name: "HDFC Infinia", description: "Travel insurance up to ₹2 Cr", annual_value: 5000, image_color: "#1a237e" },
      { card_name: "Amex Platinum Travel", description: "Comprehensive travel insurance", annual_value: 5000, image_color: "#006064" },
    ],
    milestone: [
      { card_name: "HDFC Infinia", description: "2 complimentary hotel nights on ₹10L spend", annual_value: 40000, image_color: "#1a237e" },
      { card_name: "HDFC Diners Black", description: "Annual memberships on spend", annual_value: 20000, image_color: "#212121" },
    ],
    forex: [
      { card_name: "Axis Atlas", description: "0% forex markup on international spends", annual_value: 20000, image_color: "#880e4f" },
      { card_name: "HDFC Infinia", description: "1.99% forex markup (low)", annual_value: 15000, image_color: "#1a237e" },
    ],
  },
  benefits: [
    { card_name: "HDFC Infinia", description: "Unlimited domestic & international lounge access", type: "lounge", annual_value: 50000, image_color: "#1a237e" },
    { card_name: "HDFC Infinia", description: "2 complimentary hotel nights on ₹10L spend", type: "milestone", annual_value: 40000, image_color: "#1a237e" },
    { card_name: "HDFC Diners Black", description: "Unlimited lounge access", type: "lounge", annual_value: 40000, image_color: "#212121" },
    { card_name: "HDFC Infinia", description: "Complimentary golf rounds (6/year)", type: "golf", annual_value: 30000, image_color: "#1a237e" },
    { card_name: "HDFC Diners Black", description: "Complimentary golf (6/year)", type: "golf", annual_value: 30000, image_color: "#212121" },
    { card_name: "Axis Atlas", description: "0% forex markup", type: "forex", annual_value: 20000, image_color: "#880e4f" },
    { card_name: "Axis Atlas", description: "8 intl + 8 domestic lounge visits", type: "lounge", annual_value: 20000, image_color: "#880e4f" },
    { card_name: "HDFC Diners Black", description: "Annual memberships on spend", type: "milestone", annual_value: 20000, image_color: "#212121" },
  ],
};
