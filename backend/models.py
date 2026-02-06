from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class InvoiceData(BaseModel):
    id: str
    filename: str
    sender_email: str
    subject: str
    
    # Extracted Fields
    invoice_date: Optional[date] = None
    vendor_name: Optional[str] = None
    total_amount: Optional[float] = None
    currency: str = "ILS"
    vat_amount: Optional[float] = None
    download_url: Optional[str] = None
    
    # Status
    status: str = "Pending" # Pending, Processed, Cancelled
    
class ScanResult(BaseModel):
    total_emails_scanned: int
    invoices_found: int
    invoices: List[InvoiceData]
