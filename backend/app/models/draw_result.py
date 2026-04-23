from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class DrawResult(Base):
    __tablename__ = "draw_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lottery: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    contest_number: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    draw_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    numbers: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        Index("ix_draw_results_lottery_contest", "lottery", "contest_number", unique=True),
    )
