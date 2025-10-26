# ShTw Server Utilities
# LICENSE: MIT
# Authors: mitko8009

import json
from typing import Any
import sqlite3

############################
### Configuration Scheme ###
############################

config_scheme = {
    "hostname": "localhost",
    "port": 5000
}

class Config:
    def __init__(self, path: str = "./config.json", scheme: dict = None):
        self.path = path
        self.scheme = scheme or config_scheme
        self.data = {}
        self.load()

    def load(self) -> None:
        try:
            with open(self.path, "r", encoding="utf-8") as fh:
                raw = json.load(fh)
        except FileNotFoundError:
            raise FileNotFoundError(f"Config file not found: {self.path}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in config file {self.path}: {e}")

        if not isinstance(raw, dict):
            raise TypeError(f"Config root must be an object/dict, got {type(raw).__name__}")

        # detect and append missing keys from scheme
        missing = [k for k in self.scheme.keys() if k not in raw]
        added_missing = False
        if missing:
            added_missing = True
            for k in missing:
                raw[k] = self.scheme[k]

        # Type validation
        wrong_types = []
        for key, default in self.scheme.items():
            val = raw.get(key)
            if default is None:
                continue
            expected_type = type(default)
            if expected_type is int:
                if not (isinstance(val, int) and not isinstance(val, bool)):
                    wrong_types.append((key, expected_type.__name__, type(val).__name__))
            else:
                if not isinstance(val, expected_type):
                    wrong_types.append((key, expected_type.__name__, type(val).__name__))

        if wrong_types:
            details = "; ".join(f"{k}: expected {exp}, got {got}" for k, exp, got in wrong_types)
            raise TypeError(f"Config type errors: {details}")

        self.data = raw

        # persist if we appended keys
        if added_missing:
            self.save()

    def save(self, path: str = None, *, indent: int = 2) -> None:
        out_path = path or self.path
        try:
            with open(out_path, "w", encoding="utf-8") as fh:
                json.dump(self.data, fh, indent=indent, ensure_ascii=False)
        except Exception as e:
            raise IOError(f"Failed to save config to {out_path}: {e}")

    def get(self, key: str, default: Any = None) -> Any:
        return self.data.get(key, default)

    def as_dict(self) -> dict:
        return dict(self.data)
    

################
### Database ###
################

class db:
    def __init__(self, path: str = "./database.db"):
        self.path = path
        self.conn = sqlite3.connect(self.path)
        self.cursor = self.conn.cursor()
        self._ensure_leaderboard_table()

    def _ensure_leaderboard_table(self) -> None:
        create_sql = """
        CREATE TABLE IF NOT EXISTS leaderboard (
            username TEXT PRIMARY KEY,
            rating REAL DEFAULT 0,
            grades REAL DEFAULT 0,
            N_positive_notes INTEGER DEFAULT 0,
            N_negative_notes INTEGER DEFAULT 0,
            passphrase TEXT,
            last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        self.cursor.execute(create_sql)
        self.conn.commit()

    def execute(self, query: str, params: tuple = ()) -> sqlite3.Cursor:
        return self.cursor.execute(query, params)

    def commit(self) -> None:
        self.conn.commit()

    def close(self) -> None:
        self.conn.close()

    def update_leaderboard_entry(self, username: str, rating: float, grades: float, N_positive_notes: int, N_negative_notes: int, passphrase: str) -> None:
        upsert_sql = """
        INSERT INTO leaderboard (username, rating, grades, N_positive_notes, N_negative_notes, passphrase, last_update)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(username) DO UPDATE SET
            rating=excluded.rating,
            grades=excluded.grades,
            N_positive_notes=excluded.N_positive_notes,
            N_negative_notes=excluded.N_negative_notes,
            passphrase=excluded.passphrase,
            last_update=CURRENT_TIMESTAMP;
        """
        self.cursor.execute(upsert_sql, (username, rating, grades, N_positive_notes, N_negative_notes, passphrase))
        self.conn.commit()

    def get_leaderboard(self) -> list[dict]:
        select_sql = """
        SELECT username, rating, grades, N_positive_notes, N_negative_notes, last_update
        FROM leaderboard
        ORDER BY rating DESC
        """
        self.cursor.execute(select_sql)
        rows = self.cursor.fetchall()
        result = []
        for row in rows:
            result.append({
                "username": row[0],
                "rating": row[1],
                "grades": row[2],
                "N_positive_notes": row[3],
                "N_negative_notes": row[4],
                "last_update": row[5]
            })
        return result
