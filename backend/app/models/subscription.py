from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class Subscription(Base):
    __tablename__ = 'subscriptions'

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(50), nullable=False, default='internal')
    plan = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default='pending')
    checkout_reference = Column(String(255), nullable=True)
    checkout_url = Column(String(500), nullable=True)
    external_customer_id = Column(String(255), nullable=True)
    external_subscription_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    user = relationship('User', back_populates='subscriptions')
