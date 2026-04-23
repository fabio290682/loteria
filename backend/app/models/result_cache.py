from sqlalchemy import Column, DateTime, Integer, JSON, String, func

from app.db.session import Base


class ResultCache(Base):
    __tablename__ = 'result_cache'

    id = Column(Integer, primary_key=True, index=True)
    lottery_type = Column(String(50), index=True, nullable=False)
    contest = Column(Integer, nullable=False)
    draw_date = Column(String(30), nullable=True)
    numbers = Column(JSON, nullable=False)
    payload = Column(JSON, nullable=False)
    source = Column(String(50), nullable=False, default='remote')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
