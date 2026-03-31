"""
Database configuration and session exports.

This file provides backward compatibility for imports expecting app.database.
Currently delegates to the database package structure.
"""

# Re-export common database items for backward compatibility
from app.database.__init__ import *  # noqa: F401, F403

__all__ = ["get_async_session", "async_engine", "async_session_maker"]