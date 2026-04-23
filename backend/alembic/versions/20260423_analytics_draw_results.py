"""Create draw_results table

Revision ID: 20260423_analytics_draw_results
Revises: None
Create Date: 2026-04-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260423_analytics_draw_results"
down_revision = None  # Update with the last migration ID in your project
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "draw_results",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("lottery", sa.String(length=30), nullable=False),
        sa.Column("contest_number", sa.Integer(), nullable=False),
        sa.Column("draw_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("numbers", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(op.f("ix_draw_results_id"), "draw_results", ["id"], unique=False)
    op.create_index(op.f("ix_draw_results_lottery"), "draw_results", ["lottery"], unique=False)
    op.create_index(op.f("ix_draw_results_contest_number"), "draw_results", ["contest_number"], unique=False)
    op.create_index(op.f("ix_draw_results_draw_date"), "draw_results", ["draw_date"], unique=False)
    op.create_index(
        "ix_draw_results_lottery_contest",
        "draw_results",
        ["lottery", "contest_number"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_draw_results_lottery_contest", table_name="draw_results")
    op.drop_index(op.f("ix_draw_results_draw_date"), table_name="draw_results")
    op.drop_index(op.f("ix_draw_results_contest_number"), table_name="draw_results")
    op.drop_index(op.f("ix_draw_results_lottery"), table_name="draw_results")
    op.drop_index(op.f("ix_draw_results_id"), table_name="draw_results")
    op.drop_table("draw_results")
