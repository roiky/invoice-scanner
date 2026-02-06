import json
import os
from typing import List, Dict

SETTINGS_FILE = "backend/data/settings.json"

class SettingsService:
    def __init__(self):
        self._ensure_settings()

    def _ensure_settings(self):
        os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
        if not os.path.exists(SETTINGS_FILE):
             default_settings = {
                 "labels": ["Business", "Personal", "Hardware", "Software", "Office", "Travel"]
             }
             with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
                 json.dump(default_settings, f, indent=2)

    def _load(self) -> Dict:
        with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _save(self, data: Dict):
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

    def get_labels(self) -> List[str]:
        data = self._load()
        return data.get("labels", [])

    def add_label(self, label: str) -> List[str]:
        data = self._load()
        labels = data.get("labels", [])
        if label not in labels:
            labels.append(label)
            data["labels"] = labels
            self._save(data)
        return labels

    def delete_label(self, label: str) -> List[str]:
        data = self._load()
        labels = data.get("labels", [])
        if label in labels:
            labels.remove(label)
            data["labels"] = labels
            self._save(data)
        return labels

settings_service = SettingsService()
