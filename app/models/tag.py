"""
Tag model for note categorization.
"""
from typing import List as TypingList
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class Tag(Base):
    """Tag model for many-to-many relationship with notes."""
    
    __tablename__ = "tags"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False
    )
    
    # Relationships
    notes: Mapped[TypingList["Note"]] = relationship(
        "Note",
        secondary="note_tags",
        back_populates="tags",
        lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<Tag(id={self.id}, name={self.name})>"