from sqlalchemy import Column, Integer, String, JSON, Float
from app.database import Base


class UserPortfolio(Base):
    __tablename__ = "user_portfolio"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="default")
    cards = Column(JSON, default=list)
    balances = Column(JSON, default=dict)
    elite_statuses = Column(JSON, default=dict)
    memberships = Column(JSON, default=list)
    home_airport = Column(String, default="DEL")
    monthly_spend = Column(JSON, default=dict)
    total_portfolio_value = Column(Float, default=0.0)
