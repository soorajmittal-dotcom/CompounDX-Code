# Travel Points Optimizer

A web platform that helps users maximize the value of their credit cards, loyalty points, memberships, and elite status when planning trips.

## Features

- **Points Portfolio Dashboard** — Track all your points, miles, and elite statuses in one place
- **Transfer Graph Engine** — Find optimal transfer paths between loyalty programs
- **Trip Planner** — Get 3 optimized trip options (Luxury / Balanced / Minimum Cash)
- **Spend Optimizer** — Know which card to use for every purchase category
- **Benefits Tracker** — Never miss unused card benefits worth lakhs annually
- **AI Travel Advisor** — Ask natural language questions about your points strategy

## Tech Stack

- **Backend**: Python + FastAPI, SQLite, NetworkX
- **Frontend**: Next.js 14, React, TailwindCSS
- **Data**: Comprehensive Indian credit card and loyalty program database

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m app.seed_db
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Supported Programs

### Credit Cards
HDFC Infinia, Diners Black, ICICI Sapphiro, Times Black, Axis Atlas, Magnus, Amex Platinum Travel, MRCC, SBI Aurum, and more.

### Airlines
KrisFlyer, Avios, Flying Blue, Emirates Skywards, Air India, United MileagePlus, and more.

### Hotels
Marriott Bonvoy, Hilton Honors, World of Hyatt, IHG One Rewards, Accor ALL.
