# Travel Points Optimizer

Maximize credit card rewards, loyalty points, and elite status when planning trips. A full-stack platform for Indian travelers with premium credit cards.

## Features

- **Portfolio Dashboard**: Track points across 20+ loyalty programs with real-time valuations
- **Trip Planner**: Generate 3 optimized trip options (luxury/balanced/minimum cash)
- **AI Advisor**: Natural language queries for transfer recommendations, trip planning, card optimization
- **Transfer Graph**: Interactive network visualization of 30+ transfer relationships
- **Hotel Comparisons**: Compare points vs cash across 5 hotel programs with 5th-night-free calculations
- **Spend Optimizer**: Card recommendations by spending category
- **Goal Planner**: Month-by-month roadmaps for award goals
- **Family Pooling**: Combine points and elite statuses across family members
- **Opportunity Scanner**: Detect transfer bonuses, card offers, expiring points

## Tech Stack

- **Backend**: FastAPI (Python) with NetworkX for transfer graph pathfinding
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, dark mode
- **Data**: JSON seed files (no external APIs needed for MVP)
- **Database**: SQLite (via SQLAlchemy ORM)

## Quick Start

### One-command startup

```bash
./dev.sh
```

This starts both services:
- Backend: http://localhost:8000 (API docs at /docs)
- Frontend: http://localhost:3000

### Manual setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app
│   │   ├── routers/                   # API endpoints (7 routers)
│   │   ├── engine/                    # Core engines (9 engines)
│   │   └── data/                      # Cards, transfer partners, valuations, knowledge base
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                       # Next.js pages (14 pages)
│   │   ├── components/                # Reusable components
│   │   └── lib/                       # API client, utils, types
│   └── package.json
└── dev.sh
```

## Pages

| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/` | Portfolio summary, points net worth |
| Portfolio | `/portfolio` | Card benefits, annual value, ROI |
| Trip Planner | `/trips` | Plan trips with award options |
| Optimizer | `/optimizer` | Spend optimization & transfer graph |
| Goal Planner | `/goals` | Month-by-month roadmaps |
| Hotel Compare | `/hotels` | Compare programs by city/nights |
| Scanner | `/scanner` | Opportunities, expiry alerts, renewal analysis |
| Cards | `/cards` | Browse all cards, see benefits |
| Profile | `/profile` | User profile, family pooling |
| Advisor | `/advisor` | AI chat for natural language queries |

## API Endpoints

### Core
- `GET /api/portfolio/summary` — user points portfolio
- `POST /api/optimizer/spend` — card recommendations by spend
- `POST /api/optimizer/transfer-path` — find transfer routes
- `GET /api/optimizer/transfer-graph` — full transfer network
- `POST /api/trips/plan` — trip planning with 3 options

### Hotels & Cards
- `POST /api/optimizer/hotels` — compare hotel programs
- `GET /api/cards/` — list all cards
- `POST /api/cards/recommend` — new card recommendations
- `GET /api/cards/valuations` — point valuations

### Advisor & Insights
- `POST /api/advisor/query` — AI advisor with 8 intents
- `GET /api/scanner/opportunities` — transfer bonuses, sweet spots
- `GET /api/scanner/expiry` — expiring points alerts
- `GET /api/scanner/promotions` — active transfer bonuses

### User
- `GET /api/user/profile` — user profile
- `GET /api/user/family` — family pool
- `GET /api/user/family/valuation` — combined family value

## Demo Data

All pages work without backend running (fallback demo data included):
- 10 Indian credit cards (HDFC, Amex, Axis, ICICI, SBI, IndusInd)
- 30+ transfer relationships with ratios
- 20 loyalty programs with valuations
- 50+ sweet spot recommendations
- Sample user portfolio with 5 cards, ₹6.87L in points

## Key Algorithms

### Transfer Graph
- NetworkX directed graph with weighted edges (conversion ratios)
- Dijkstra's algorithm for best path finding
- Multi-hop transfers supported

### Points Valuator
- Per-program cents-per-point (cpp) valuation
- Portfolio value in INR based on realistic redemption values

### Trip Planner
- 3 tiers: Maximum Luxury (biz), Balanced Value (prem eco), Minimum Cash (eco + points)
- Compares points cost vs direct cash booking

### Spend Optimizer
- Maps spending categories to card bonus categories
- Recommends optimal card per category for net annual value

## Supported Programs

### Credit Cards
HDFC Infinia, Diners Black, ICICI Sapphiro, Times Black, Axis Atlas, Magnus, Amex Platinum Travel, MRCC, SBI Aurum, IndusInd Legend

### Airlines
KrisFlyer, Avios, Flying Blue, Emirates Skywards, Air India, United MileagePlus, Turkish Miles, Etihad Guest

### Hotels
Marriott Bonvoy, Hilton Honors, World of Hyatt, IHG One Rewards, Accor ALL

## Testing

```bash
cd backend && python -c "from app.main import app; print('Backend OK')"
cd frontend && npm run build
```

## Next Steps

- Real database persistence & user authentication
- Historical tracking & trends
- Email reports & notifications
- Mobile PWA
- Real award search integration

