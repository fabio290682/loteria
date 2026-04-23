from sqlalchemy import Boolean, Column, DateTime, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    plan = Column(String(50), default='starter', nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    generated_games = relationship('GeneratedGame', back_populates='user', cascade='all, delete-orphan')
    subscriptions = relationship('Subscription', back_populates='user', cascade='all, delete-orphan')
    owned_pools = relationship('Pool', back_populates='owner', cascade='all, delete-orphan')
    pool_memberships = relationship('PoolMember', back_populates='user', cascade='all, delete-orphan')
