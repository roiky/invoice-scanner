from fastapi import FastAPI, Query, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
from .services.gmail_service import gmail_service
from .services.storage_service import storage_service
from .services.settings_service import settings_service
from .models import ScanResult, InvoiceData, Rule
from typing import List
from pydantic import BaseModel
import os
import shutil
import uuid
import time

app = FastAPI(title="Gmail Invoice Scanner")
app.mount("/files", StaticFiles(directory="backend/static/invoices"), name="files")

# Ensure static directory exists
os.makedirs("backend/static/invoices", exist_ok=True)
import shutil
from fastapi import UploadFile, File

# --- Auth Endpoints ---

@app.post("/auth/logout")
def logout():
    """Logs out by clearing credentials."""
    try:
        gmail_service.logout()
        return {"status": "success", "message": "Logged out successfully"}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
def login():
    """Forces authentication flow."""
    try:
        gmail_service.authenticate()
        # After auth, get profile
        return gmail_service.get_user_profile()
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/profile")
def get_profile():
    """Returns the connected user's email."""
    try:
        profile = gmail_service.get_user_profile()
        if not profile:
             # If no token or check fails, likely not authenticated
             return {"email": None}
        return profile
    except Exception as e:
        return {"email": None}

# ----------------------

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
    
    from .services.rule_service import rule_service # Import here to avoid circular
    
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
            # NEW Invoice found! Apply rules here.
            rule_service.apply_rules(fresh_inv)
            
            # Save new
            storage_service.save_invoice(fresh_inv)
            final_invoices.append(fresh_inv)
            
    return ScanResult(
        total_emails_scanned=scan_result.total_emails_scanned,
        invoices_found=len(final_invoices),
        invoices=final_invoices
    )

@app.get("/invoices", response_model=List[InvoiceData])
def get_invoices():
    """Returns all saved invoices from history"""
    return storage_service.get_all()

@app.put("/invoices/{invoice_id}", response_model=InvoiceData)
def update_invoice(invoice_id: str, invoice: InvoiceData):
    """Updates an invoice (status, amount, vendor, etc)"""
    # We treat the input as full object or partial? 
    # Usually easier to just take the dict
    print(f"Update payload: {invoice.model_dump()}")
    updated = storage_service.update_invoice(invoice_id, invoice.model_dump())
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

# --- Label Management ---

@app.get("/labels", response_model=List[str])
def get_labels():
    return settings_service.get_labels()

# --- Rules Endpoints ---
from .models import Rule
from .services.rule_service import rule_service

@app.get("/rules", response_model=List[Rule])
def get_rules():
    return rule_service.get_all_rules()

@app.post("/rules", response_model=Rule)
def create_rule(rule: Rule):
    return rule_service.create_rule(rule)

@app.put("/rules/{rule_id}", response_model=Rule)
def update_rule(rule_id: str, rule: Rule):
    updated = rule_service.update_rule(rule_id, rule)
    if not updated:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Rule not found")
    return updated

@app.delete("/rules/{rule_id}")
def delete_rule(rule_id: str):
    success = rule_service.delete_rule(rule_id)
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"status": "success"}

class LabelRequest(BaseModel):
    label: str

@app.post("/labels", response_model=List[str])
def add_label(req: LabelRequest):
    return settings_service.add_label(req.label)

@app.delete("/labels/{label}", response_model=List[str])
def delete_label(label: str):
    return settings_service.delete_label(label)

# --- Manual Entry ---

from fastapi import File, UploadFile, Form
import shutil
import uuid

@app.post("/invoices/manual", response_model=InvoiceData)
async def create_manual_invoice(
    vendor_name: str = Form(...),
    invoice_date: str = Form(...),
    total_amount: float = Form(...),
    subject: str = Form(None),
    currency: str = Form("ILS"),
    vat_amount: float = Form(0.0),
    status: str = Form("Pending"),
    labels: List[str] = Form([]),
    file: UploadFile = File(None)
):
    """
    Manually create an invoice, optionally uploading a file.
    """
    print(f"Manual Entry: {vendor_name} - {total_amount} - Status: {status} - Labels: {labels}")
    
    invoice_id = str(uuid.uuid4())
    download_url = None

    if file:
        print(f"Received file: {file.filename}, content_type: {file.content_type}")
        try:
            filename = f"manual_{invoice_id}_{file.filename}"
            file_path = os.path.join("backend/static/invoices", filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            download_url = f"http://127.0.0.1:8000/files/{filename}"
            print(f"Saved manual file to {file_path}")
        except Exception as e:
            print(f"Failed to save file: {e}")

    new_invoice = InvoiceData(
        id=invoice_id,
        filename=f"manual_{invoice_id}", # Required field
        sender_email="manual@entry",      # Required field
        invoice_date=invoice_date,
        vendor_name=vendor_name,
        total_amount=total_amount,
        currency=currency,
        vat_amount=vat_amount, 
        subject=subject or "Manual Entry",
        download_url=download_url,
        status=status,
        labels=labels
    )

    storage_service.save_invoice(new_invoice)
    return new_invoice

@app.post("/invoices/{invoice_id}/upload")
async def upload_invoice_file(invoice_id: str, file: UploadFile = File(...)):
    # Verify invoice exists
    invoice = storage_service.get_by_id(invoice_id)
    if not invoice:
        # If it's a new manual invoice that doesn't exist yet, we might need to handle differently
        # But usually we create the invoice first then upload? 
        # Or if the user is editing an existing one.
        pass # For now assume it exists or we just proceed if we want to allow standalone uploads

    # Generate filename
    # Sanitize filename
    safe_filename = "".join(c for c in file.filename if c.isalnum() or c in "._-").strip()
    # Unique prefix
    import time
    timestamp = int(time.time())
    new_filename = f"manual_{invoice_id}_{timestamp}_{safe_filename}"
    
    file_path = os.path.join("backend/static/invoices", new_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Construct URL
    # Use request.base_url ideally, but hardcoding for now as per other parts
    download_url = f"http://127.0.0.1:8000/files/{new_filename}"
    
    # Update invoice if it exists
    if invoice:
        updated_invoice = storage_service.update_invoice(invoice_id, {"download_url": download_url, "filename": new_filename})
        return updated_invoice
    
    return {"download_url": download_url, "filename": new_filename}
