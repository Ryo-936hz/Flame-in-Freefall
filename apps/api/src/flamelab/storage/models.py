from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class DatasetSnapshot(Base):
    __tablename__ = "dataset_snapshots"
    digest: Mapped[str] = mapped_column(String(64), primary_key=True)
    dataset_id: Mapped[str] = mapped_column(String(240))
    payload: Mapped[str] = mapped_column(Text)


class ActiveDataset(Base):
    __tablename__ = "active_dataset"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    digest: Mapped[str] = mapped_column(ForeignKey("dataset_snapshots.digest"))


class ResearchRun(Base):
    __tablename__ = "research_runs"
    id: Mapped[str] = mapped_column(String(240), primary_key=True)
    dataset_digest: Mapped[str] = mapped_column(ForeignKey("dataset_snapshots.digest"))
    payload: Mapped[str] = mapped_column(Text)
