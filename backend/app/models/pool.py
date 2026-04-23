from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class Pool(Base):
    __tablename__ = 'pools'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(140), nullable=False)
    lottery_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    quota_value = Column(Numeric(10, 2), nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    owner_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    owner = relationship('User', back_populates='owned_pools')
    members = relationship('PoolMember', back_populates='pool', cascade='all, delete-orphan')
    games = relationship('GeneratedGame', back_populates='pool')


class PoolMember(Base):
    __tablename__ = 'pool_members'

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(30), nullable=False, default='member')
    quota_count = Column(Integer, nullable=False, default=1)
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    pool_id = Column(Integer, ForeignKey('pools.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)

    pool = relationship('Pool', back_populates='members')
    user = relationship('User', back_populates='pool_memberships')
