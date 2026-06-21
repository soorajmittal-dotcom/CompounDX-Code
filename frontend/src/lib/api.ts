const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  portfolio: {
    getSummary: () => fetchAPI("/api/portfolio/summary"),
    getBenefits: () => fetchAPI("/api/portfolio/benefits"),
    getUnusedBenefits: () => fetchAPI("/api/portfolio/unused-benefits"),
    getFeeJustification: (cardId: number) => fetchAPI(`/api/portfolio/fee-justification/${cardId}`),
  },
  optimizer: {
    getTransferPath: (source: string, target: string, points: number) =>
      fetchAPI("/api/optimizer/transfer-path", {
        method: "POST",
        body: JSON.stringify({ source, target, points }),
      }),
    getTransferGraph: () => fetchAPI("/api/optimizer/transfer-graph"),
    getReachable: (program: string) => fetchAPI(`/api/optimizer/reachable/${encodeURIComponent(program)}`),
    optimizeSpend: (monthlySpend: Record<string, number>, userCards?: number[]) =>
      fetchAPI("/api/optimizer/spend", {
        method: "POST",
        body: JSON.stringify({ monthly_spend: monthlySpend, user_cards: userCards }),
      }),
    compareHotels: (city: string, nights: number) =>
      fetchAPI("/api/optimizer/hotels", {
        method: "POST",
        body: JSON.stringify({ city, nights }),
      }),
  },
  trips: {
    plan: (origin: string, destination: string, nights: number, travelers: number, balances?: Record<string, number>) =>
      fetchAPI("/api/trips/plan", {
        method: "POST",
        body: JSON.stringify({ origin, destination, nights, travelers, user_balances: balances }),
      }),
    searchFlights: (origin: string, destination: string, cabin: string, travelers: number) =>
      fetchAPI("/api/trips/search-flights", {
        method: "POST",
        body: JSON.stringify({ origin, destination, cabin, travelers }),
      }),
  },
  cards: {
    list: () => fetchAPI("/api/cards/"),
    get: (id: number) => fetchAPI(`/api/cards/${id}`),
    getAirlinePrograms: () => fetchAPI("/api/cards/programs/airlines"),
    getHotelPrograms: () => fetchAPI("/api/cards/programs/hotels"),
    getValuations: () => fetchAPI("/api/cards/valuations"),
    recommend: (monthlySpend: Record<string, number>, currentCards: number[]) =>
      fetchAPI("/api/cards/recommend", {
        method: "POST",
        body: JSON.stringify({ monthly_spend: monthlySpend, current_cards: currentCards }),
      }),
  },
  advisor: {
    query: (q: string) =>
      fetchAPI("/api/advisor/query", {
        method: "POST",
        body: JSON.stringify({ query: q }),
      }),
  },
  scanner: {
    getOpportunities: () => fetchAPI("/api/scanner/opportunities"),
    getExpiry: () => fetchAPI("/api/scanner/expiry"),
    getRenewalAll: () => fetchAPI("/api/scanner/renewal/all"),
    getSweetSpots: () => fetchAPI("/api/scanner/sweet-spots"),
    getPromotions: () => fetchAPI("/api/scanner/promotions"),
    getMemberships: () => fetchAPI("/api/scanner/memberships"),
    createGoal: (destination: string, targetDate: string, cabin: string, travelers: number) =>
      fetchAPI("/api/scanner/goal", {
        method: "POST",
        body: JSON.stringify({ destination, target_date: targetDate, cabin, travelers }),
      }),
  },
  user: {
    getProfile: () => fetchAPI("/api/user/profile"),
    updateProfile: (profile: any) =>
      fetchAPI("/api/user/profile", {
        method: "POST",
        body: JSON.stringify(profile),
      }),
    getFamily: () => fetchAPI("/api/user/family"),
    addFamilyMember: (member: any) =>
      fetchAPI("/api/user/family/member", {
        method: "POST",
        body: JSON.stringify(member),
      }),
    getFamilyValuation: () => fetchAPI("/api/user/family/valuation"),
  },
};
