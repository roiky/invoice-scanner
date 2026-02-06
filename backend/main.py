from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
from .services.gmail_service import gmail_service
from .services.storage_service import storage_service
from .models import ScanResult, InvoiceData
from typing import List

from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="Gmail Invoice Scanner")

# Ensure static dir exists
os.makedirs("backend/data", exist_ok=True)
os.makedirs("backend/static/invoices", exist_ok=True)
app.mount("/files", StaticFiles(directory="backend/static/invoices"), name="files")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; strict this in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/scan", response_model=ScanResult)
def scan_emails(start_date: date, end_date: date):
    """
    Scans emails for invoices in the given date range.
    Uses REAL Gmail API.
    Saves found invoices to History (Storage).
    Returns merged results (if invoice already exists in history, use that version).
    """
    # 1. Scan
    scan_result = gmail_service.scan_invoices(start_date, end_date)
    
    # 2. Merge with History
    # If an invoice from scan already exists in DB, we prefer the DB version 
    # (because it might have manual edits or Status updates)
    final_invoices = []
    
    # We also want to SAVE new ones to DB immediately? 
    # Yes, so they appear in history.
    
    # But wait, scan_invoices returns "Fresh" data. 
    # If I edit an invoice in history, I want the scan to show the EDITED version.
    
    for fresh_inv in scan_result.invoices:
        existing = storage_service.get_by_id(fresh_inv.id)
        if existing:
            # Use existing (it has the correct status and potentially manual edits)
            # BUT: If we downloaded a PDF now and existing didn't have URL? 
            # We might want to backfill the URL.
            if fresh_inv.download_url and not existing.download_url:
                storage_service.update_invoice(existing.id, {"download_url": fresh_inv.download_url})
                existing.download_url = fresh_inv.download_url
            
            final_invoices.append(existing)
        else:
            # New discovery!
            # Default status should be Pending (user requested default pending)
            fresh_inv.status = "Pending" 
            final_invoices.append(fresh_inv)
            storage_service.save_invoice(fresh_inv)
            
    scan_result.invoices = final_invoices
    return scan_result

@app.get("/invoices", response_model=List[InvoiceData])
def get_history():
    """Returns all saved invoices from history"""
    return storage_service.get_all()

@app.put("/invoices/{invoice_id}", response_model=InvoiceData)
def update_invoice(invoice_id: str, invoice_update: InvoiceData):
    """Updates an invoice (status, amount, vendor, etc)"""
    # We treat the input as full object or partial? 
    # Usually easier to just take the dict
    print(f"Update payload: {invoice_update.model_dump()}")
    updated = storage_service.update_invoice(invoice_id, invoice_update.model_dump())
    if not updated:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Invoice not found")
    return updated

@app.delete("/invoices/{invoice_id}")
def delete_invoice(invoice_id: str):
    """Deletes an invoice from history"""
    success = storage_service.delete_invoice(invoice_id)
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"status": "success", "id": invoice_id}
