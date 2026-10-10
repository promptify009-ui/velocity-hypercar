from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Car(Base):
    __tablename__ = "cars"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    base_price: Mapped[int] = mapped_column(Integer, nullable=False)  # INR
    horsepower: Mapped[int] = mapped_column(Integer, nullable=False)
    top_speed: Mapped[int] = mapped_column(Integer, nullable=False)  # km/h
    acceleration: Mapped[float] = mapped_column(Float, nullable=False)  # 0-100 km/h seconds
    handling: Mapped[int] = mapped_column(Integer, nullable=False)  # 0-100
    braking: Mapped[int] = mapped_column(Integer, nullable=False)  # 0-100
    image_url: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    model_url: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
