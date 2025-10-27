#!/usr/bin/env python3

import sqlite3
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # .../server
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "leaderboard.db")

os.makedirs(DATA_DIR, exist_ok=True)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# create table matching fields used in templates
cur.execute("""
CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  rating REAL DEFAULT 0,
  grades REAL DEFAULT 0,
  N_positive_notes INTEGER DEFAULT 0,
  N_negative_notes INTEGER DEFAULT 0,
  last_update TEXT
)
""")

# sample rows
now = datetime.utcnow().isoformat()
sample_rows = [
    ("alice", 1523.45, 4.50, 12, 1, now),
    ("bob",   1480.12, 4.10, 8,  2, now),
    ("carol", 1602.78, 4.85, 20, 0, now),
    ("dave",  1395.00, 3.75, 5,  5, now),
    ("eve",   1550.30, 4.60, 15, 3, now),
    ("frank", 1420.25, 3.90, 7,  4, now),
    ("grace", 1585.60, 4.70, 18, 2, now),
    ("heidi", 1499.99, 4.20, 10, 3, now),
    ("ivan",  1510.75, 4.30, 11, 2, now),
    ("judy",  1475.50, 4.00, 6,  4, now),
]

cur.executemany("""
INSERT INTO leaderboard
(username, rating, grades, N_positive_notes, N_negative_notes, last_update)
VALUES (?, ?, ?, ?, ?, ?)
""", sample_rows)

conn.commit()
print(f"Inserted {len(sample_rows)} rows into {DB_PATH}")
conn.close()
