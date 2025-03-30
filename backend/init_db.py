#!/usr/bin/env python
"""
Database initialization script for the Zecret application.
Creates all necessary tables in the configured database.
"""

from models import init_db

if __name__ == "__main__":
    print("Initializing the database...")
    init_db()
    print("Database initialized successfully!")
    print("You can now run the application with 'python app.py'")