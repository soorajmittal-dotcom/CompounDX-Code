from sqlalchemy import Column, Integer, String, Float, JSON
from app.database import Base


class CreditCard(Base):
    __tablename__ = "credit_cards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    bank = Column(String)
    network = Column(String)
    annual_fee = Column(Integer)
    points_currency = Column(String)
    base_earn_rate = Column(Float)
    bonus_categories = Column(JSON)
    benefits = Column(JSON)
    transfer_partners = Column(JSON)
    image_color = Column(String, default="#1a1a2e")
