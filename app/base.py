"""
SQLAlchemy Base class for ORM models.

This module defines the Base class that all models inherit from.
Moved here to avoid circular imports between database and models modules.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass