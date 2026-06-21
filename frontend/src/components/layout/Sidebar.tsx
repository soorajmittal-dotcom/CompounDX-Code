"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/portfolio", label: "Portfolio", icon: "💳" },
  { href: "/trips", label: "Trip Planner", icon: "✈️" },
  { href: "/optimizer", label: "Optimizer", icon: "⚡" },
  { href: "/goals", label: "Goal Planner", icon: "🎯" },
  { href: "/scanner", label: "Scanner", icon: "🔍" },
  { href: "/cards", label: "Cards & Programs", icon: "🏦" },
  { href: "/advisor", label: "AI Advisor", icon: "🤖" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
            Travel Points
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Optimizer</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Points Net Worth
          </div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            ₹5.8 Lakh
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-50">
        <div className="flex justify-around py-2">
          {[navItems[0], navItems[1], navItems[2], navItems[3], navItems[7]].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-xs",
                pathname === item.href
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
