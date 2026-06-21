export interface CreditCard {
  id: number;
  name: string;
  bank: string;
  network: string;
  annual_fee: number;
  points_currency: string;
  base_earn_rate: number;
  bonus_categories: Record<string, number>;
  benefits: CardBenefit[];
  transfer_partners: string[];
  image_color: string;
}

export interface CardBenefit {
  type: string;
  description: string;
  annual_value: number;
}

export interface PointBalance {
  program: string;
  balance: number;
  cpp_inr: number;
  value_inr: number;
  transfer_value_inr: number;
  best_use: string;
}

export interface PortfolioSummary {
  valuation: {
    total_value_inr: number;
    total_value_formatted: string;
    programs_count: number;
    breakdown: PointBalance[];
  };
  cards_held: number[];
  elite_statuses: Record<string, string>;
  home_airport: string;
  benefits_summary: {
    total_value: number;
    total_fees: number;
    roi: number;
  };
}

export interface TransferPath {
  route: string[];
  effective_ratio: number;
  points_delivered: number;
  time_days: number;
  steps: TransferStep[];
}

export interface TransferStep {
  from: string;
  to: string;
  ratio: number;
  ratio_display: string;
  time_days: number;
  notes: string;
}

export interface GraphData {
  nodes: { id: string; type: string }[];
  edges: { source: string; target: string; ratio: number; ratio_display: string; time_days: number }[];
}

export interface TripOption {
  name: string;
  description: string;
  flights: FlightOption[];
  hotels: HotelOption[];
  total_points: number;
  total_cash_inr: number;
  total_value_if_cash: number;
  savings_inr: number;
  points_programs_used: string[];
}

export interface FlightOption {
  airline: string;
  program: string;
  cabin: string;
  points: number;
  taxes: number;
  cash_price: number;
  cpp: number;
}

export interface HotelOption {
  hotel: string;
  program: string;
  nights: number;
  points: number;
  cash_rate: number;
  total_cash_price: number;
  cpp: number;
  fifth_night_free: boolean;
}

export interface SpendRecommendation {
  category: string;
  monthly_spend: number;
  recommended_card: string;
  card_bank: string;
  earn_rate: number;
  points_currency: string;
  monthly_points: number;
  annual_value_inr: number;
  image_color: string;
}

export interface AdvisorResponse {
  query: string;
  intent: string;
  response: {
    type: string;
    message: string;
    data?: any;
    recommendation?: string;
    summary?: any;
    top_recommendations?: any;
  };
  suggestions: string[];
}
