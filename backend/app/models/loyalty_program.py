from sqlalchemy import Column, Integer, String, Float, JSON
from app.database import Base


class LoyaltyProgram(Base):
    __tablename__ = "loyalty_programs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    program_type = Column(String)  # airline, hotel, bank
    currency_name = Column(String)
    cpp_value = Column(Float)  # INR per point/mile
    transfer_partners = Column(JSON)
    award_chart = Column(JSON)
    elite_tiers = Column(JSON)
