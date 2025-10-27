# ShTw Server Utilities
# LICENSE: MIT
# Authors: mitko8009

import json
from typing import Any
import sqlite3
import os

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
            added_missing = False
        except FileNotFoundError:
            raw = dict(self.scheme)
            added_missing = True
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in config file {self.path}: {e}")

        if not isinstance(raw, dict):
            raise TypeError(f"Config root must be an object/dict, got {type(raw).__name__}")

        # detect and append missing keys from scheme
        missing = [k for k in self.scheme.keys() if k not in raw]
        if missing:
            for k in missing:
                raw[k] = self.scheme[k]
            added_missing = True

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

        # persist if we appended keys or created the file
        if added_missing:
            self.save()

    def save(self, path: str = None, *, indent: int = 2) -> None:
        out_path = path or self.path
        # ensure parent directory exists
        parent = os.path.dirname(out_path)
        if parent:
            os.makedirs(parent, exist_ok=True)
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
    def __init__(self, path: str | None = None):
        base_dir = os.path.dirname(__file__)
        data_dir = os.path.join(base_dir, "data")
        os.makedirs(data_dir, exist_ok=True)
        self.path = path or os.path.join(data_dir, "leaderboard.db")
        self.conn = sqlite3.connect(self.path)
        self.cursor = self.conn.cursor()
        self._ensure_leaderboard_table()

    def _ensure_leaderboard_table(self) -> None:
        # create table if it doesn't exist (includes new columns: grades_raw, pupil_id, school)
        create_sql = """
        CREATE TABLE IF NOT EXISTS leaderboard (
            username TEXT PRIMARY KEY,
            rating REAL DEFAULT 0,
            grades REAL DEFAULT 0,
            grades_raw TEXT DEFAULT NULL,
            N_positive_notes INTEGER DEFAULT 0,
            N_negative_notes INTEGER DEFAULT 0,
            passphrase TEXT,
            pupil_id TEXT DEFAULT NULL,
            school TEXT DEFAULT NULL,
            last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        self.cursor.execute(create_sql)
        self.conn.commit()

        # Ensure backward-compatible additions: add missing columns if table already existed
        self.cursor.execute("PRAGMA table_info(leaderboard);")
        existing_cols = [row[1] for row in self.cursor.fetchall()]

        additions = []
        if "grades_raw" not in existing_cols:
            additions.append(("grades_raw", "TEXT"))
        if "pupil_id" not in existing_cols:
            additions.append(("pupil_id", "TEXT"))
        if "school" not in existing_cols:
            additions.append(("school", "TEXT"))

        for col_name, col_type in additions:
            alter_sql = f"ALTER TABLE leaderboard ADD COLUMN {col_name} {col_type} DEFAULT NULL;"
            try:
                self.cursor.execute(alter_sql)
            except Exception:
                pass
        if additions:
            self.conn.commit()

    def execute(self, query: str, params: tuple = ()) -> sqlite3.Cursor:
        return self.cursor.execute(query, params)

    def commit(self) -> None:
        self.conn.commit()

    def close(self) -> None:
        self.conn.close()

    def update_leaderboard_entry(self, username: str, rating: float, grades: float, grades_raw: str | None, N_positive_notes: int, N_negative_notes: int, passphrase: str, pupil_id: str | None = None, school: str | None = None) -> None:
        upsert_sql = """
        INSERT INTO leaderboard (username, rating, grades, grades_raw, N_positive_notes, N_negative_notes, passphrase, pupil_id, school, last_update)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(username) DO UPDATE SET
            rating=excluded.rating,
            grades=excluded.grades,
            grades_raw=excluded.grades_raw,
            N_positive_notes=excluded.N_positive_notes,
            N_negative_notes=excluded.N_negative_notes,
            passphrase=excluded.passphrase,
            pupil_id=excluded.pupil_id,
            school=excluded.school,
            last_update=CURRENT_TIMESTAMP;
        """
        self.cursor.execute(upsert_sql, (username, rating, grades, grades_raw, N_positive_notes, N_negative_notes, passphrase, pupil_id, school))
        self.conn.commit()

    def get_leaderboard(self) -> list[dict]:
        select_sql = """
        SELECT username, rating, grades, grades_raw, N_positive_notes, N_negative_notes, pupil_id, school, last_update
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
                "grades_raw": row[3],
                "N_positive_notes": row[4],
                "N_negative_notes": row[5],
                "pupil_id": row[6],
                "school": row[7],
                "last_update": row[8]
            })
        return result

    def get_entry(self, username: str) -> dict | None:
        self.cursor.execute(
            "SELECT username, passphrase, pupil_id FROM leaderboard WHERE username = ?",
            (username,)
        )
        row = self.cursor.fetchone()
        if not row:
            return None
        return {
            "username": row[0],
            "passphrase": row[1],
            "pupil_id": row[2]
        }

    def find_username_by_pupil_id(self, pupil_id: str) -> str | None:
        if not pupil_id:
            return None
        self.cursor.execute(
            "SELECT username FROM leaderboard WHERE pupil_id = ? LIMIT 1",
            (pupil_id,)
        )
        row = self.cursor.fetchone()
        return row[0] if row else None

    def delete_entry(self, username: str) -> bool:
        """Delete an entry by username. Returns True if a row was deleted."""
        try:
            self.cursor.execute("DELETE FROM leaderboard WHERE username = ?", (username,))
            deleted = self.cursor.rowcount
            if deleted:
                self.conn.commit()
            return bool(deleted)
        except Exception:
            return False
