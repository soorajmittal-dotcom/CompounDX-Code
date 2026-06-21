from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import portfolio, optimizer, trips, cards, advisor

app = FastAPI(
    title=settings.app_name,
    description="Maximize credit card rewards, loyalty points, and elite status when planning trips",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolio.router)
app.include_router(optimizer.router)
app.include_router(trips.router)
app.include_router(cards.router)
app.include_router(advisor.router)


@app.get("/")
def root():
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "endpoints": {
            "portfolio": "/api/portfolio/summary",
            "transfer_graph": "/api/optimizer/transfer-graph",
            "trip_planner": "/api/trips/plan",
            "spend_optimizer": "/api/optimizer/spend",
            "cards": "/api/cards/",
            "advisor": "/api/advisor/query",
            "docs": "/docs",
        },
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
