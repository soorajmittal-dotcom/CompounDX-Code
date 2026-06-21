export function formatINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatPoints(points: number): string {
  if (points >= 100000) {
    return `${(points / 1000).toFixed(0)}K`;
  }
  return points.toLocaleString("en-IN");
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
