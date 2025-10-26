# ShTw Server Utilities
# LICENSE: MIT
# Authors: mitko8009

import json
from typing import Any

############################
### Configuration Scheme ###
############################

config_scheme = {
    "hostname": "localhost",
    "port": 5000
}

class Config:
    def __init__(self, path: str = "config.json", scheme: dict = None):
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