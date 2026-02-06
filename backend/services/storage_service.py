import json
import os
from typing import List, Dict, Optional
from backend.models import InvoiceData

DB_FILE = "backend/data/invoices.json"

class StorageService:
    def __init__(self):
        self._ensure_db()

    def _ensure_db(self):
        os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
        if not os.path.exists(DB_FILE):
             with open(DB_FILE, 'w', encoding='utf-8') as f:
                 json.dump({}, f) # ID -> Invoice Mapping

    def _load(self) -> Dict[str, dict]:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _save(self, data: Dict[str, dict]):
        # Atomic-ish write: Serialize first to ensure valid JSON, then write
        # default=str handles date objects automatically if we missed manual conversion
        try:
            # Atomic-ish write: Serialize first to ensure valid JSON, then write
            json_str = json.dumps(data, indent=2, ensure_ascii=False, default=str)
            print(f"--- SAFE SAVE EXECUTED with {len(data)} items ---")
            with open(DB_FILE, 'w', encoding='utf-8') as f:
                f.write(json_str)
        except Exception as e:
            print(f"CRITICAL: Failed to save database: {e}")
            # Do not touch the file if serialization fails

    def get_all(self) -> List[InvoiceData]:
        data = self._load()
        # Convert dicts back to Pydantic models
        invoices = []
        for v in data.values():
             # Migration: is_processed -> status
             if "status" not in v:
                 if v.get("is_processed") is True:
                     v["status"] = "Processed"
                 else:
                     v["status"] = "Pending"
             
             # Handle date conversion if saved as string
             try:
                 invoices.append(InvoiceData(**v))
             except Exception as e:
                 print(f"Skipping invalid invoice {v.get('id')}: {e}")
                 
        return sorted(invoices, key=lambda x: x.id, reverse=True) # Sort mostly by ID (roughly time)

    def get_by_id(self, invoice_id: str) -> Optional[InvoiceData]:
        data = self._load()
        if invoice_id in data:
            return InvoiceData(**data[invoice_id])
        return None

    def save_invoice(self, invoice: InvoiceData):
        data = self._load()
        # Ensure dates are serialized
        model_data = invoice.model_dump()
        
        # Serialize dates to string for JSON
        if model_data.get('invoice_date'):
            model_data['invoice_date'] = str(model_data['invoice_date'])
            
        data[invoice.id] = model_data
        self._save(data)
    
    def bulk_save_or_update(self, invoices: List[InvoiceData], merge=True):
        """
        Saves new invoices. 
        If merge=True, it will NOT overwrite existing invoice STATUS or user-edited fields, 
        unless the new scan provides better data? 
        Actually, for 'History' logic: 
        - If ID exists, we probably want to KEEP the user's manual edits and status.
        - So we probably only want to insert if ID does NOT exist.
        - OR if explicitly requested to update.
        """
        data = self._load()
        for inv in invoices:
            if inv.id in data and merge:
                # Exists. Keep existing status?
                # Maybe keep everything unless we want to "Refresh" data?
                # For now, let's assume Scan should ONLY add new items
                continue
            
            # Save new
            model_data = inv.model_dump()
            if model_data.get('invoice_date'):
                model_data['invoice_date'] = str(model_data['invoice_date'])
            data[inv.id] = model_data
            
        self._save(data)

    def update_invoice(self, invoice_id: str, updates: dict):
        data = self._load()
        if invoice_id in data:
            # Merge updates
            current = data[invoice_id]
            current.update(updates)
            data[invoice_id] = current
            self._save(data)
            return InvoiceData(**current)
        return None

    def delete_invoice(self, invoice_id: str) -> bool:
        data = self._load()
        if invoice_id in data:
            del data[invoice_id]
            self._save(data)
            return True
        return False

storage_service = StorageService()
