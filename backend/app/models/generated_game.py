from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class GeneratedGame(Base):
    __tablename__ = 'generated_games'

    id = Column(Integer, primary_key=True, index=True)
    lottery_type = Column(String(50), nullable=False)
    numbers = Column(JSON, nullable=False)
    score = Column(Integer, nullable=False)
    game_sum = Column(Integer, nullable=False)
    even_count = Column(Integer, nullable=False)
    filters = Column(JSON, nullable=False)
    source = Column(String(50), nullable=False, default='manual')
    ai_confidence = Column(Float, nullable=True)
    ai_notes = Column(Text, nullable=True)
    ai_provider_votes = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    pool_id = Column(Integer, ForeignKey('pools.id'), nullable=True)

    user = relationship('User', back_populates='generated_games')
    pool = relationship('Pool', back_populates='games')
