"""
Note model with many-to-many tags relationship.
"""
from datetime import datetime
from typing import List as TypingList
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


# Many-to-many association table: note <-> tags
note_tags = Table(
    "note_tags",
    Base.metadata,
    Column("note_id", ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Note(Base):
    """Note model with title, content, tags, and user ownership."""
    
    __tablename__ = "notes"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(
        String(200),
        index=True,
        nullable=False
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default=""
    )
    is_pinned: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    color: Mapped[str] = mapped_column(
        String(7),
        nullable=True  # Optional hex color
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Relationships
    tags: Mapped[TypingList["Tag"]] = relationship(
        "Tag",
        secondary=note_tags,
        back_populates="notes",
        lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<Note(id={self.id}, title={self.title[:30]}..., user_id={self.user_id})>"