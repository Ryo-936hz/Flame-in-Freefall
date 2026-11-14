"""Immutable dataset snapshots and persisted investigations."""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("dataset_snapshots", sa.Column("digest", sa.String(64), primary_key=True), sa.Column("dataset_id", sa.String(240), nullable=False), sa.Column("payload", sa.Text(), nullable=False))
    op.create_table("active_dataset", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("digest", sa.String(64), sa.ForeignKey("dataset_snapshots.digest"), nullable=False))
    op.create_table("research_runs", sa.Column("id", sa.String(240), primary_key=True), sa.Column("dataset_digest", sa.String(64), sa.ForeignKey("dataset_snapshots.digest"), nullable=False), sa.Column("payload", sa.Text(), nullable=False))


def downgrade():
    op.drop_table("research_runs")
    op.drop_table("active_dataset")
    op.drop_table("dataset_snapshots")
