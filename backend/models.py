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
    labels: List[str] = []
    comments: Optional[str] = None
    
    # Status
    status: str = "Pending" # Pending, Processed, Cancelled
    
class ScanResult(BaseModel):
    total_emails_scanned: int
    invoices_found: int
    invoices: List[InvoiceData]

# --- Rules Models ---
class RuleCondition(BaseModel):
    field: str  # e.g., "sender_email", "subject", "total_amount"
    operator: str # "contains", "equals", "starts_with", "ends_with", "gt", "lt"
    value: str

class RuleAction(BaseModel):
    action_type: str # "set_status", "add_label"
    value: str

class Rule(BaseModel):
    id: Optional[str] = None
    name: str
    conditions: List[RuleCondition]
    actions: List[RuleAction]
    is_active: bool = True
